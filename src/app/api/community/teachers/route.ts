import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUserId, loadCompletions } from '@/lib/completions-service';
import { isLocalMode, localDb, type CompletionRow } from '@/lib/local-db';
import { getDiplomaTier } from '@/lib/progress';
import {
  getCurrentLevelSlug,
  buildInitialCompletions,
  sumCohortVerifiedHours,
} from '@/lib/verification';
import { metaConfig } from '@/lib/content';

const levelNames: Record<string, string> = {
  b: 'Nivel 1 · Fundamentos',
  i: 'Nivel 2 · Integración',
  a: 'Nivel 3 · Transformación',
};

type TeacherRow = {
  user_id: string;
  full_name: string;
  subject: string;
  totalHours: number;
  level: string;
  levelName: string;
  progressPct: number;
  lastActivity: string | null;
  diplomaTier: number;
  // Back-compat aliases for any older client expecting the previous shape.
  id: string;
  hours: number;
  levelSlug: string;
};

function buildRow(
  profile: {
    id: string;
    full_name?: string | null;
    subject?: string | null;
    updated_at?: string | null;
  },
  completionRows: CompletionRow[]
): TeacherRow {
  const map = buildInitialCompletions(completionRows);
  const totalHours = sumCohortVerifiedHours(map);
  const slug = getCurrentLevelSlug(map);
  const goal = metaConfig.programMaxHours || 30;
  const progressPct = Math.min(100, Math.round((totalHours / goal) * 1000) / 10);
  const lastActivity = computeLastActivity(completionRows, profile.updated_at ?? null);
  return {
    user_id: profile.id,
    full_name: profile.full_name || 'Docente',
    subject: profile.subject || '',
    totalHours,
    level: slug,
    levelName: levelNames[slug] || slug,
    progressPct,
    lastActivity,
    diplomaTier: getDiplomaTier(totalHours, map),
    // back-compat aliases
    id: profile.id,
    hours: totalHours,
    levelSlug: slug,
  };
}

function computeLastActivity(
  rows: CompletionRow[],
  profileUpdated: string | null
): string | null {
  let max: string | null = null;
  for (const r of rows) {
    if (r.status !== 'verified' || !r.verified_at) continue;
    if (!max || r.verified_at > max) max = r.verified_at;
  }
  if (max) return max;
  return profileUpdated ?? null;
}

function sortTeachers(rows: TeacherRow[]): TeacherRow[] {
  return rows.sort((a, b) => {
    if (b.totalHours !== a.totalHours) return b.totalHours - a.totalHours;
    const aT = a.lastActivity ? Date.parse(a.lastActivity) : 0;
    const bT = b.lastActivity ? Date.parse(b.lastActivity) : 0;
    return bT - aT;
  });
}

export async function GET() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isLocalMode()) {
    let profiles = localDb.listProfiles().filter((p) => p.role === 'teacher');
    // In a fresh local install no profile row exists yet; surface the
    // local-dev-user so the leaderboard isn't empty during testing.
    if (profiles.length === 0) {
      profiles = [
        {
          id: session.userId,
          email: session.email,
          full_name: 'Docente local',
          subject: '',
          role: 'teacher',
        },
      ];
    }
    const teachers = profiles.map((p) =>
      buildRow(
        {
          id: p.id,
          full_name: p.full_name ?? null,
          subject: p.subject ?? null,
          updated_at: p.updated_at ?? null,
        },
        localDb.getCompletions(p.id)
      )
    );
    return NextResponse.json({
      teachers: sortTeachers(teachers),
      currentUserId: session.userId,
    });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, subject, updated_at')
    .eq('role', 'teacher');

  const teachers = await Promise.all(
    (profiles || []).map(async (p) => {
      const full = await loadCompletions(p.id);
      // loadCompletions already returns a CompletionMap with locked/available
      // padding; convert back to verified-only rows to keep lastActivity
      // computation honest.
      const rows = Object.values(full);
      return buildRow(
        {
          id: p.id,
          full_name: p.full_name ?? null,
          subject: p.subject ?? null,
          updated_at: p.updated_at ?? null,
        },
        rows
      );
    })
  );

  return NextResponse.json({
    teachers: sortTeachers(teachers),
    currentUserId: session.userId,
  });
}
