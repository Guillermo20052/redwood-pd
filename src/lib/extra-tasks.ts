import extraData from '../../content/extra-tasks.json';
import type { TaskInputType } from './curriculum-path';

export type ExtraTask = {
  id: string;
  level: 'b' | 'i' | 'a';
  number: number;
  tool: string;
  title: string;
  description: string;
  inputType: TaskInputType;
  estimatedMinutes: number;
  rubric: string;
};

type ExtraTasksFile = {
  extras: {
    b: ExtraTask[];
    i: ExtraTask[];
    a: ExtraTask[];
  };
};

const data = extraData as ExtraTasksFile;

export const EXTRA_TASKS_BY_LEVEL = data.extras;

export function getExtraTasksForLevel(level: 'b' | 'i' | 'a'): ExtraTask[] {
  return EXTRA_TASKS_BY_LEVEL[level] ?? [];
}

export function getExtraTask(itemKey: string): ExtraTask | undefined {
  const match = itemKey.match(/^extra-lvl-(b|i|a)-(\d+)$/);
  if (!match) return undefined;
  const level = match[1] as 'b' | 'i' | 'a';
  const num = parseInt(match[2], 10);
  return getExtraTasksForLevel(level).find((t) => t.number === num);
}

export function isExtraItemKey(itemKey: string): boolean {
  return itemKey.startsWith('extra-lvl-');
}

export function parseExtraLevel(itemKey: string): 'b' | 'i' | 'a' | null {
  const m = itemKey.match(/^extra-lvl-(b|i|a)-/);
  return m ? (m[1] as 'b' | 'i' | 'a') : null;
}

/** User-facing badge on Level Up cards and modals. */
export function getExtraTaskBadgeLabel(level: 'b' | 'i' | 'a'): string {
  if (level === 'a') return 'TAREA LEVEL UP · DIPLOMA 3';
  if (level === 'i') return 'TAREA LEVEL UP · NIVEL 2';
  return 'TAREA LEVEL UP · NIVEL 1';
}
