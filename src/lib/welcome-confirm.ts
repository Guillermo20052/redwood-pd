import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUserId } from '@/lib/completions-service';
import { isLocalMode, localDb } from '@/lib/local-db';
import {
  canAccessWelcomeStep,
  getWelcomeConfirmNext,
  type WelcomeStep,
} from '@/lib/welcome-gate';

type WelcomeField =
  | 'welcome_cynthia_read_at'
  | 'welcome_pope_read_at'
  | 'welcome_about_read_at';

const STEP_FIELD: Record<WelcomeStep, WelcomeField> = {
  cynthia: 'welcome_cynthia_read_at',
  papa: 'welcome_pope_read_at',
  about: 'welcome_about_read_at',
};

export async function confirmWelcomeStep(step: WelcomeStep) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const field = STEP_FIELD[step];
  const now = new Date().toISOString();

  if (isLocalMode()) {
    const existing = localDb.getProfile(session.userId) || {
      id: session.userId,
      email: session.email,
      role: 'teacher' as const,
    };

    if (existing.role !== 'admin' && !canAccessWelcomeStep(existing, step)) {
      return NextResponse.json({ error: 'Completa los pasos anteriores primero.' }, { status: 403 });
    }

    localDb.upsertProfile({ ...existing, [field]: now });
    const shouldStartTour = step === 'about' && existing.role !== 'admin';
    return NextResponse.json({
      ok: true,
      next: getWelcomeConfirmNext(step),
      should_start_tour: shouldStartTour,
      [field]: now,
    });
  }

  const supabase = await createClient();
  const { data: profile, error: loadError } = await supabase
    .from('profiles')
    .select('role, welcome_cynthia_read_at, welcome_pope_read_at, welcome_about_read_at')
    .eq('id', session.userId)
    .single();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  if (profile?.role !== 'admin' && !canAccessWelcomeStep(profile, step)) {
    return NextResponse.json({ error: 'Completa los pasos anteriores primero.' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ [field]: now, updated_at: now })
    .eq('id', session.userId)
    .select(field)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const timestamp =
    (data as Record<string, string | null | undefined> | null)?.[field] ?? now;

  return NextResponse.json({
    ok: true,
    next: getWelcomeConfirmNext(step),
    should_start_tour: step === 'about' && profile?.role !== 'admin',
    [field]: timestamp,
  });
}
