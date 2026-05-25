import { NextResponse } from 'next/server';
import { requireAdminDemoSession } from '@/lib/admin-demo-auth';
import { resetLevelAdminSkip } from '@/lib/admin-demo-reset';

const ALLOWED_LEVELS = new Set(['b', 'i', 'a']);

export async function POST(request: Request) {
  const auth = await requireAdminDemoSession();
  if ('error' in auth) return auth.error;

  let body: { level?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const level = body.level;
  if (typeof level !== 'string' || !ALLOWED_LEVELS.has(level)) {
    return NextResponse.json({ error: 'level debe ser uno de: b, i, a' }, { status: 400 });
  }

  try {
    const result = await resetLevelAdminSkip(auth.session.userId, level as 'b' | 'i' | 'a');
    return NextResponse.json({ ok: true, level, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
