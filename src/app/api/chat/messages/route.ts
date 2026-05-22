import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUserId, loadProfile } from '@/lib/completions-service';
import { isLocalMode, localDb } from '@/lib/local-db';

export async function GET() {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isLocalMode()) {
    const messages = localDb.getChat().map((m) => ({
      id: m.id,
      body: m.body,
      created_at: m.created_at,
      author_name: m.author_name || 'Docente',
    }));
    return NextResponse.json({ messages });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, body, created_at, user_id, profiles(full_name, role)')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = (data || []).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    author_name: (m.profiles as { full_name?: string; role?: string })?.full_name || 'Docente',
    author_role: (m.profiles as { role?: string })?.role ?? 'teacher',
  }));

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });

  const profile = await loadProfile(session.userId);
  const authorName = profile?.full_name || 'Docente';

  if (isLocalMode()) {
    const id = localDb.addChat({
      user_id: session.userId,
      body: body.trim(),
      created_at: new Date().toISOString(),
      author_name: authorName,
    });
    return NextResponse.json({ ok: true, id });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('chat_messages').insert({
    user_id: session.userId,
    body: body.trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
