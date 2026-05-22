import { getPartsByLevel } from './curriculum-path';
import { isPartComplete } from './part-progress';
import type { CompletionMap } from './verification';
import { parseExtraLevel } from './extra-tasks';

export const DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL = 4;

/** All 5 mandatory parts of a level have video + task + reflection verified. */
export function isLevelComplete(level: 'b' | 'i' | 'a', completions: CompletionMap): boolean {
  const parts = getPartsByLevel(level);
  if (parts.length < 5) return false;
  return parts.every((part) => isPartComplete(part, completions));
}

export function isExtraTaskAvailable(extraId: string, completions: CompletionMap): boolean {
  const level = parseExtraLevel(extraId);
  if (!level) return false;
  if (completions[extraId]?.status === 'verified') return false;
  return isLevelComplete(level, completions);
}

export function countCompletedExtras(level: 'b' | 'i' | 'a', completions: CompletionMap): number {
  let count = 0;
  for (let n = 1; n <= 10; n++) {
    const key = `extra-lvl-${level}-${n}`;
    if (completions[key]?.status === 'verified') count++;
  }
  return count;
}

export function meetsDiplomaExtrasRequirement(completions: CompletionMap): boolean {
  return (
    countCompletedExtras('b', completions) >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL &&
    countCompletedExtras('i', completions) >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL
  );
}

export type Diploma1Progress = {
  hoursOk: boolean;
  extrasL1: number;
  extrasL2: number;
  extrasL1Ok: boolean;
  extrasL2Ok: boolean;
  eligible: boolean;
};

export function getDiploma1Progress(
  totalHours: number,
  completions: CompletionMap
): Diploma1Progress {
  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const hoursOk = totalHours >= 20;
  const extrasL1Ok = extrasL1 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
  const extrasL2Ok = extrasL2 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
  return {
    hoursOk,
    extrasL1,
    extrasL2,
    extrasL1Ok,
    extrasL2Ok,
    eligible: hoursOk && extrasL1Ok && extrasL2Ok,
  };
}
