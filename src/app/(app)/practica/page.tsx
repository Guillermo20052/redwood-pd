import { redirect } from 'next/navigation';
import { PracticaWorkspace } from '@/components/PracticaWorkspace';
import { isPracticaEnabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

export default async function PracticaPage() {
  const enabled = await isPracticaEnabled();
  if (!enabled) {
    redirect('/dashboard');
  }

  return <PracticaWorkspace />;
}
