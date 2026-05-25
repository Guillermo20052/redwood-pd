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
          role: (profile.role as 'teacher' | 'admin') ?? 'teacher',
          etica_read_at:
            typeof profile.etica_read_at === 'string' ? profile.etica_read_at : null,
        }
      : { email: session.email, role: 'teacher' as const, etica_read_at: null },
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
