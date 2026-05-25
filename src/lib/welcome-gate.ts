export type WelcomeStep = 'cynthia' | 'papa' | 'about';

export type WelcomeProfile = {
  role?: 'teacher' | 'admin' | string | null;
  welcome_cynthia_read_at?: string | null;
  welcome_pope_read_at?: string | null;
  welcome_about_read_at?: string | null;
};

export const WELCOME_STEP_ORDER: WelcomeStep[] = ['cynthia', 'papa', 'about'];

export function isWelcomeComplete(profile: WelcomeProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return !!(
    profile.welcome_cynthia_read_at &&
    profile.welcome_pope_read_at &&
    profile.welcome_about_read_at
  );
}

export function getNextWelcomeStep(profile: WelcomeProfile | null | undefined): WelcomeStep | null {
  if (!profile || isWelcomeComplete(profile)) return null;
  if (!profile.welcome_cynthia_read_at) return 'cynthia';
  if (!profile.welcome_pope_read_at) return 'papa';
  if (!profile.welcome_about_read_at) return 'about';
  return null;
}

export function getWelcomeStepPath(step: WelcomeStep): string {
  return `/bienvenida/${step}`;
}

export function getNextWelcomePath(profile: WelcomeProfile | null | undefined): string {
  const step = getNextWelcomeStep(profile);
  if (!step) return '/dashboard';
  return getWelcomeStepPath(step);
}

export function isWelcomeStepComplete(
  profile: WelcomeProfile | null | undefined,
  step: WelcomeStep
): boolean {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  switch (step) {
    case 'cynthia':
      return !!profile.welcome_cynthia_read_at;
    case 'papa':
      return !!profile.welcome_pope_read_at;
    case 'about':
      return !!profile.welcome_about_read_at;
    default:
      return false;
  }
}

export function canAccessWelcomeStep(
  profile: WelcomeProfile | null | undefined,
  step: WelcomeStep
): boolean {
  if (!profile) return false;
  if (isWelcomeComplete(profile)) return true;
  return getNextWelcomeStep(profile) === step;
}

export function getWelcomeConfirmNext(step: WelcomeStep): string {
  switch (step) {
    case 'cynthia':
      return '/bienvenida/papa';
    case 'papa':
      return '/bienvenida/about';
    case 'about':
      return '/nivel/b';
  }
}

export function normalizeWelcomeProfile(raw: Record<string, unknown> | null | undefined): WelcomeProfile {
  if (!raw) return {};
  return {
    role: typeof raw.role === 'string' ? raw.role : undefined,
    welcome_cynthia_read_at:
      typeof raw.welcome_cynthia_read_at === 'string' ? raw.welcome_cynthia_read_at : null,
    welcome_pope_read_at:
      typeof raw.welcome_pope_read_at === 'string' ? raw.welcome_pope_read_at : null,
    welcome_about_read_at:
      typeof raw.welcome_about_read_at === 'string' ? raw.welcome_about_read_at : null,
  };
}

export function formatWelcomeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Paths that require welcome completion before access. */
export const WELCOME_GATED_PREFIXES = [
  '/dashboard',
  '/nivel',
  '/tareas-extra',
  '/logros',
  '/etica',
  '/reflexion',
  '/comunidad',
  '/evaluacion',
  '/admin',
  '/importar',
  '/maestras',
];

export function isWelcomeGatedPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return WELCOME_GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isWelcomeFlowPath(pathname: string): boolean {
  return pathname === '/bienvenida' || pathname.startsWith('/bienvenida/');
}
