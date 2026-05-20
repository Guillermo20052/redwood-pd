/**
 * DEV-only endpoint to wipe completions for an entire level so we can replay
 * the AI grading flow against fresh state. The handler short-circuits to 404
 * when NODE_ENV !== 'development', and the import-side constant means the
 * runtime check happens at request time but the value is inlined at build
 * time. (`process.env.NODE_ENV` is replaced by Next.js at build time.)
 *
 * This file is throwaway — remove it before any teacher sees the app.
 */
import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/completions-service';
import { isLocalMode, localDb } from '@/lib/local-db';
import { createClient } from '@/lib/supabase/server';
import { loadCompletions } from '@/lib/completions-service';

const ALLOWED_LEVELS = new Set(['b', 'i', 'a']);

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { level?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const level = body.level;
  if (typeof level !== 'string' || !ALLOWED_LEVELS.has(level)) {
    return NextResponse.json(
      { error: 'level debe ser uno de: b, i, a' },
      { status: 400 }
    );
  }

  const prefix = `lvl-${level}-`;

  if (isLocalMode()) {
    const removed = localDb.deleteCompletionsByPrefix(session.userId, prefix);
    const completions = await loadCompletions(session.userId);
    return NextResponse.json({ ok: true, level, removed, completions });
  }

  const supabase = await createClient();
  await supabase
    .from('item_completions')
    .delete()
    .eq('user_id', session.userId)
    .like('item_key', `${prefix}%`);
  const completions = await loadCompletions(session.userId);
  return NextResponse.json({ ok: true, level, completions });
}
