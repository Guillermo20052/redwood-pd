import { getPartsByLevel } from './curriculum-path';
import { isDiplomaTierEarned, type DiplomaTier } from './diplomas';
import type { Diploma3ProgramRequirements } from './diploma3-requirements';
import { isLevelFullyComplete } from './extras-gating';
import { isPartComplete } from './part-progress';
import type { CompletionMap } from './verification';
import { sumVerifiedHours } from './verification';

export type ProgressState = {
  completions: CompletionMap;
  totalHours: number;
  verifiedVideos: number;
  verifiedTasks: number;
  verifiedExtras: number;
  diploma3Program?: Diploma3ProgramRequirements | null;
};

export type CelebrationEvent =
  | { type: 'first_video' }
  | { type: 'first_task' }
  | { type: 'first_extra' }
  | { type: 'part_complete'; partId: string }
  | { type: 'level_complete'; level: 'b' | 'i' | 'a' }
  | { type: 'diploma_earned'; tier: DiplomaTier }
  | { type: 'hours_milestone'; threshold: number };

const HOUR_MILESTONES = [5, 10, 15] as const;
const LEVELS = ['b', 'i', 'a'] as const;

function countVerifiedVideos(completions: CompletionMap): number {
  return Object.entries(completions).filter(
    ([key, row]) => row.status === 'verified' && key.startsWith('lvl-') && key.endsWith('-video')
  ).length;
}

function countVerifiedTasks(completions: CompletionMap): number {
  return Object.entries(completions).filter(([key, row]) => {
    if (row.status !== 'verified') return false;
    if (key.startsWith('collab-lvl-')) return true;
    return key.startsWith('lvl-') && key.endsWith('-task');
  }).length;
}

function countVerifiedExtras(completions: CompletionMap): number {
  return Object.entries(completions).filter(
    ([key, row]) => row.status === 'verified' && key.startsWith('extra-lvl-')
  ).length;
}

function getAllParts() {
  return LEVELS.flatMap((level) => getPartsByLevel(level));
}

export function buildProgressState(
  completions: CompletionMap,
  diploma3Program?: Diploma3ProgramRequirements | null
): ProgressState {
  return {
    completions,
    totalHours: sumVerifiedHours(completions),
    verifiedVideos: countVerifiedVideos(completions),
    verifiedTasks: countVerifiedTasks(completions),
    verifiedExtras: countVerifiedExtras(completions),
    diploma3Program,
  };
}

export function detectCelebrations(prev: ProgressState, next: ProgressState): CelebrationEvent[] {
  const events: CelebrationEvent[] = [];

  if (prev.verifiedVideos === 0 && next.verifiedVideos >= 1) {
    events.push({ type: 'first_video' });
  }

  if (prev.verifiedTasks === 0 && next.verifiedTasks >= 1) {
    events.push({ type: 'first_task' });
  }

  if (prev.verifiedExtras === 0 && next.verifiedExtras >= 1) {
    events.push({ type: 'first_extra' });
  }

  for (const part of getAllParts()) {
    const wasComplete = isPartComplete(part, prev.completions);
    const nowComplete = isPartComplete(part, next.completions);
    if (!wasComplete && nowComplete) {
      events.push({ type: 'part_complete', partId: part.partId });
    }
  }

  for (const level of LEVELS) {
    const wasComplete = isLevelFullyComplete(level, prev.completions);
    const nowComplete = isLevelFullyComplete(level, next.completions);
    if (!wasComplete && nowComplete) {
      events.push({ type: 'level_complete', level });
    }
  }

  for (const tier of [1, 2, 3] as DiplomaTier[]) {
    if (
      !isDiplomaTierEarned(
        tier,
        prev.totalHours,
        prev.completions,
        tier === 3 ? prev.diploma3Program : undefined
      ) &&
      isDiplomaTierEarned(
        tier,
        next.totalHours,
        next.completions,
        tier === 3 ? next.diploma3Program : undefined
      )
    ) {
      events.push({ type: 'diploma_earned', tier });
    }
  }

  for (const threshold of HOUR_MILESTONES) {
    if (prev.totalHours < threshold && next.totalHours >= threshold) {
      events.push({ type: 'hours_milestone', threshold });
    }
  }

  return events;
}
