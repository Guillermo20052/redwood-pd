import { NextResponse } from 'next/server';
import { getSessionUserId, loadCompletions } from '@/lib/completions-service';
import { isLocalMode, localDb } from '@/lib/local-db';
import { createClient } from '@/lib/supabase/server';
import { sumVerifiedHours } from '@/lib/verification';
import {
  getDiploma,
  getEarnedTiers,
  isDiplomaTierEarned,
  type DiplomaTier,
} from '@/lib/diplomas';
import { meetsDiploma3ExtrasRequirement } from '@/lib/extras-gating';
import { isAdminUser } from '@/lib/auth-helpers';

const TIERS = new Set<DiplomaTier>([1, 2, 3]);

/**
 * GET /api/diplomas → { earned: [1, 2, ...] }
 * Returns the tiers for which an event has been recorded for the current user.
 */
export async function GET() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isLocalMode()) {
    const events = localDb.listDiplomaEvents(session.userId);
    const earned = Array.from(new Set(events.map((e) => e.tier))).sort();
    return NextResponse.json({ earned });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('diploma_events')
      .select('tier')
      .eq('user_id', session.userId);
    if (error) throw error;
    const earned = Array.from(new Set((data ?? []).map((r) => r.tier as DiplomaTier))).sort();
    return NextResponse.json({ earned });
  } catch (e) {
    // Don't break the UI if diploma_events isn't reachable.
    console.error('GET /api/diplomas failed:', (e as Error).message);
    return NextResponse.json({ earned: [] });
  }
}

/**
 * POST /api/diplomas { tier } → records a diploma event idempotently.
 * Server-side it re-verifies that the teacher actually has enough hours for
 * the requested tier; the client is not trusted to claim arbitrary tiers.
 */
export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { tier?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const tier = body.tier as DiplomaTier;
  if (!TIERS.has(tier)) {
    return NextResponse.json({ error: 'tier debe ser 1, 2 o 3' }, { status: 400 });
  }

  // Admins never earn diplomas — they navigate for inspection only.
  const adminCheck = await isAdminUser(session.userId);
  if (adminCheck) {
    return NextResponse.json({ ok: false, adminSkip: true });
  }

  // Server-side gate: don't trust the client's claim. Recompute hours.
  const completions = await loadCompletions(session.userId);
  const totalHours = sumVerifiedHours(completions);
  if (!isDiplomaTierEarned(tier, totalHours, completions)) {
    const hoursOk = totalHours >= getDiploma(tier).hoursRequired;
    let msg = 'Aún no has alcanzado los requisitos para este diploma.';
    if (hoursOk && tier === 1) {
      msg =
        'Tienes las horas, pero faltan tareas Level Up (4 de Nivel 1 y 4 de Nivel 2) para este diploma.';
    } else if (hoursOk && tier === 3 && !meetsDiploma3ExtrasRequirement(completions)) {
      msg =
        'Tienes las 30h, pero faltan al menos 4 tareas Level Up del Nivel 3 para el Diploma de Oro.';
    } else if (hoursOk) {
      msg =
        'Tienes las horas, pero faltan tareas Level Up obligatorias para este diploma.';
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (isLocalMode()) {
    const created = localDb.recordDiplomaEvent(session.userId, tier, totalHours);
    return NextResponse.json({ ok: true, created, tier });
  }

  try {
    const supabase = await createClient();
    // Idempotency: select first.
    const { data: existing, error: selErr } = await supabase
      .from('diploma_events')
      .select('id')
      .eq('user_id', session.userId)
      .eq('tier', tier)
      .limit(1);
    if (selErr) throw selErr;
    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, created: false, tier });
    }
    const { error: insErr } = await supabase.from('diploma_events').insert({
      user_id: session.userId,
      tier,
      hours_at_award: Math.round(totalHours * 10) / 10,
    });
    if (insErr) throw insErr;
    return NextResponse.json({ ok: true, created: true, tier });
  } catch (e) {
    // Event-log failure must not break the UI. Diploma still appears unlocked
    // because hours satisfy the threshold; this is a nice-to-have audit row.
    console.error('POST /api/diplomas failed:', (e as Error).message);
    return NextResponse.json({ ok: false, error: 'No se pudo registrar el evento.' }, { status: 200 });
  }
}
