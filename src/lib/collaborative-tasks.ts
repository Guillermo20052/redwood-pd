import collabData from '../../content/collaborative-tasks.json';
import type { TaskInputType } from './curriculum-path';

export type CollaborativeTask = {
  id: string;
  level: 'b' | 'i' | 'a';
  title: string;
  description: string;
  inputType: TaskInputType;
  estimatedMinutes: number;
  pairTask?: boolean;
  smallGroup?: boolean;
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

export function getCollaborativeTask(itemKey: string): CollaborativeTask | undefined {
  const m = itemKey.match(/^collab-lvl-(b|i|a)-/);
  if (!m) return undefined;
  const level = m[1] as 'b' | 'i' | 'a';
  return getCollaborativeTasksForLevel(level).find((t) => t.id === itemKey);
}

export function isCollabItemKey(itemKey: string): boolean {
  return itemKey.startsWith('collab-lvl-');
}

export function countCollaborativeTasksForLevel(level: 'b' | 'i' | 'a'): number {
  return getCollaborativeTasksForLevel(level).length;
}
