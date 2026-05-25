import { NextResponse } from 'next/server';
import { requireAdminDemoSession } from '@/lib/admin-demo-auth';
import { resetAllAdminProgress } from '@/lib/admin-demo-reset';

export async function POST() {
  const auth = await requireAdminDemoSession();
  if ('error' in auth) return auth.error;

  try {
    const result = await resetAllAdminProgress(auth.session.userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
