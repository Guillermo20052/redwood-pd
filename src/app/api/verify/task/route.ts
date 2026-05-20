import { NextResponse } from 'next/server';
import { getSessionUserId, loadCompletions, saveCompletions } from '@/lib/completions-service';
import { canVerifyItem, verifyTask, VerificationError } from '@/lib/verification';
import { getPathItem, verificationConfig } from '@/lib/curriculum-path';
import { gradeTask, TASK_PASSING_SCORE } from '@/lib/ai-grader';

type PartnerInput = {
  user_id?: string | null;
  name?: string;
};

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { itemKey?: string; evidenceText?: string; partner?: PartnerInput | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const { itemKey, evidenceText, partner } = body;
  if (!itemKey || typeof itemKey !== 'string') {
    return NextResponse.json({ error: 'itemKey es requerido' }, { status: 400 });
  }
  if (typeof evidenceText !== 'string') {
    return NextResponse.json({ error: 'evidenceText es requerido' }, { status: 400 });
  }

  const item = getPathItem(itemKey);
  if (!item) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 400 });
  }
  if (item.type !== 'task') {
    return NextResponse.json({ error: 'Este item no es una tarea' }, { status: 400 });
  }

  const current = await loadCompletions(session.userId);
  const gate = canVerifyItem(current, itemKey);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? 'Completa el paso anterior primero.' },
      { status: 400 }
    );
  }

  const trimmed = evidenceText.trim();
  if (trimmed.length < verificationConfig.taskEvidenceMinChars) {
    return NextResponse.json(
      {
        error: `La tarea debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres.`,
      },
      { status: 400 }
    );
  }

  // Per-part rubric is required for AI grading. If the curriculum entry is
  // missing it, surface a clear server-config error instead of silently passing.
  if (!item.taskRubric) {
    return NextResponse.json(
      { error: 'Esta tarea no tiene rúbrica configurada. Avisa al administrador.' },
      { status: 500 }
    );
  }

  // Collaborative tasks require a declared partner. The UI enforces this too,
  // but the server is the source of truth so direct API calls can't bypass.
  const collaborative = item.collaborative ?? false;
  const partnerName = (partner?.name ?? '').trim();
  const partnerUserId =
    typeof partner?.user_id === 'string' && partner.user_id.length > 0
      ? partner.user_id
      : null;
  if (collaborative && partnerName.length < 3) {
    return NextResponse.json(
      { error: 'Indica tu compañera antes de enviar la tarea.' },
      { status: 400 }
    );
  }

  let grade;
  try {
    grade = await gradeTask({
      taskPrompt: item.taskPrompt ?? item.label,
      taskRubric: item.taskRubric,
      evidenceText: trimmed,
      partTitle: item.partTitle ?? item.label,
      level: item.level,
      collaborative,
      partnerName: collaborative ? partnerName : undefined,
    });
  } catch (e) {
    const message = (e as Error).message || 'Error al evaluar la tarea.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (grade.score < TASK_PASSING_SCORE) {
    // Valid request, valid grading, just below the bar. Don't mutate state.
    return NextResponse.json({
      ok: false,
      score: grade.score,
      feedback: grade.feedback,
      passingScore: TASK_PASSING_SCORE,
    });
  }

  try {
    const updated = verifyTask(
      current,
      itemKey,
      trimmed,
      { score: grade.score, feedback: grade.feedback },
      collaborative ? { user_id: partnerUserId, name: partnerName } : null
    );
    await saveCompletions(session.userId, updated);
    return NextResponse.json({
      ok: true,
      completions: updated,
      score: grade.score,
      feedback: grade.feedback,
      passingScore: TASK_PASSING_SCORE,
    });
  } catch (e) {
    const status = e instanceof VerificationError ? e.status : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
