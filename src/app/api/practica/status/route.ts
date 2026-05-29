import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/completions-service';
import { isPracticaEnabled } from '@/lib/feature-flags';
import { loadPracticeCompletions } from '@/lib/practice-completions-service';

export async function GET() {
  const session = await getSessionUserId();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const enabled = await isPracticaEnabled();
  const completions = enabled ? await loadPracticeCompletions(session.userId) : {};

  return NextResponse.json({
    enabled,
    completions,
  });
}
