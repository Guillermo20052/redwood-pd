import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLocalMode, localDb, type EvaluationRow } from '@/lib/local-db';
import { getSessionUserId } from '@/lib/completions-service';
import { validateEvaluation } from '@/lib/evaluation';
import { gradeEvaluation } from '@/lib/evaluation-grader';

export async function GET() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isLocalMode()) {
    return NextResponse.json({ evaluation: localDb.getEvaluation(session.userId) });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('user_id', session.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ evaluation: (data as EvaluationRow | null) ?? null });
}

export async function POST(request: Request) {
  return upsert(request);
}

export async function PUT(request: Request) {
  return upsert(request);
}

async function upsert(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const result = validateEvaluation(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Validación', fieldErrors: result.errors },
      { status: 400 }
    );
  }
  const payload = result.value;

  let gradeResult: { score: number; feedback: string } | null = null;
  try {
    gradeResult = await gradeEvaluation(payload);
  } catch {
    /* score optional if API key missing */
  }

  if (isLocalMode()) {
    const row = localDb.upsertEvaluation(session.userId, {
      ...payload,
      ...(gradeResult
        ? { score: gradeResult.score, score_feedback: gradeResult.feedback }
        : { score: null, score_feedback: null }),
    });
    return NextResponse.json({ evaluation: row, grade: gradeResult });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Preserve submitted_at on edits. We try to read the existing row first; on
  // first submission it doesn't exist and Postgres uses its DEFAULT now().
  const { data: existing } = await supabase
    .from('evaluations')
    .select('submitted_at')
    .eq('user_id', session.userId)
    .maybeSingle();

  const upsertPayload = {
    user_id: session.userId,
    ...payload,
    ...(gradeResult
      ? { score: gradeResult.score, score_feedback: gradeResult.feedback }
      : {}),
    submitted_at: existing?.submitted_at ?? now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('evaluations')
    .upsert(upsertPayload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    evaluation: data as EvaluationRow,
    grade: gradeResult,
  });
}
