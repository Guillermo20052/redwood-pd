import { metaConfig, hoursMap } from './content';
import type { CompletionMap } from './verification';
import { sumVerifiedHours, getDiplomaTier, getLevelHoursVerified, isLevelUnlocked } from './verification';
import {
  getEarnedDiplomas as getEarnedDiplomasFromLib,
  getNextDiploma as getNextDiplomaFromLib,
  isDiplomaTierEarned,
} from './diplomas';
import { getDiploma1Progress } from './extras-gating';
import type { Diploma3ProgramRequirements } from './diploma3-requirements';

export type { CompletionMap };

export { sumVerifiedHours, getDiplomaTier, getLevelHoursVerified, isLevelUnlocked };

/** Convenience re-exports so callers don't need to know about `./diplomas`. */
export const getEarnedDiplomas = getEarnedDiplomasFromLib;
export const getNextDiploma = getNextDiplomaFromLib;

const DIPLOMA_THRESHOLDS = [
  { tier: 1 as const, baseline: 0, target: 20, shortLabel: 'Diploma 1 (Bronce)' },
  { tier: 2 as const, baseline: 20, target: 24, shortLabel: 'Diploma 2 (Plata)' },
  { tier: 3 as const, baseline: 24, target: 30, shortLabel: 'Diploma 3 (Oro)' },
];

export type ProgressBannerState = {
  fillPercent: number;
  thresholdLabel: string;
  hint: string;
  complete: boolean;
  goldGlow?: boolean;
};

/** Dynamic top-bar progress toward the teacher's next earnable diploma. */
export function getProgressBannerState(
  totalHours: number,
  completions: CompletionMap,
  isAdmin = false,
  diploma3Program?: Diploma3ProgramRequirements | null
): ProgressBannerState {
  if (isAdmin) {
    return {
      fillPercent: 100,
      thresholdLabel: 'Vista admin · camino completo',
      hint: 'Progreso de vista previa',
      complete: true,
      goldGlow: true,
    };
  }

  if (isDiplomaTierEarned(3, totalHours, completions, diploma3Program)) {
    return {
      fillPercent: 100,
      thresholdLabel: '30h · Camino completo',
      hint: 'Eres Docente IA Transformadora 🌲',
      complete: true,
      goldGlow: true,
    };
  }

  const next = getNextDiplomaFromLib(totalHours, completions, diploma3Program);
  if (!next) {
    return {
      fillPercent: 100,
      thresholdLabel: '30h · Camino completo',
      hint: 'Eres Docente IA Transformadora 🌲',
      complete: true,
      goldGlow: true,
    };
  }

  const step = DIPLOMA_THRESHOLDS.find((s) => s.tier === next.tier)!;
  const span = step.target - step.baseline;
  const hoursInSegment = Math.max(0, totalHours - step.baseline);
  const fillPercent =
    span > 0 ? Math.min(100, (hoursInSegment / span) * 100) : totalHours >= step.target ? 100 : 0;

  const d1 = getDiploma1Progress(totalHours, completions);
  let hint: string;

  if (next.tier === 1 && d1.hoursOk && (!d1.extrasL1Ok || !d1.extrasL2Ok)) {
    hint = `Level Up L1 ${d1.extrasL1}/4 · L2 ${d1.extrasL2}/4 para ${step.shortLabel}`;
  } else if (totalHours < next.hoursRequired) {
    hint = `${(next.hoursRequired - totalHours).toFixed(1)}h restantes para ${step.shortLabel}`;
  } else if (next.tier === 3) {
    hint = `Completa tareas Level Up del Nivel 3 para ${step.shortLabel}`;
  } else {
    hint = `Completa tareas Level Up para ${step.shortLabel}`;
  }

  return {
    fillPercent,
    thresholdLabel: `/ ${step.target}h · ${step.shortLabel}`,
    hint,
    complete: false,
  };
}

export function progressPercent(total: number): number {
  return Math.min((total / metaConfig.totalGoalHours) * 100, 100);
}

// Legacy alias
export function getLevelHours(completions: CompletionMap, level: 'b' | 'i' | 'a') {
  return getLevelHoursVerified(completions, level);
}

/** Verified hours in this level as a percentage of the level target (capped at 100). */
export function getLevelProgressPercent(
  completions: CompletionMap,
  level: 'b' | 'i' | 'a',
  targetHours = 10
): number {
  const hours = getLevelHoursVerified(completions, level);
  if (targetHours <= 0) return 0;
  return Math.min(100, Math.round((hours / targetHours) * 100));
}

/** Legacy admin export: sum hours from boolean checklist map */
export function sumHours(checked: Record<string, boolean>): number {
  let total = 0;
  for (const [key, val] of Object.entries(checked)) {
    if (val) total += hoursMap[key] ?? 0;
  }
  return Math.round(total * 10) / 10;
}
