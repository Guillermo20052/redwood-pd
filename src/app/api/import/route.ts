import { NextResponse } from 'next/server';
import {
  getSessionUserId,
  loadCompletions,
  saveCompletions,
  saveProfile,
} from '@/lib/completions-service';
import { isLocalMode, localDb } from '@/lib/local-db';
import { buildInitialCompletions, type CompletionMap } from '@/lib/verification';
import { getPathItem } from '@/lib/curriculum-path';

/**
 * Maps legacy HTML-app item keys (booleans in `pd`) to the new curriculum path
 * itemKeys used by `item_completions`. Best-effort: the legacy checklist had
 * ~15 items per level whereas the new path has 5 parts × 3 stages, so we
 * collapse every ~3 legacy items into a single new task and bucket sequential
 * videos into the 5 parts of their level.
 *
 * Anything in the legacy payload that doesn't appear here is returned to the
 * caller under `unmapped` so the teacher knows what didn't carry over.
 */
const LEGACY_TO_NEW: Record<string, string> = {
  // --- Level B (Básico) checklist: 15 → 5 parts, collapse every 3 ---
  'cb-b1': 'lvl-b-p1-task',
  'cb-b2': 'lvl-b-p1-task',
  'cb-b3': 'lvl-b-p1-task',
  'cb-b4': 'lvl-b-p2-task',
  'cb-b5': 'lvl-b-p2-task',
  'cb-b6': 'lvl-b-p2-task',
  'cb-b7': 'lvl-b-p3-task',
  'cb-b8': 'lvl-b-p3-task',
  'cb-b9': 'lvl-b-p3-task',
  'cb-b10': 'lvl-b-p4-task',
  'cb-b11': 'lvl-b-p4-task',
  'cb-b12': 'lvl-b-p4-task',
  'cb-b13': 'lvl-b-p5-task',
  'cb-b14': 'lvl-b-p5-task',
  'cb-b15': 'lvl-b-p5-task',

  // --- Level I (Intermedio) checklist: 14 → 5 parts, collapse ~3 ---
  'cb-i1': 'lvl-i-p1-task',
  'cb-i2': 'lvl-i-p1-task',
  'cb-i3': 'lvl-i-p1-task',
  'cb-i4': 'lvl-i-p2-task',
  'cb-i5': 'lvl-i-p2-task',
  'cb-i6': 'lvl-i-p2-task',
  'cb-i7': 'lvl-i-p3-task',
  'cb-i8': 'lvl-i-p3-task',
  'cb-i9': 'lvl-i-p3-task',
  'cb-i10': 'lvl-i-p4-task',
  'cb-i11': 'lvl-i-p4-task',
  'cb-i12': 'lvl-i-p4-task',
  'cb-i13': 'lvl-i-p5-task',
  'cb-i14': 'lvl-i-p5-task',

  // --- Level A (Avanzado) checklist: 15 → 5 parts, collapse every 3 ---
  'cb-a1': 'lvl-a-p1-task',
  'cb-a2': 'lvl-a-p1-task',
  'cb-a3': 'lvl-a-p1-task',
  'cb-a4': 'lvl-a-p2-task',
  'cb-a5': 'lvl-a-p2-task',
  'cb-a6': 'lvl-a-p2-task',
  'cb-a7': 'lvl-a-p3-task',
  'cb-a8': 'lvl-a-p3-task',
  'cb-a9': 'lvl-a-p3-task',
  'cb-a10': 'lvl-a-p4-task',
  'cb-a11': 'lvl-a-p4-task',
  'cb-a12': 'lvl-a-p4-task',
  'cb-a13': 'lvl-a-p5-task',
  'cb-a14': 'lvl-a-p5-task',
  'cb-a15': 'lvl-a-p5-task',

  // --- Legacy videos (vc001..vc037): bucket by sequence into 5 parts per level
  // Level B: vc001..vc019 → 5 parts (≈4/part)
  vc001: 'lvl-b-p1-video',
  vc002: 'lvl-b-p1-video',
  vc003: 'lvl-b-p1-video',
  vc004: 'lvl-b-p2-video',
  vc005: 'lvl-b-p2-video',
  vc006: 'lvl-b-p2-video',
  vc007: 'lvl-b-p2-video',
  vc008: 'lvl-b-p3-video',
  vc009: 'lvl-b-p3-video',
  vc010: 'lvl-b-p3-video',
  vc011: 'lvl-b-p3-video',
  vc012: 'lvl-b-p4-video',
  vc013: 'lvl-b-p4-video',
  vc014: 'lvl-b-p4-video',
  vc015: 'lvl-b-p4-video',
  vc016: 'lvl-b-p5-video',
  vc017: 'lvl-b-p5-video',
  vc018: 'lvl-b-p5-video',
  vc019: 'lvl-b-p5-video',
  // Level I: vc020..vc028 → 5 parts (≈2/part)
  vc020: 'lvl-i-p1-video',
  vc021: 'lvl-i-p1-video',
  vc022: 'lvl-i-p2-video',
  vc023: 'lvl-i-p2-video',
  vc024: 'lvl-i-p3-video',
  vc025: 'lvl-i-p3-video',
  vc026: 'lvl-i-p4-video',
  vc027: 'lvl-i-p4-video',
  vc028: 'lvl-i-p5-video',
  // Level A: vc029..vc037 → 5 parts (≈2/part)
  vc029: 'lvl-a-p1-video',
  vc030: 'lvl-a-p1-video',
  vc031: 'lvl-a-p2-video',
  vc032: 'lvl-a-p2-video',
  vc033: 'lvl-a-p3-video',
  vc034: 'lvl-a-p3-video',
  vc035: 'lvl-a-p4-video',
  vc036: 'lvl-a-p4-video',
  vc037: 'lvl-a-p5-video',
};

