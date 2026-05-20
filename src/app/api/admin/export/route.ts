import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isLocalMode,
  localDb,
  type CompletionRow,
  type DiplomaEvent,
} from '@/lib/local-db';
import {
  buildInitialCompletions,
  getCurrentLevelSlug,
  sumVerifiedHours,
} from '@/lib/verification';
import { getPartsByLevel } from '@/lib/curriculum-path';

type Tier = 1 | 2 | 3;
type ProfileLite = {
  id: string;
  email: string;
  full_name: string | null;
  subject: string | null;
  role: 'teacher' | 'admin';
};

const CSV_HEADER = [
  'user_id',
  'email',
  'full_name',
  'subject',
  'role',
  'total_hours',
  'current_level',
  'last_activity',
  'diploma_1_earned_at',
  'diploma_2_earned_at',
  'diploma_3_earned_at',
  'parts_completed',
].join(',');

const ALL_PARTS = [
  ...getPartsByLevel('b'),
  ...getPartsByLevel('i'),
  ...getPartsByLevel('a'),
];

export async function GET() {
  const rows = isLocalMode() ? buildLocalRows() : await buildSupabaseRows();
  if (rows instanceof NextResponse) return rows;

  const csv = [CSV_HEADER, ...rows].join('\n');
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="redwood-pd-cohort-${today}.csv"`,
    },
  });
}

function buildLocalRows(): string[] {
  const profiles = localDb.listProfiles();
  const seed: ProfileLite[] =
    profiles.length > 0
      ? profiles.map((p) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name ?? null,
          subject: p.subject ?? null,
          role: p.role,
        }))
      : [
          {
            id: 'local-dev-user',
            email: 'local@redwood.dev',
            full_name: 'Docente local',
            subject: null,
            role: 'teacher',
          },
        ];

  return seed.map((p) => {
    const rows = localDb.getCompletions(p.id);
    const events = localDb.listDiplomaEvents(p.id);
    return rowToCsv(p, rows, events);
  });
}

async function buildSupabaseRows(): Promise<string[] | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
  }

  const { data: teachers } = await admin
    .from('profiles')
    .select('id, email, full_name, subject, role')
    .eq('role', 'teacher');

  const { data: completions } = await admin
    .from('item_completions')
    .select('user_id, item_key, status, verified_at');

  const { data: diplomas } = await admin
    .from('diploma_events')
    .select('user_id, tier, hours_at_award, awarded_at');

  return (teachers || []).map((t) => {
    const userRows = (completions || [])
      .filter((c) => c.user_id === t.id)
      .map((c) => ({
        item_key: c.item_key,
        status: c.status,
        verified_at: c.verified_at,
      })) as CompletionRow[];
    const userEvents = (diplomas || [])
      .filter((d) => d.user_id === t.id)
      .map((d) => ({
        user_id: d.user_id,
        tier: d.tier,
        hours_at_award: d.hours_at_award,
        awarded_at: d.awarded_at,
      })) as DiplomaEvent[];
    return rowToCsv(
      {
        id: t.id,
        email: t.email,
        full_name: t.full_name ?? null,
        subject: t.subject ?? null,
        role: (t.role as 'teacher' | 'admin') ?? 'teacher',
      },
      userRows,
      userEvents
    );
  });
}

function rowToCsv(profile: ProfileLite, rows: CompletionRow[], events: DiplomaEvent[]): string {
  const map = buildInitialCompletions(rows);
  const totalHours = sumVerifiedHours(map);
  const level = getCurrentLevelSlug(map);
  const lastActivity = rows.reduce<string | null>((acc, r) => {
    if (!r.verified_at) return acc;
    if (!acc || r.verified_at > acc) return r.verified_at;
    return acc;
  }, null);
  const diplomaAt = (tier: Tier) =>
    events.find((e) => e.tier === tier)?.awarded_at ?? '';
  const partsCompleted = ALL_PARTS.filter((p) =>
    p.items.every((it) => map[it.itemKey]?.status === 'verified')
  ).length;

  return [
    csv(profile.id),
    csv(profile.email),
    csv(profile.full_name ?? ''),
    csv(profile.subject ?? ''),
    csv(profile.role),
    String(totalHours),
    csv(level),
    csv(lastActivity ?? ''),
    csv(diplomaAt(1)),
    csv(diplomaAt(2)),
    csv(diplomaAt(3)),
    String(partsCompleted),
  ].join(',');
}

function csv(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}
