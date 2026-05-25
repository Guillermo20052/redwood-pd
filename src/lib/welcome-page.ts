import { redirect } from 'next/navigation';
import { getSessionUserId, loadProfile } from '@/lib/completions-service';
import {
  canAccessWelcomeStep,
  getNextWelcomePath,
  isWelcomeComplete,
  isWelcomeStepComplete,
  type WelcomeStep,
} from '@/lib/welcome-gate';

export async function requireWelcomeStepAccess(step: WelcomeStep) {
  const session = await getSessionUserId();
  if (!session) redirect('/login');

  const profile = await loadProfile(session.userId);
  const complete = isWelcomeComplete(profile);

  if (complete) return { profile, reviewMode: true as const };

  if (!canAccessWelcomeStep(profile, step)) {
    redirect(getNextWelcomePath(profile));
  }

  if (isWelcomeStepComplete(profile, step)) {
    redirect(getNextWelcomePath(profile));
  }

  return { profile, reviewMode: false as const };
}
