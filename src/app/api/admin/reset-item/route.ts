import { NextResponse } from 'next/server';
import {
  deleteCompletion,
  getSessionUserId,
  loadCompletions,
} from '@/lib/completions-service';
import { isAdminUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await isAdminUser(session.userId);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { itemKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { itemKey } = body;
  if (!itemKey || typeof itemKey !== 'string') {
    return NextResponse.json({ error: 'itemKey es requerido' }, { status: 400 });
  }

  await deleteCompletion(session.userId, itemKey);
  const completions = await loadCompletions(session.userId);
  return NextResponse.json({ ok: true, completions });
}
