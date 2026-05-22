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
      className={`extra-task-card text-left w-full ${locked ? 'extra-task-card--locked' : ''} ${verified ? 'extra-task-card--verified' : ''}`}
      style={{
        border: '1px solid var(--gray-200)',
        borderRadius: 12,
        padding: '14px 16px',
        background: locked ? 'var(--gray-50)' : verified ? 'rgba(26,122,110,0.06)' : 'white',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.75 : 1,
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
          }}
        >
          TAREA LEVEL UP · OPCIONAL
        </span>
        <span className="text-[10px] text-[var(--gray-500)]">#{task.number}</span>
      </div>

      <p
        className="text-[11px] font-bold uppercase tracking-wide mb-1"
        style={{ color: 'var(--gray-500)' }}
      >
        {task.tool} · {inputLabel(task.inputType)} · ~{task.estimatedMinutes} min
      </p>

      <h4
        className="text-sm font-semibold leading-snug mb-2"
        style={{ color: locked ? 'var(--gray-500)' : 'var(--navy)' }}
      >
        {locked ? '🔒 ' : verified ? '✓ ' : ''}
        {task.title}
      </h4>

      {locked && (
        <p className="text-xs text-[var(--gray-500)] leading-relaxed">
          Completa el {LEVEL_LABEL[task.level]} para desbloquear las tareas Level Up.
        </p>
      )}

      {verified && (
        <p className="text-xs font-semibold" style={{ color: 'var(--teal)' }}>
          Completada
        </p>
      )}

      {status === 'available' && (
        <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>
          Toca para abrir y enviar →
        </p>
      )}
    </button>
  );
}
