import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/completions-service';
import { isAdminUser } from '@/lib/auth-helpers';
import { isLocalMode, localDb } from '@/lib/local-db';

type AdminSession = { userId: string; email: string };

export async function requireAdminDemoSession(): Promise<
  { session: AdminSession } | { error: NextResponse }
> {
  const session = await getSessionUserId();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (isLocalMode()) {
    const profile = localDb.getProfile(session.userId);
    if (profile?.role !== 'admin') {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { session };
  }

  const admin = await isAdminUser(session.userId);
  if (!admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}
