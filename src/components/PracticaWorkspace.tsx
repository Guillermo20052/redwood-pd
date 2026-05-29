'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PracticeCompletionRow } from '@/lib/local-db';
import {
  PRACTICE_TOOL_ORDER,
  PRACTICE_TOOLS,
  getPracticeTasksForTool,
  type PracticeTask,
  type PracticeToolId,
} from '@/lib/practice-tasks';
import { PracticeTaskCard } from './PracticeTaskCard';
import { PracticeTaskModal } from './PracticeTaskModal';

export function PracticaWorkspace() {
  const [completions, setCompletions] = useState<Record<string, PracticeCompletionRow>>({});
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<PracticeTask | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/practica/status');
      if (!res.ok) return;
      const data = await res.json();
      setCompletions(data.completions ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const doneCount = useMemo(
    () => Object.keys(completions).length,
    [completions]
  );

  const handleCompleted = (taskId: string, row: PracticeCompletionRow) => {
    setCompletions((prev) => ({ ...prev, [taskId]: row }));
  };

  return (
    <div className="app-page practica-page">
      <header className="practica-hero">
        <div className="practica-hero__tag">Taller · Herramientas de IA</div>
        <h1 className="practica-hero__title font-condensed">Práctica</h1>
        <p className="practica-hero__lead">
          15 ejercicios cortos con Claude, Diffit y NotebookLM. Explora sin presión: cada entrega
          recibe retroalimentación alentadora y <strong>no cuenta</strong> para diplomas ni horas del
          programa.
        </p>
        <div className="practica-hero__stats">
          <span className="practica-stat">
            <span className="practica-stat__value">{doneCount}</span>
            <span className="practica-stat__label">de 15 completadas</span>
          </span>
          <span className="practica-stat practica-stat--muted">
            Sube PDF, PNG o JPG · ~8–12 min por tarea
          </span>
        </div>
      </header>

      {loading && (
        <p className="practica-loading text-sm text-[var(--gray-500)]">Cargando tu progreso…</p>
      )}

      {PRACTICE_TOOL_ORDER.map((toolId) => {
        const meta = PRACTICE_TOOLS[toolId];
        const tasks = getPracticeTasksForTool(toolId);
        const toolDone = tasks.filter((t) => completions[t.id]).length;

        return (
          <section key={toolId} className="practica-tool-section">
            <div
              className="practica-tool-header"
              style={{ background: meta.accent }}
            >
              <div>
                <h2 className="practica-tool-header__title font-condensed">{meta.label}</h2>
                <p className="practica-tool-header__intro">{meta.intro}</p>
              </div>
              <span className="practica-tool-header__count">
                {toolDone}/{tasks.length}
              </span>
            </div>

            <div className="practica-task-grid">
              {tasks.map((task) => (
                <PracticeTaskCard
                  key={task.id}
                  task={task}
                  toolMeta={meta}
                  completion={completions[task.id]}
                  onOpen={setActiveTask}
                />
              ))}
            </div>
          </section>
        );
      })}

      {activeTask && (
        <PracticeTaskModal
          task={activeTask}
          toolMeta={PRACTICE_TOOLS[activeTask.tool as PracticeToolId]}
          completion={completions[activeTask.id]}
          onClose={() => setActiveTask(null)}
          onCompleted={handleCompleted}
        />
      )}
    </div>
  );
}
