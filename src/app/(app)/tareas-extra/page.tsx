'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';
import { ExtraTaskCard } from '@/components/ExtraTaskCard';
import { ExtraTaskModal } from '@/components/ExtraTaskModal';
import { getExtraTasksForLevel, type ExtraTask } from '@/lib/extra-tasks';
import {
  countCompletedExtras,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  getDiploma1Progress,
  isLevelComplete,
} from '@/lib/extras-gating';

const SECTIONS: {
  level: 'b' | 'i' | 'a';
  title: string;
  accent: string;
  optional?: boolean;
  diplomaRelevant?: boolean;
}[] = [
  { level: 'b', title: 'Nivel 1 · Fundamentos', accent: 'var(--navy)', diplomaRelevant: true },
  { level: 'i', title: 'Nivel 2 · Integración', accent: 'var(--teal)', diplomaRelevant: true },
  {
    level: 'a',
    title: 'Nivel 3 · Transformación',
    accent: 'var(--red)',
    optional: true,
    diplomaRelevant: false,
  },
];

function LevelExtraSection({
  level,
  title,
  accent,
  optional,
  diplomaRelevant,
  completions,
  onOpenTask,
}: {
  level: 'b' | 'i' | 'a';
  title: string;
  accent: string;
  optional?: boolean;
  diplomaRelevant?: boolean;
  completions: ReturnType<typeof useProgressContext>['completions'];
  onOpenTask: (t: ExtraTask) => void;
}) {
  const tasks = getExtraTasksForLevel(level);
  const done = countCompletedExtras(level, completions);
  const levelDone = isLevelComplete(level, completions);
  const diplomaMet =
    !diplomaRelevant || done >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;

  return (
    <section className="space-y-4">
      <div
        className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ background: accent, color: 'white' }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-condensed text-xl font-extrabold">{title}</h3>
          {optional && (
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            >
              Opcional
            </span>
          )}
        </div>
        <p className="text-sm font-semibold opacity-90">
          {done} de 10 completadas
        </p>
      </div>

      <div className="h-2 rounded-full bg-[var(--gray-200)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(done / 10) * 100}%`, background: accent }}
        />
      </div>

      {diplomaRelevant && (
        <p className="text-sm text-[var(--gray-700)]">
          Necesitas {DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} para Diploma 1{' '}
          {diplomaMet ? (
            <span className="font-semibold" style={{ color: 'var(--teal)' }}>
              · {done}/{DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} ✓
            </span>
          ) : (
            <span className="font-semibold text-[var(--gold)]">
              · {done}/{DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} (faltan{' '}
              {DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - done})
            </span>
          )}
        </p>
      )}

      {!levelDone && (
        <p
          className="text-sm rounded-lg px-4 py-3 border"
          style={{
            borderColor: 'var(--gray-300)',
            background: 'var(--gray-50)',
            color: 'var(--gray-600)',
          }}
        >
          Completa las 5 partes obligatorias de este nivel para desbloquear las 10 tareas extra.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tasks.map((task) => (
          <ExtraTaskCard
            key={task.id}
            task={task}
            completions={completions}
            onOpen={onOpenTask}
          />
        ))}
      </div>
    </section>
  );
}

export default function TareasExtraPage() {
  const { completions, totalHours, refreshCompletions } = useProgressContext();
  const [activeTask, setActiveTask] = useState<ExtraTask | null>(null);
  const d1 = getDiploma1Progress(totalHours, completions);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="level-hero-tag" style={{ color: 'var(--gold)' }}>
          Práctica adicional
        </div>
        <h2 className="font-condensed text-3xl font-extrabold text-[var(--navy)]">
          Tareas Extra
        </h2>
        <p className="text-sm text-[var(--gray-600)] mt-2 max-w-2xl">
          Práctica adicional con cada herramienta del nivel. Las tareas se desbloquean al
          completar las 5 partes obligatorias del nivel correspondiente.
        </p>
      </div>

      <div
        className="rounded-xl border-2 p-4 space-y-2"
        style={{ borderColor: 'var(--gold)', background: 'var(--gold-light)' }}
      >
        <p className="text-sm font-bold text-[var(--navy)]">
          Para obtener el Diploma 1 necesitas:
        </p>
        <ul className="text-sm text-[var(--gray-800)] space-y-1 list-none">
          <li>
            {d1.hoursOk ? '✓' : '○'} 20h verificadas (Niveles 1 y 2 obligatorios){' '}
            <span className="text-[var(--gray-500)]">({totalHours.toFixed(1)}h)</span>
          </li>
          <li>
            {d1.extrasL1Ok ? '✓' : '○'} Al menos 4 tareas extra de Nivel 1 ({d1.extrasL1}/4)
          </li>
          <li>
            {d1.extrasL2Ok ? '✓' : '○'} Al menos 4 tareas extra de Nivel 2 ({d1.extrasL2}/4)
          </li>
        </ul>
        <p className="text-xs text-[var(--gray-600)] pt-1">
          Las tareas extra de Nivel 3 son completamente opcionales y no afectan ningún diploma.
        </p>
      </div>

      {SECTIONS.map((s) => (
        <LevelExtraSection
          key={s.level}
          level={s.level}
          title={s.title}
          accent={s.accent}
          optional={s.optional}
          diplomaRelevant={s.diplomaRelevant}
          completions={completions}
          onOpenTask={setActiveTask}
        />
      ))}

      {activeTask && (
        <ExtraTaskModal
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onVerified={() => {
            void refreshCompletions();
            setActiveTask(null);
          }}
        />
      )}
    </div>
  );
}
