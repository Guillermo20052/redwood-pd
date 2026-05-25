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
    localDb.upsertProfile({ ...existing, etica_read_at: now });
    return NextResponse.json({ ok: true, etica_read_at: now });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ etica_read_at: now, updated_at: now })
    .eq('id', session.userId)
    .select('etica_read_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    etica_read_at: (data?.etica_read_at as string) ?? now,
  });
}
