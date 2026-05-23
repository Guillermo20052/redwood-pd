import { getPartsByLevel } from './curriculum-path';
import { isPartComplete } from './part-progress';
import { getCollaborativeTaskForLevel, isCollabTaskVerified } from './collaborative-tasks';
import type { CompletionMap } from './verification';
import { parseExtraLevel } from './extra-tasks';

export const DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL = 4;

/** All 5 mandatory parts of a level have video + task + reflection verified. */
export function isMandatoryPartsComplete(
  level: 'b' | 'i' | 'a',
  completions: CompletionMap
): boolean {
  const parts = getPartsByLevel(level);
  if (parts.length < 5) return false;
  return parts.every((part) => isPartComplete(part, completions));
}

/** @deprecated Use isMandatoryPartsComplete — kept for callers expecting the old name. */
export function isLevelComplete(level: 'b' | 'i' | 'a', completions: CompletionMap): boolean {
  return isMandatoryPartsComplete(level, completions);
}

/** Five mandatory parts + collaborative task verified (full level completion). */
export function isLevelFullyComplete(level: 'b' | 'i' | 'a', completions: CompletionMap): boolean {
  return isMandatoryPartsComplete(level, completions) && isCollabTaskVerified(level, completions);
}

export function isExtraTaskAvailable(
  extraId: string,
  completions: CompletionMap,
  isAdmin = false
): boolean {
  if (isAdmin) return completions[extraId]?.status !== 'verified';
  const level = parseExtraLevel(extraId);
  if (!level) return false;
  if (completions[extraId]?.status === 'verified') return false;
  return isMandatoryPartsComplete(level, completions);
}

export function countCompletedExtras(level: 'b' | 'i' | 'a', completions: CompletionMap): number {
  let count = 0;
  for (let n = 1; n <= 10; n++) {
    const key = `extra-lvl-${level}-${n}`;
    if (completions[key]?.status === 'verified') count++;
  }
  return count;
}

/** Diploma 1 & 2: at least 4 Level Up tasks in Nivel 1 and Nivel 2. */
export function meetsDiploma1ExtrasRequirement(completions: CompletionMap): boolean {
  return (
    countCompletedExtras('b', completions) >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL &&
    countCompletedExtras('i', completions) >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL
  );
}

/** Diploma 3: at least 4 Level Up tasks in Nivel 3. */
export function meetsDiploma3ExtrasRequirement(completions: CompletionMap): boolean {
  return countCompletedExtras('a', completions) >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
}

/** @deprecated Alias for meetsDiploma1ExtrasRequirement */
export function meetsDiplomaExtrasRequirement(completions: CompletionMap): boolean {
  return meetsDiploma1ExtrasRequirement(completions);
}

export type Diploma1Progress = {
  hoursOk: boolean;
  extrasL1: number;
  extrasL2: number;
  extrasL3: number;
  extrasL1Ok: boolean;
  extrasL2Ok: boolean;
  extrasL3Ok: boolean;
  eligible: boolean;
};

export function getDiploma1Progress(
  totalHours: number,
  completions: CompletionMap
): Diploma1Progress {
  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const extrasL3 = countCompletedExtras('a', completions);
  const hoursOk = totalHours >= 20;
  const extrasL1Ok = extrasL1 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
  const extrasL2Ok = extrasL2 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
  const extrasL3Ok = extrasL3 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
  return {
    hoursOk,
    extrasL1,
    extrasL2,
    extrasL3,
    extrasL1Ok,
    extrasL2Ok,
    extrasL3Ok,
    eligible: hoursOk && extrasL1Ok && extrasL2Ok,
  };
}

export function getCollabTaskForLevel(level: 'b' | 'i' | 'a') {
  return getCollaborativeTaskForLevel(level);
}
