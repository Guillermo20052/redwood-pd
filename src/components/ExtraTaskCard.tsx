'use client';

import type { ExtraTask } from '@/lib/extra-tasks';
import type { CompletionMap } from '@/lib/verification';
import { isExtraTaskAvailable, isLevelComplete } from '@/lib/extras-gating';

export type ExtraTaskStatus = 'locked' | 'available' | 'verified';

type Props = {
  task: ExtraTask;
  completions: CompletionMap;
  isAdmin?: boolean;
  onOpen: (task: ExtraTask) => void;
};

const LEVEL_LABEL: Record<string, string> = {
  b: 'Nivel 1',
  i: 'Nivel 2',
  a: 'Nivel 3',
};

function inputLabel(type: ExtraTask['inputType']): string {
  if (type === 'screenshot') return '📷 Captura';
  if (type === 'document') return '📄 Documento';
  return '✍️ Texto';
}

export function getExtraTaskStatus(
  task: ExtraTask,
  completions: CompletionMap,
  isAdmin = false
): ExtraTaskStatus {
  if (completions[task.id]?.status === 'verified') return 'verified';
  if (isAdmin || isExtraTaskAvailable(task.id, completions, isAdmin)) return 'available';
  if (!isLevelComplete(task.level, completions)) return 'locked';
  return 'locked';
}

export function ExtraTaskCard({ task, completions, isAdmin = false, onOpen }: Props) {
  const status = getExtraTaskStatus(task, completions, isAdmin);
  const locked = status === 'locked';
  const verified = status === 'verified';

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => !locked && onOpen(task)}
      className={`extra-task-card text-left w-full ${locked ? 'extra-task-card--locked' : ''} ${verified ? 'extra-task-card--verified' : ''} ${!locked && !verified ? 'extra-task-card--available' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="extra-task-badge">TAREA LEVEL UP · OPCIONAL</span>
        <span className="text-[10px] font-bold text-[var(--gray-400)]">#{task.number}</span>
      </div>

      <p className="extra-task-tool">
        {task.tool} · {inputLabel(task.inputType)} · ~{task.estimatedMinutes} min
      </p>

      <h4
        className={`extra-task-title mb-2 ${locked ? 'text-[var(--gray-500)]' : 'text-[var(--navy)]'}`}
      >
        {locked ? '🔒 ' : verified ? '✓ ' : ''}
        {task.title}
      </h4>

      {locked && (
        <p className="text-xs text-[var(--gray-600)] leading-relaxed pl-1 border-l-2 border-[var(--gray-300)]">
          Completa el {LEVEL_LABEL[task.level]} para desbloquear las tareas Level Up.
        </p>
      )}

      {verified && (
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--teal)]">
          Completada
        </p>
      )}

      {status === 'available' && (
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
          Toca para abrir y enviar →
        </p>
      )}
    </button>
  );
}
