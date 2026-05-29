import practiceData from '../../content/practice-tasks.json';

export type PracticeToolId = 'claude' | 'diffit' | 'notebooklm';

export type PracticeTask = {
  id: string;
  tool: PracticeToolId;
  title: string;
  description: string;
  expectedOutput: string;
  tip?: string;
  estimatedMinutes: number;
};

export type PracticeToolMeta = {
  label: string;
  accent: string;
  intro: string;
};

type PracticeTasksFile = {
  tools: Record<PracticeToolId, PracticeToolMeta>;
  tasks: PracticeTask[];
};

const data = practiceData as PracticeTasksFile;

export const PRACTICE_TOOLS = data.tools;

export const PRACTICE_TASKS: PracticeTask[] = data.tasks;

export const PRACTICE_TOOL_ORDER: PracticeToolId[] = ['claude', 'diffit', 'notebooklm'];

export function isPracticeTaskId(taskId: string): boolean {
  return taskId.startsWith('practica-');
}

export function getPracticeTask(taskId: string): PracticeTask | undefined {
  return PRACTICE_TASKS.find((t) => t.id === taskId);
}

export function getPracticeTasksForTool(tool: PracticeToolId): PracticeTask[] {
  return PRACTICE_TASKS.filter((t) => t.tool === tool);
}
