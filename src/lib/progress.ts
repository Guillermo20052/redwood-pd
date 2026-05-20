import { metaConfig, hoursMap } from './content';
import type { CompletionMap } from './verification';
import { sumVerifiedHours, getDiplomaTier, getLevelHoursVerified, isLevelUnlocked } from './verification';
import { getEarnedDiplomas as getEarnedDiplomasFromLib, getNextDiploma as getNextDiplomaFromLib } from './diplomas';

export type { CompletionMap };

export { sumVerifiedHours, getDiplomaTier, getLevelHoursVerified, isLevelUnlocked };

/** Convenience re-exports so callers don't need to know about `./diplomas`. */
export const getEarnedDiplomas = getEarnedDiplomasFromLib;
export const getNextDiploma = getNextDiplomaFromLib;

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
