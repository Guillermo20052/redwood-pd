import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocalMode, localDb, type CompletionRow } from '@/lib/local-db';
import {
  buildInitialCompletions,
  sumVerifiedHours,
  getCurrentLevelSlug,
  type CompletionMap,
} from '@/lib/verification';
import { getPathItem } from '@/lib/curriculum-path';
import { getEarnedTiers, type DiplomaTier } from '@/lib/diplomas';

type PairingSummary = {
  partId: string;
  partTitle: string;
  partnerName: string;
};

type CohortRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  subject: string | null;
  role: 'teacher' | 'admin';
  totalHours: number;
  level: string;
  lastActivity: string | null;
  earnedDiplomas: DiplomaTier[];
  pairings: PairingSummary[];
};

export async function GET() {
  if (isLocalMode()) {
    return NextResponse.json({ cohort: buildLocalCohort() });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
  }

  const { data: teachers } = await admin
    .from('profiles')
    .select('id, email, full_name, subject, role, updated_at')
    .eq('role', 'teacher');

  // Select * so pre-migration schemas (without partner_user_id / partner_name)
  // don't fail the whole query — missing columns simply won't appear on the row.
  const { data: allCompletions } = await admin
    .from('item_completions')
    .select('*');

  const { data: allDiplomas } = await admin
    .from('diploma_events')
    .select('user_id, tier');

  const cohort: CohortRow[] = (teachers || []).map((t) => {
    const userRows = (allCompletions || [])
      .filter((c) => c.user_id === t.id)
      .map((c) => ({
        item_key: c.item_key,
        status: c.status,
        verified_at: c.verified_at,
        partner_user_id: typeof c.partner_user_id === 'string' ? c.partner_user_id : undefined,
        partner_name: typeof c.partner_name === 'string' ? c.partner_name : undefined,
      })) as CompletionRow[];
    return buildCohortRow(
      {
        id: t.id,
        email: t.email,
        full_name: t.full_name ?? null,
        subject: t.subject ?? null,
        role: (t.role as 'teacher' | 'admin') ?? 'teacher',
      },
      userRows,
      ((allDiplomas || []).filter((d) => d.user_id === t.id).map((d) => d.tier)) as DiplomaTier[]
    );
  });

  return NextResponse.json({ cohort });
}

function buildLocalCohort(): CohortRow[] {
  const profiles = localDb.listProfiles();
  if (profiles.length === 0) {
    // In a fresh local install no profile row exists yet; surface the
    // anonymous local-dev-user so the admin UI isn't empty during testing.
    const userId = 'local-dev-user';
    return [
      buildCohortRow(
        {
          id: userId,
          email: 'local@redwood.dev',
          full_name: 'Docente local',
          subject: null,
          role: 'teacher',
        },
        localDb.getCompletions(userId),
        localDb.listDiplomaEvents(userId).map((e) => e.tier)
      ),
    ];
  }
  return profiles
    .filter((p) => p.role === 'teacher')
    .map((p) =>
      buildCohortRow(
        {
          id: p.id,
          email: p.email,
          full_name: p.full_name ?? null,
          subject: p.subject ?? null,
          role: p.role,
        },
        localDb.getCompletions(p.id),
        localDb.listDiplomaEvents(p.id).map((e) => e.tier)
      )
    );
}

type ProfileLite = {
  id: string;
  email: string;
  full_name: string | null;
  subject: string | null;
  role: 'teacher' | 'admin';
};

function buildCohortRow(
  profile: ProfileLite,
  rows: CompletionRow[],
  recordedTiers: DiplomaTier[]
): CohortRow {
  const map: CompletionMap = buildInitialCompletions(rows);
  const totalHours = sumVerifiedHours(map);
  const level = getCurrentLevelSlug(map);
  const lastActivity = rows.reduce<string | null>((acc, r) => {
    if (!r.verified_at) return acc;
    if (!acc || r.verified_at > acc) return r.verified_at;
    return acc;
  }, null);
  // Prefer diploma_events as source of truth; fall back to hours-derived tiers
  // for older accounts where the event log wasn't populated.
  const earnedDiplomas =
    recordedTiers.length > 0
      ? Array.from(new Set(recordedTiers)).sort((a, b) => a - b)
      : getEarnedTiers(totalHours, map);
  const pairings = buildPairings(rows);
  return {
    user_id: profile.id,
    email: profile.email,
    full_name: profile.full_name ?? null,
    subject: profile.subject ?? null,
    role: profile.role,
    totalHours,
    level,
    lastActivity,
    earnedDiplomas,
    pairings,
  };
}

function buildPairings(rows: CompletionRow[]): PairingSummary[] {
  const out: PairingSummary[] = [];
  for (const r of rows) {
    if (r.status !== 'verified') continue;
    const name = (r.partner_name ?? '').trim();
    if (!name) continue;
    const item = getPathItem(r.item_key);
    if (!item || item.type !== 'task' || !item.collaborative) continue;
    out.push({
      partId: item.partId ?? r.item_key,
      partTitle: item.partTitle ?? item.label,
      partnerName: name,
    });
  }
  // Sort by partNumber/level for a stable, readable order in the UI.
  return out.sort((a, b) => a.partId.localeCompare(b.partId));
}
