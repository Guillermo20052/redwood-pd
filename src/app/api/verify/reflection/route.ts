import { NextResponse } from 'next/server';
import { getSessionUserId, loadCompletions, saveCompletions } from '@/lib/completions-service';
import { verifyReflection, verifyAdminSkip } from '@/lib/verification';
import { isAdminUser } from '@/lib/auth-helpers';
import { getPathItem } from '@/lib/curriculum-path';
import { generateReflectionFeedback } from '@/lib/ai-grader';

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemKey, reflectionText, adminSkip } = await request.json();

  if (adminSkip) {
    const admin = await isAdminUser(session.userId);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!itemKey || typeof itemKey !== 'string') {
      return NextResponse.json({ error: 'itemKey es requerido' }, { status: 400 });
    }
    const current = await loadCompletions(session.userId);
    const updated = verifyAdminSkip(current, itemKey);
    await saveCompletions(session.userId, updated);
    return NextResponse.json({ ok: true, adminSkip: true, completions: updated });
  }

  try {
    const current = await loadCompletions(session.userId);
    const item = getPathItem(itemKey);
    let reflectionAiFeedback = 'Gracias por compartir tu reflexión.';
    try {
      reflectionAiFeedback = await generateReflectionFeedback(
        item?.reflectionPrompt ?? '',
        typeof reflectionText === 'string' ? reflectionText : ''
      );
    } catch (err) {
      console.error('[verify/reflection] AI feedback failed:', err);
    }

    const updated = verifyReflection(
      current,
      itemKey,
      reflectionText,
      reflectionAiFeedback
    );
    await saveCompletions(session.userId, updated);
    return NextResponse.json({
      ok: true,
      completions: updated,
      reflection_ai_feedback: reflectionAiFeedback,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
