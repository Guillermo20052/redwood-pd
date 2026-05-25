import confetti from 'canvas-confetti';
import type { Options } from 'canvas-confetti';
import type { DiplomaTier } from './diplomas';
import type { CelebrationEvent } from './celebration-detector';

const BRAND_COLORS = ['#B22234', '#C8972A', '#1A2E4A'];
const DELAY_MS = 500;

export type ShowToastFn = (
  message: string,
  options?: {
    duration?: number;
    action?: { label: string; href: string };
  }
) => void;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 640px)').matches;
}

function scale(count: number): number {
  return isMobile() ? Math.round(count * 0.65) : count;
}

function fire(opts: Options) {
  if (prefersReducedMotion()) return;
  void confetti({
    disableForReducedMotion: true,
    ...opts,
    particleCount: opts.particleCount != null ? scale(opts.particleCount) : undefined,
  });
}

export function celebrateSmall(options?: { colors?: string[]; origin?: { x: number; y: number } }) {
  fire({
    particleCount: 50,
    spread: 60,
    origin: options?.origin ?? { x: 0.5, y: 0.6 },
    colors: options?.colors ?? BRAND_COLORS,
  });
}

export function celebrateMedium(options?: { colors?: string[] }) {
  fire({
    particleCount: 150,
    spread: 90,
    origin: { x: 0.5, y: 0.5 },
    colors: options?.colors ?? BRAND_COLORS,
    scalar: 1.2,
  });
}

export function celebrateLarge(options?: { colors?: string[]; durationMs?: number }) {
  const colors = options?.colors ?? [...BRAND_COLORS, '#F0EDEA'];
  const burst = (origin: { x: number; y: number }) => {
    fire({
      particleCount: 100,
      spread: 70,
      origin,
      colors,
      scalar: 1.3,
    });
  };
  burst({ x: 0.2, y: 0.6 });
  setTimeout(() => burst({ x: 0.8, y: 0.6 }), 250);
  setTimeout(() => burst({ x: 0.5, y: 0.5 }), 500);
  setTimeout(() => burst({ x: 0.35, y: 0.45 }), 1200);
  setTimeout(() => burst({ x: 0.65, y: 0.45 }), 1600);
  setTimeout(() => burst({ x: 0.5, y: 0.35 }), 2200);
  setTimeout(() => burst({ x: 0.5, y: 0.55 }), 2800);
}

export function celebrateDiploma(tier: DiplomaTier) {
  const themes: Record<DiplomaTier, string[]> = {
    1: ['#7B8B5C', '#F0EDEA', '#C8972A'],
    2: ['#B8C4D6', '#F0EDEA', '#1A2E4A'],
    3: ['#C8972A', '#F0EDEA', '#B22234'],
  };
  const colors = themes[tier];
  const burst = (x: number, y: number) => {
    fire({
      particleCount: 80,
      spread: 80,
      origin: { x, y },
      colors,
      scalar: 1.4,
    });
  };
  burst(0.1, 0.5);
  setTimeout(() => burst(0.9, 0.5), 200);
  setTimeout(() => burst(0.5, 0.3), 400);
  setTimeout(() => burst(0.3, 0.7), 700);
  setTimeout(() => burst(0.7, 0.7), 900);
  setTimeout(() => burst(0.5, 0.5), 1200);
  setTimeout(() => burst(0.2, 0.4), 1800);
  setTimeout(() => burst(0.8, 0.4), 2200);
  setTimeout(() => burst(0.5, 0.6), 2800);
  setTimeout(() => burst(0.15, 0.55), 3400);
  setTimeout(() => burst(0.85, 0.55), 3800);
}

const LEVEL_LABELS: Record<'b' | 'i' | 'a', string> = {
  b: 'Nivel 1: Fundamentos',
  i: 'Nivel 2: Integración',
  a: 'Nivel 3: Transformación',
};

const HOURS_TOAST: Record<number, string> = {
  5: 'Llegaste a 5h verificadas. Buen ritmo. 🌱',
  10: '10h. Estás en la mitad del Nivel 1. 🚀',
  15: '15h. Falta poco para Diploma 1. 🔥',
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function handleEvent(event: CelebrationEvent, showToast: ShowToastFn, reduced: boolean) {
  switch (event.type) {
    case 'first_video':
      if (!reduced) celebrateSmall({ origin: { x: 0.5, y: 0.1 } });
      break;
    case 'first_task':
      if (!reduced) celebrateSmall({ origin: { x: 0.5, y: 0.95 } });
      break;
    case 'first_extra':
      if (!reduced) celebrateSmall({ origin: { x: 0.9, y: 0.95 } });
      showToast('¡Primera tarea Level Up! Sigue así.');
      break;
    case 'part_complete':
      if (!reduced) celebrateMedium();
      showToast('¡Parte completa! 🎉');
      break;
    case 'level_complete':
      if (!reduced) celebrateLarge({ durationMs: 4000 });
      showToast(`¡Completaste el ${LEVEL_LABELS[event.level]}!`, {
        duration: 6000,
        action: { label: 'Ver progreso', href: '/dashboard' },
      });
      break;
    case 'diploma_earned':
      if (!reduced) celebrateDiploma(event.tier);
      break;
    case 'hours_milestone':
      if (!reduced) celebrateSmall();
      showToast(HOURS_TOAST[event.threshold] ?? `Llegaste a ${event.threshold}h verificadas.`);
      break;
    default:
      break;
  }
}

export async function runCelebrations(events: CelebrationEvent[], showToast: ShowToastFn) {
  if (events.length === 0) return;
  const reduced = prefersReducedMotion();
  for (let i = 0; i < events.length; i++) {
    if (i > 0) await delay(DELAY_MS);
    handleEvent(events[i]!, showToast, reduced);
  }
}
