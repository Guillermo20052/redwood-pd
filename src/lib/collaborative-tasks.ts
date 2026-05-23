import collabData from '../../content/collaborative-tasks.json';
import type { TaskInputType } from './curriculum-path';

export const COLLAB_VERIFIED_HOURS = 2;

export type CollaborativeTask = {
  id: string;
  level: 'b' | 'i' | 'a';
  levelLabel: string;
  title: string;
  description: string;
  inputType: TaskInputType;
  estimatedMinutes: number;
  verifiedHours: number;
  allowMultiplePartners?: boolean;
};

type CollabFile = {
  collaborative: {
    b: CollaborativeTask[];
    i: CollaborativeTask[];
    a: CollaborativeTask[];
  };
};

const data = collabData as CollabFile;

export const COLLABORATIVE_TASKS_BY_LEVEL = data.collaborative;

export function getCollaborativeTasksForLevel(level: 'b' | 'i' | 'a'): CollaborativeTask[] {
  return COLLABORATIVE_TASKS_BY_LEVEL[level] ?? [];
}

/** Single required collaborative task per level (first in list). */
export function getCollaborativeTaskForLevel(level: 'b' | 'i' | 'a'): CollaborativeTask | undefined {
  return getCollaborativeTasksForLevel(level)[0];
}

export function getCollaborativeTask(itemKey: string): CollaborativeTask | undefined {
  const m = itemKey.match(/^collab-lvl-(b|i|a)$/);
  if (!m) return undefined;
  const level = m[1] as 'b' | 'i' | 'a';
  return getCollaborativeTasksForLevel(level).find((t) => t.id === itemKey);
}

export function isCollabItemKey(itemKey: string): boolean {
  return /^collab-lvl-(b|i|a)$/.test(itemKey);
}

export function countCollaborativeTasksForLevel(level: 'b' | 'i' | 'a'): number {
  return getCollaborativeTasksForLevel(level).length;
}

export function isCollabTaskVerified(
  level: 'b' | 'i' | 'a',
  completions: Record<string, { status?: string } | undefined>
): boolean {
  const task = getCollaborativeTaskForLevel(level);
  if (!task) return true;
  return completions[task.id]?.status === 'verified';
}
