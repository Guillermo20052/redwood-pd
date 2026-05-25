import {
  countCompletedExtras,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  isMandatoryPartsComplete,
} from './extras-gating';
import { isDiplomaTierEarned } from './diplomas';
import type { CompletionMap } from './verification';
import { sumVerifiedHours } from './verification';

const NIVEL_1_TARGET_HOURS = 10;

export type DashboardState =
  | { kind: 'brand_new' }
  | { kind: 'nivel_1_started'; hours: number; needed: number }
  | { kind: 'nivel_1_complete_no_extras' }
  | { kind: 'nivel_2_working'; hours: number }
  | {
      kind: 'close_to_d1';
      hours: number;
      hoursNeeded: number;
      extrasL1Needed: number;
      extrasL2Needed: number;
    }
  | { kind: 'has_d1'; hoursToD2: number }
  | { kind: 'has_d2'; extrasL3Done: number; extrasL3Needed: number }
  | { kind: 'has_d3' }
  | { kind: 'admin' };

export type DashboardProfileInput = {
  role: 'teacher' | 'admin';
};

export type DashboardProgressInput = {
  completions: CompletionMap;
  totalHours?: number;
};

export function computeDashboardState(
  profile: DashboardProfileInput,
  progress: DashboardProgressInput
): DashboardState {
  if (profile.role === 'admin') return { kind: 'admin' };

  const completions = progress.completions;
  const totalHours = progress.totalHours ?? sumVerifiedHours(completions);

  const tier1Earned = isDiplomaTierEarned(1, totalHours, completions);
  const tier2Earned = isDiplomaTierEarned(2, totalHours, completions);
  const tier3Earned = isDiplomaTierEarned(3, totalHours, completions);

  if (tier3Earned) return { kind: 'has_d3' };

  if (tier2Earned) {
    const extrasL3Done = countCompletedExtras('a', completions);
    return {
      kind: 'has_d2',
      extrasL3Done,
      extrasL3Needed: Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL3Done),
    };
  }

  if (tier1Earned) {
    return {
      kind: 'has_d1',
      hoursToD2: Math.max(0, 24 - totalHours),
    };
  }

  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const extrasL1Needed = Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL1);
  const extrasL2Needed = Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL2);
  const level1Complete = isMandatoryPartsComplete('b', completions);

  if (totalHours >= 17 && totalHours < 20 && !tier1Earned) {
    return {
      kind: 'close_to_d1',
      hours: totalHours,
      hoursNeeded: Math.max(0, 20 - totalHours),
      extrasL1Needed,
      extrasL2Needed,
    };
  }

  if (level1Complete && extrasL1 === 0) {
    return { kind: 'nivel_1_complete_no_extras' };
  }

  if (level1Complete) {
    return { kind: 'nivel_2_working', hours: totalHours };
  }

  if (totalHours > 0) {
    return {
      kind: 'nivel_1_started',
      hours: totalHours,
      needed: Math.max(0, NIVEL_1_TARGET_HOURS - totalHours),
    };
  }

  return { kind: 'brand_new' };
}

export type DashboardHeroCta =
  | { label: string; href: string }
  | { label: string; action: 'view_diploma'; tier: 1 | 2 | 3 };

export type DashboardHeroContent = {
  subtitle: string;
  cta: DashboardHeroCta | null;
  variant: 'default' | 'gold' | 'admin';
};

export function getDashboardHeroContent(state: DashboardState): DashboardHeroContent {
  switch (state.kind) {
    case 'brand_new':
      return {
        subtitle:
          'Es tu primer día. Empieza con el Nivel 1 — son 5 partes cortas para conocer ChatGPT, Claude y otras herramientas fundamentales.',
        cta: { label: 'Empezar Nivel 1 →', href: '/nivel/b' },
        variant: 'default',
      };
    case 'nivel_1_started':
      return {
        subtitle: `Vas en ${state.hours.toFixed(1)}h verificadas. Te falta ${state.needed.toFixed(1)}h para completar el Nivel 1 (Fundamentos).`,
        cta: { label: 'Continuar Nivel 1 →', href: '/nivel/b' },
        variant: 'default',
      };
    case 'nivel_1_complete_no_extras':
      return {
        subtitle:
          'Completaste el Nivel 1. Es hora de explorar las Tareas Level Up: complétalas para acercarte al Diploma 1 (Bronce).',
        cta: { label: 'Ver Tareas Level Up →', href: '/tareas-extra' },
        variant: 'default',
      };
    case 'nivel_2_working':
      return {
        subtitle: `Vas en ${state.hours.toFixed(1)}h verificadas. Estás integrando herramientas más avanzadas — sigue con el Nivel 2.`,
        cta: { label: 'Continuar Nivel 2 →', href: '/nivel/i' },
        variant: 'default',
      };
    case 'close_to_d1': {
      const extrasParts: string[] = [];
      if (state.extrasL1Needed > 0) {
        extrasParts.push(`${state.extrasL1Needed} tareas Level Up de Nivel 1`);
      }
      if (state.extrasL2Needed > 0) {
        extrasParts.push(`${state.extrasL2Needed} de Nivel 2`);
      }
      const extrasLine =
        extrasParts.length > 0 ? ` y ${extrasParts.join(' + ')}` : '';
      const subtitle = `Te falta poco para el Diploma 1 (Bronce). Necesitas ${state.hoursNeeded.toFixed(1)}h más${extrasLine}.`;

      const cta =
        state.hoursNeeded > 0 && state.hoursNeeded >= state.extrasL1Needed + state.extrasL2Needed
          ? { label: 'Continuar →', href: '/nivel/b' as const }
          : { label: 'Ver Tareas Level Up →', href: '/tareas-extra' as const };

      return { subtitle, cta, variant: 'default' };
    }
    case 'has_d1':
      if (state.hoursToD2 > 0.05) {
        return {
          subtitle: `¡Tienes el Diploma 1 (Bronce)! Te faltan ${state.hoursToD2.toFixed(1)}h para el Diploma 2 (Plata).`,
          cta: { label: 'Continuar →', href: '/nivel/i' },
          variant: 'default',
        };
      }
      return {
        subtitle: '¡Tienes el Diploma 1 (Bronce)! Te faltan pocos pasos para el Diploma 2 (Plata).',
        cta: { label: 'Ver mi Diploma →', action: 'view_diploma', tier: 1 },
        variant: 'default',
      };
    case 'has_d2':
      return {
        subtitle:
          '¡Diploma 2 (Plata) en tus manos! El Diploma 3 (Oro) requiere completar el Nivel 3 y 4 tareas Level Up del Nivel 3.',
        cta: { label: 'Continuar Nivel 3 →', href: '/nivel/a' },
        variant: 'default',
      };
    case 'has_d3':
      return {
        subtitle: 'Completaste el camino completo. Eres una Docente IA Transformadora.',
        cta: { label: 'Ver mis 3 Diplomas →', href: '/logros' },
        variant: 'gold',
      };
    case 'admin':
      return {
        subtitle:
          'Vista de administradora. Tienes acceso completo a todos los niveles, tareas y herramientas.',
        cta: null,
        variant: 'admin',
      };
    default:
      return { subtitle: '', cta: null, variant: 'default' };
  }
}
