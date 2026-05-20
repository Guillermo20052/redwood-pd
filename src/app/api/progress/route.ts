import { NextResponse } from 'next/server';
import {
  getSessionUserId,
  loadCompletions,
  loadProfile,
  saveProfile,
} from '@/lib/completions-service';

export async function GET() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const completions = await loadCompletions(session.userId);
  const profile = await loadProfile(session.userId);

  return NextResponse.json({
    completions,
    profile: profile
      ? {
          full_name: profile.full_name,
          subject: profile.subject,
          start_date: profile.start_date,
          email: profile.email || session.email,
        }
      : { email: session.email },
  });
}

export async function PATCH(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (body.profile) {
    await saveProfile(session.userId, body.profile);
  }

  return NextResponse.json({ ok: true });
}
