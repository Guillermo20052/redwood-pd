import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUserId } from '@/lib/completions-service';
import { isLocalMode, localDb } from '@/lib/local-db';

export async function POST() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date().toISOString();

  if (isLocalMode()) {
    const existing = localDb.getProfile(session.userId) || {
      id: session.userId,
      email: session.email,
      role: 'teacher' as const,
    };
    localDb.upsertProfile({ ...existing, tour_completed_at: now });
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ tour_completed_at: now, updated_at: now })
    .eq('id', session.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
