import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isLocalMode,
  localDb,
  type CompletionRow,
  type EvaluationRow,
  type ReflectionRow,
} from '@/lib/local-db';
import { isTeacherProfile } from '@/lib/teacher-profiles';
import {
  buildInitialCompletions,
  sumVerifiedHours,
  getCurrentLevelSlug,
  type CompletionMap,
} from '@/lib/verification';
import { curriculumPath, getPartsByLevel } from '@/lib/curriculum-path';
import { getEarnedTiers } from '@/lib/diplomas';
import {
  buildDiploma3ProgramRequirements,
  type Diploma3ProgramRequirements,
} from '@/lib/diploma3-requirements';
import { countCompletedExtras } from '@/lib/extras-gating';

type RouteContext = { params: Promise<{ userId: string }> };

export type AdminTeacherDetailResponse = {
  teacher: {
    id: string;
    email: string;
    full_name: string | null;
    subject: string | null;
    start_date: string | null;
    etica_read_at: string | null;
    welcome_cynthia_read_at: string | null;
    welcome_pope_read_at: string | null;
    welcome_about_read_at: string | null;
    tour_completed_at: string | null;
  };
  summary: {
    totalHours: number;
    currentLevel: string;
    progressPct: number;
    partsCompleted: number;
    partsTotal: number;
    earnedTiers: (1 | 2 | 3)[];
    lastActivity: string | null;
    extrasByLevel: Record<'b' | 'i' | 'a', { done: number; total: number }>;
  };
  diplomaEvents: Array<{ tier: 1 | 2 | 3; awarded_at: string; hours_at_award: number }>;
  diploma3Program: Diploma3ProgramRequirements;
  completions: CompletionRow[];
  reflections: ReflectionRow[];
  evaluation: EvaluationRow | null;
};

function mapCompletionRow(c: Record<string, unknown>): CompletionRow {
  return {
    item_key: String(c.item_key),
    status: c.status as CompletionRow['status'],
    verified_at: typeof c.verified_at === 'string' ? c.verified_at : undefined,
    evidence_text: typeof c.evidence_text === 'string' ? c.evidence_text : undefined,
    video_watch_pct: typeof c.video_watch_pct === 'number' ? c.video_watch_pct : undefined,
    task_score: typeof c.task_score === 'number' ? c.task_score : undefined,
    task_feedback: typeof c.task_feedback === 'string' ? c.task_feedback : undefined,
    partner_user_id: typeof c.partner_user_id === 'string' ? c.partner_user_id : undefined,
    partner_name: typeof c.partner_name === 'string' ? c.partner_name : undefined,
    task_input_type: c.task_input_type as CompletionRow['task_input_type'],
    task_file_url: typeof c.task_file_url === 'string' ? c.task_file_url : undefined,
    is_admin_skip: c.is_admin_skip === true,
    reflection_ai_feedback:
      typeof c.reflection_ai_feedback === 'string' ? c.reflection_ai_feedback : undefined,
  };
}

function buildSummary(completionMap: CompletionMap, rawCompletions: CompletionRow[]) {
  const totalHours = sumVerifiedHours(completionMap);
  const currentLevel = getCurrentLevelSlug(completionMap);
  const progressPct = Math.min(100, Math.round((totalHours / 30) * 1000) / 10);

  const verifiedKeys = new Set(
    rawCompletions.filter((r) => r.status === 'verified').map((r) => r.item_key)
  );
  const STAGES_PER_PART = 3;
  const partCounts = new Map<string, number>();
  for (const item of curriculumPath) {
    if (!verifiedKeys.has(item.itemKey)) continue;
    const partId = item.partId ?? item.itemKey;
    partCounts.set(partId, (partCounts.get(partId) ?? 0) + 1);
  }
  let partsCompleted = 0;
  for (const [, count] of partCounts) {
    if (count >= STAGES_PER_PART) partsCompleted++;
  }

  const partGroups = [
    ...getPartsByLevel('b'),
    ...getPartsByLevel('i'),
    ...getPartsByLevel('a'),
  ];

  const lastActivity = rawCompletions.reduce<string | null>((acc, r) => {
    if (!r.verified_at) return acc;
    if (!acc || r.verified_at > acc) return r.verified_at;
    return acc;
  }, null);

  return {
    totalHours,
    currentLevel,
    progressPct,
    partsCompleted,
    partsTotal: partGroups.length,
    lastActivity,
    extrasByLevel: {
      b: { done: countCompletedExtras('b', completionMap), total: 10 },
      i: { done: countCompletedExtras('i', completionMap), total: 10 },
      a: { done: countCompletedExtras('a', completionMap), total: 10 },
    },
  };
}