/** Profile-field legacy keys: routed to profile, not progress. */
const PROFILE_KEYS = new Set(['tf-name', 'tf-subject', 'tf-date']);

type LegacyExport = {
  version?: number;
  pd?: string;
  ref?: string;
};

type LegacyReflection = {
  id?: number;
  date?: string;
  sess?: string;
  lvl?: number;
  q1?: string;
  q2?: string;
  q3?: string;
  obs?: string;
};

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let payload: LegacyExport;
  try {
    payload = (await request.json()) as LegacyExport;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const unmapped: string[] = [];
  let importedCompletions = 0;
  let importedReflections = 0;

  // ---- PD: legacy checkboxes → item_completions (verified) ----
  if (payload.pd) {
    let state: Record<string, unknown>;
    try {
      state = JSON.parse(payload.pd) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid pd JSON' }, { status: 400 });
    }

    const verifiedKeys = new Set<string>();
    const profilePatch: { full_name?: string; subject?: string; start_date?: string } = {};

    for (const [key, val] of Object.entries(state)) {
      if (PROFILE_KEYS.has(key)) {
        if (typeof val === 'string' && val) {
          if (key === 'tf-name') profilePatch.full_name = val;
          else if (key === 'tf-subject') profilePatch.subject = val;
          else if (key === 'tf-date') profilePatch.start_date = val;
        }
        continue;
      }
      if (val !== true) continue;

      // Already a new-style itemKey? Use directly.
      if (getPathItem(key)) {
        verifiedKeys.add(key);
        continue;
      }
      // Legacy key with a known mapping?
      const mapped = LEGACY_TO_NEW[key];
      if (mapped && getPathItem(mapped)) {
        verifiedKeys.add(mapped);
        continue;
      }
      unmapped.push(key);
    }

    // Merge into existing completions and re-run the unlock chain so any newly
    // verified items propagate `available` to their successors. We preserve the
    // verified rows as-is (including any AI scores already stored) and only
    // overlay new verifications.
    const current = await loadCompletions(session.userId);
    const merged: CompletionMap = { ...current };
    const nowIso = new Date().toISOString();
    for (const itemKey of verifiedKeys) {
      const existing = merged[itemKey];
      if (existing?.status === 'verified') continue; // don't overwrite a real verification
      merged[itemKey] = {
        item_key: itemKey,
        status: 'verified',
        verified_at: nowIso,
        evidence_text: '(importado del PD legacy)',
      };
      importedCompletions++;
    }
    const rebuilt = buildInitialCompletions(Object.values(merged));
    await saveCompletions(session.userId, rebuilt);

    if (Object.keys(profilePatch).length > 0) {
      try {
        await saveProfile(session.userId, profilePatch);
      } catch {
        // Profile updates are best-effort during import; failures here must
        // not abort the progress import.
      }
    }
  }

  // ---- REF: legacy reflection log → reflections (local or Supabase) ----
  if (payload.ref) {
    let entries: LegacyReflection[];
    try {
      entries = JSON.parse(payload.ref) as LegacyReflection[];
    } catch {
      return NextResponse.json({ error: 'Invalid ref JSON' }, { status: 400 });
    }
    if (!Array.isArray(entries)) entries = [];

    for (const e of entries) {
      const level = clampLevel(e.lvl);
      if (isLocalMode()) {
        localDb.insertReflection(session.userId, {
          level,
          session_date: e.date || null,
          session_title: e.sess || null,
          q1: e.q1 || null,
          q2: e.q2 || null,
          q3: e.q3 || null,
          notes: e.obs || null,
        });
        importedReflections++;
      } else {
        // Supabase mode: lazy-import to avoid pulling the server client in
        // local-mode unit tests.
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { error } = await supabase.from('reflections').insert({
          user_id: session.userId,
          level,
          session_date: e.date || null,
          session_title: e.sess || null,
          q1: e.q1 || null,
          q2: e.q2 || null,
          q3: e.q3 || null,
          notes: e.obs || null,
        });
        if (!error) importedReflections++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    imported: {
      completions: importedCompletions,
      reflections: importedReflections,
    },
    unmapped,
  });
}

function clampLevel(input: unknown): number {
  if (typeof input === 'number' && input >= 1 && input <= 3) return Math.round(input);
  if (typeof input === 'string') {
    const map: Record<string, number> = { b: 1, i: 2, a: 3 };
    if (input in map) return map[input];
    const n = Number(input);
    if (!Number.isNaN(n) && n >= 1 && n <= 3) return Math.round(n);
  }
  return 1;
}
