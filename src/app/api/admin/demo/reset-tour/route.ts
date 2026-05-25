import { NextResponse } from 'next/server';
import { requireAdminDemoSession } from '@/lib/admin-demo-auth';
import { resetTour } from '@/lib/admin-demo-reset';

export async function POST() {
  const auth = await requireAdminDemoSession();
  if ('error' in auth) return auth.error;

  try {
    await resetTour(auth.session.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
