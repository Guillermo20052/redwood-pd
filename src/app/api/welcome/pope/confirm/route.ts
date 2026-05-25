import { confirmWelcomeStep } from '@/lib/welcome-confirm';

export async function POST() {
  return confirmWelcomeStep('papa');
}
