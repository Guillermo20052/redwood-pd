import { NextResponse } from 'next/server';
import { getSessionUserId, saveProfile } from '@/lib/completions-service';

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const start_date = typeof body.start_date === 'string' ? body.start_date : '';

  await saveProfile(session.userId, {
    full_name,
    subject,
    start_date: start_date || undefined,
  });

  return NextResponse.json({ ok: true });
}
