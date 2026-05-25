import { NextResponse } from 'next/server';
import { getSessionUserId, loadCompletions, saveCompletions } from '@/lib/completions-service';
import { verifyVideo, VerificationError, verifyAdminSkip } from '@/lib/verification';
import { isAdminUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemKey, watchPct, skipped, adminSkip } = await request.json();

  if (adminSkip) {
    const admin = await isAdminUser(session.userId);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const current = await loadCompletions(session.userId);
    const updated = verifyAdminSkip(current, itemKey);
    await saveCompletions(session.userId, updated);
    return NextResponse.json({ ok: true, adminSkip: true, completions: updated });
  }

  try {
    const current = await loadCompletions(session.userId);
    const updated = verifyVideo(current, itemKey, watchPct, Boolean(skipped));
    await saveCompletions(session.userId, updated);
    return NextResponse.json({ ok: true, completions: updated });
  } catch (e) {
    const status = e instanceof VerificationError ? e.status : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