function buildLocalResponse(userId: string): AdminTeacherDetailResponse | null {
  const profile = localDb.getProfile(userId);
  if (!profile || !isTeacherProfile(profile.role)) return null;

  const rawCompletions = localDb.getCompletions(userId);
  const completionMap = buildInitialCompletions(rawCompletions);
  const summaryBase = buildSummary(completionMap, rawCompletions);
  const reflections = localDb.listReflections(userId);
  const evaluation = localDb.getEvaluation(userId);
  const diplomaEvents = localDb.listDiplomaEvents(userId);
  const diploma3Program = buildDiploma3ProgramRequirements({
    eticaReadAt: profile.etica_read_at ?? null,
    reflections,
    evaluation,
  });
  const earnedTiers =
    diplomaEvents.length > 0
      ? (Array.from(new Set(diplomaEvents.map((d) => d.tier))).sort((a, b) => a - b) as (
          | 1
          | 2
          | 3
        )[])
      : getEarnedTiers(summaryBase.totalHours, completionMap, diploma3Program);

  return {
    teacher: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name ?? null,
      subject: profile.subject ?? null,
      start_date: profile.start_date ?? null,
      etica_read_at: profile.etica_read_at ?? null,
      welcome_cynthia_read_at: profile.welcome_cynthia_read_at ?? null,
      welcome_pope_read_at: profile.welcome_pope_read_at ?? null,
      welcome_about_read_at: profile.welcome_about_read_at ?? null,
      tour_completed_at: profile.tour_completed_at ?? null,
    },
    summary: { ...summaryBase, earnedTiers },
    diplomaEvents: diplomaEvents.map((d) => ({
      tier: d.tier,
      awarded_at: d.awarded_at,
      hours_at_award: d.hours_at_award,
    })),
    diploma3Program,
    completions: rawCompletions,
    reflections,
    evaluation,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await context.params;

  if (isLocalMode()) {
    const data = buildLocalResponse(userId);
    if (!data) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json(data);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
  }

  const { data: teacher } = await admin
    .from('profiles')
    .select(
      'id, email, full_name, subject, role, start_date, etica_read_at, welcome_cynthia_read_at, welcome_pope_read_at, welcome_about_read_at, tour_completed_at'
    )
    .eq('id', userId)
    .single();

  if (!teacher || !isTeacherProfile(teacher.role as string)) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const [
    { data: rawCompletions },
    { data: reflections },
    { data: evaluation },
    { data: diplomaEvents },
  ] = await Promise.all([
    admin.from('item_completions').select('*').eq('user_id', userId),
    admin
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin.from('evaluations').select('*').eq('user_id', userId).maybeSingle(),
    admin
      .from('diploma_events')
      .select('tier, awarded_at, hours_at_award')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: true }),
  ]);

  const completionRows = (rawCompletions || []).map((c) =>
    mapCompletionRow(c as Record<string, unknown>)
  );
  const completionMap = buildInitialCompletions(completionRows);
  const summaryBase = buildSummary(completionMap, completionRows);
  const reflectionRows = (reflections || []) as ReflectionRow[];
  const evaluationRow = (evaluation as EvaluationRow | null) ?? null;
  const diploma3Program = buildDiploma3ProgramRequirements({
    eticaReadAt: teacher.etica_read_at as string | null,
    reflections: reflectionRows,
    evaluation: evaluationRow,
  });
  const earnedTiers =
    diplomaEvents && diplomaEvents.length > 0
      ? (Array.from(new Set(diplomaEvents.map((d) => d.tier as 1 | 2 | 3))).sort(
          (a, b) => a - b
        ) as (1 | 2 | 3)[])
      : getEarnedTiers(summaryBase.totalHours, completionMap, diploma3Program);

  const response: AdminTeacherDetailResponse = {
    teacher: {
      id: teacher.id,
      email: teacher.email,
      full_name: teacher.full_name ?? null,
      subject: teacher.subject ?? null,
      start_date: teacher.start_date ?? null,
      etica_read_at: (teacher.etica_read_at as string | null) ?? null,
      welcome_cynthia_read_at: (teacher.welcome_cynthia_read_at as string | null) ?? null,
      welcome_pope_read_at: (teacher.welcome_pope_read_at as string | null) ?? null,
      welcome_about_read_at: (teacher.welcome_about_read_at as string | null) ?? null,
      tour_completed_at: (teacher.tour_completed_at as string | null) ?? null,
    },
    summary: { ...summaryBase, earnedTiers },
    diplomaEvents: (diplomaEvents || []).map((d) => ({
      tier: d.tier as 1 | 2 | 3,
      awarded_at: d.awarded_at,
      hours_at_award: d.hours_at_award,
    })),
    diploma3Program,
    completions: completionRows,
    reflections: reflectionRows,
    evaluation: evaluationRow,
  };

  return NextResponse.json(response);
}
