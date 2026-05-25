import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getSessionUserId, loadProfile } from '@/lib/completions-service';
import { getNextWelcomePath, isWelcomeComplete } from '@/lib/welcome-gate';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUserId();
  if (session) {
    const profile = await loadProfile(session.userId);
    if (!isWelcomeComplete(profile)) {
      redirect(getNextWelcomePath(profile));
    }
  }

  return <AppShell>{children}</AppShell>;
}
