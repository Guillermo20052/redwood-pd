import { NextResponse } from 'next/server';
import { getSessionUserId, loadCompletions, saveCompletions } from '@/lib/completions-service';
import { verifyReflection } from '@/lib/verification';

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemKey, reflectionText } = await request.json();
  try {
    const current = await loadCompletions(session.userId);
    const updated = verifyReflection(current, itemKey, reflectionText);
    await saveCompletions(session.userId, updated);
    return NextResponse.json({ ok: true, completions: updated });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
