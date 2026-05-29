'use client';

import type { CSSProperties } from 'react';
import type { PracticeCompletionRow } from '@/lib/local-db';
import type { PracticeTask, PracticeToolMeta } from '@/lib/practice-tasks';

type Props = {
  task: PracticeTask;
  toolMeta: PracticeToolMeta;
  completion?: PracticeCompletionRow;
  onOpen: (task: PracticeTask) => void;
};

export function PracticeTaskCard({ task, toolMeta, completion, onOpen }: Props) {
  const done = Boolean(completion);

  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className={`practice-task-card ${done ? 'practice-task-card--done' : ''}`}
      style={{ '--practice-accent': toolMeta.accent } as CSSProperties}
    >
      <div className="practice-task-card__top">
        <span className="practice-task-card__badge">{toolMeta.label}</span>
        <span className="practice-task-card__time">~{task.estimatedMinutes} min</span>
      </div>
      <h4 className="practice-task-card__title">
        {done ? '✓ ' : ''}
        {task.title}
      </h4>
      {done ? (
        <p className="practice-task-card__status">Completada · práctica registrada</p>
      ) : (
        <p className="practice-task-card__cta">Abrir instrucciones →</p>
      )}
    </button>
  );
}
