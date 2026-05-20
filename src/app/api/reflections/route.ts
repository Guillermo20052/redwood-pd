import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLocalMode, localDb } from '@/lib/local-db';
import { getSessionUserId } from '@/lib/completions-service';

type ReflectionBody = {
  level?: number | string;
  session_date?: string;
  session_title?: string;
  q1?: string;
  q2?: string;
  q3?: string;
  notes?: string;
};

function normalizeLevel(input: unknown): number {
  if (typeof input === 'number') return Math.min(3, Math.max(1, Math.round(input)));
  if (typeof input === 'string') {
    const map: Record<string, number> = { b: 1, i: 2, a: 3 };
    if (input in map) return map[input];
    const n = Number(input);
    if (!Number.isNaN(n)) return Math.min(3, Math.max(1, Math.round(n)));
  }
  return 1;
}

export async function GET() {
  if (isLocalMode()) {
    const session = await getSessionUserId();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const reflections = localDb.listReflections(session.userId);
    return NextResponse.json({ reflections });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reflections: data });
}

export async function POST(request: Request) {
  let body: ReflectionBody;
  try {
    body = (await request.json()) as ReflectionBody;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const level = normalizeLevel(body.level);

  if (isLocalMode()) {
    const session = await getSessionUserId();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const row = localDb.insertReflection(session.userId, {
      level,
      session_date: body.session_date || null,
      session_title: body.session_title || null,
      q1: body.q1 || null,
      q2: body.q2 || null,
      q3: body.q3 || null,
      notes: body.notes || null,
    });
    return NextResponse.json({ reflection: row });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error, data } = await supabase
    .from('reflections')
    .insert({
      user_id: user.id,
      level,
      session_date: body.session_date || null,
      session_title: body.session_title || null,
      q1: body.q1 || null,
      q2: body.q2 || null,
      q3: body.q3 || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reflection: data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (isLocalMode()) {
    const session = await getSessionUserId();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    localDb.deleteReflection(session.userId, id);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('reflections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
