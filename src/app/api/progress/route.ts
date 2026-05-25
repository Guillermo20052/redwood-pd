// POLICY: User progress persists FOREVER across logins.
// Logout, session expiry, and refresh do NOT reset progress.
// The only authorized progress deletion is the admin "Reiniciar tarea" button
// (which deletes a single item_completion row at admin's request) and the
// dev-only reset button (never visible in production builds).
import { NextResponse } from 'next/server';
import {
  getSessionUserId,
  loadCompletions,
  loadProfile,
  saveProfile,
} from '@/lib/completions-service';
import { loadDiploma3ProgramRequirements } from '@/lib/diploma3-requirements-server';

function profilePayload(profile: Awaited<ReturnType<typeof loadProfile>>, email: string) {
  if (!profile) {
    return {
      email,
      role: 'teacher' as const,
      etica_read_at: null,
      welcome_cynthia_read_at: null,
      welcome_pope_read_at: null,
      welcome_about_read_at: null,
      tour_completed_at: null,
    };
  }
  return {
    full_name: profile.full_name,
    subject: profile.subject,
    start_date: profile.start_date,
    email: profile.email || email,
    role: (profile.role as 'teacher' | 'admin') ?? 'teacher',
    etica_read_at: typeof profile.etica_read_at === 'string' ? profile.etica_read_at : null,
    welcome_cynthia_read_at:
      typeof profile.welcome_cynthia_read_at === 'string' ? profile.welcome_cynthia_read_at : null,
    welcome_pope_read_at:
      typeof profile.welcome_pope_read_at === 'string' ? profile.welcome_pope_read_at : null,
    welcome_about_read_at:
      typeof profile.welcome_about_read_at === 'string' ? profile.welcome_about_read_at : null,
    tour_completed_at:
      typeof profile.tour_completed_at === 'string' ? profile.tour_completed_at : null,
  };
}

export async function GET() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const completions = await loadCompletions(session.userId);
  const profile = await loadProfile(session.userId);
  const diploma3Program = await loadDiploma3ProgramRequirements(session.userId);

  return NextResponse.json({
    completions,
    profile: profilePayload(profile, session.email),
    diploma3Program,
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
