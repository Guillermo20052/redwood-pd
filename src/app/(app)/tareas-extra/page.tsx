'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';
import { ExtraTaskCard } from '@/components/ExtraTaskCard';
import { ExtraTaskModal } from '@/components/ExtraTaskModal';
import { Diploma1RequirementsBanner } from '@/components/Diploma1RequirementsBanner';
import { getExtraTasksForLevel, type ExtraTask } from '@/lib/extra-tasks';
import {
  countCompletedExtras,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  isLevelComplete,
} from '@/lib/extras-gating';

const SECTIONS: {
  level: 'b' | 'i' | 'a';
  title: string;
  accent: string;
  diplomaTier?: 1 | 3;
}[] = [
  { level: 'b', title: 'Nivel 1 · Fundamentos', accent: 'var(--navy)', diplomaTier: 1 },
  { level: 'i', title: 'Nivel 2 · Integración', accent: 'var(--teal)', diplomaTier: 1 },
  { level: 'a', title: 'Nivel 3 · Transformación', accent: 'var(--red)', diplomaTier: 3 },
];

function LevelExtraSection({
  level,
  title,
  accent,
  diplomaTier,
  completions,
  isAdmin,
  onOpenTask,
}: {
  level: 'b' | 'i' | 'a';
  title: string;
  accent: string;
  diplomaTier?: 1 | 3;
  completions: ReturnType<typeof useProgressContext>['completions'];
  isAdmin: boolean;
  onOpenTask: (t: ExtraTask) => void;
}) {
  const tasks = getExtraTasksForLevel(level);
  const done = countCompletedExtras(level, completions);
  const levelDone = isAdmin || isLevelComplete(level, completions);
  const diplomaMet = !diplomaTier || done >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL;
  const diplomaLabel = diplomaTier === 3 ? 'Diploma 3 (Oro)' : 'Diploma 1';

  return (
    <section className="space-y-4">
      <div
        className="extras-level-header rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ background: accent, color: 'white' }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-condensed text-xl font-extrabold">{title}</h3>
        </div>
        <p className="text-sm font-semibold opacity-90">
          {done} de 10 completadas
        </p>
      </div>

      <div className="h-2 rounded-full bg-[var(--gray-200)] overflow-hidden">
        <div
          className="extras-progress-fill h-full rounded-full transition-all duration-500"
          style={{ width: `${(done / 10) * 100}%`, background: accent }}
        />
      </div>

      {diplomaTier && (
        <p className="text-sm text-[var(--gray-700)]">
          Necesitas {DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} para {diplomaLabel}{' '}
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

      {diplomaTier === 3 && (
        <p className="text-sm text-[var(--gray-600)] leading-relaxed">
          Estas tareas son la etapa final del camino — completar 4 de ellas te acerca al Diploma 3
          (Oro): Docente IA Transformadora.
        </p>
      )}

      {!isAdmin && !levelDone && (
        <p
          className="text-sm rounded-lg px-4 py-3 border"
          style={{
            borderColor: 'var(--gray-300)',
            background: 'var(--gray-50)',
            color: 'var(--gray-600)',
          }}
        >
          Completa las 5 partes de este nivel para desbloquear las 10 tareas Level Up.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {tasks.map((task) => (
          <ExtraTaskCard
            key={task.id}
            task={task}
            completions={completions}
            isAdmin={isAdmin}
            onOpen={onOpenTask}
          />
        ))}
      </div>
    </section>
  );
}

export default function TareasExtraPage() {
  const { completions, totalHours, refreshCompletions, profile } = useProgressContext();
  const [activeTask, setActiveTask] = useState<ExtraTask | null>(null);
  const isAdmin = profile.role === 'admin';

  return (
    <div className="app-page tareas-extra-page pb-12">
      {isAdmin && (
        <p
          className="text-xs font-semibold rounded-lg px-3 py-2"
          style={{
            background: 'color-mix(in srgb, var(--gold) 18%, transparent)',
            border: '1px solid var(--gold)',
            color: 'var(--navy)',
          }}
        >
          Vista previa de admin · todas las tareas Level Up desbloqueadas · sin guardar en la base de
          datos
        </p>
      )}

      <div className="extras-page-hero">
        <div className="level-hero-tag text-[var(--gold)] tracking-[0.2em]">
          CAMINO AL DIPLOMA 3 (ORO)
        </div>
        <h2 className="font-condensed font-extrabold text-[var(--navy)]">
          Tareas Level Up
        </h2>
        <p className="text-sm text-[var(--gray-600)] mt-2 max-w-2xl">
          Las Tareas Level Up son parte del camino completo. Necesitas 4 por nivel — 12 en total —
          para alcanzar el Diploma 3. Se desbloquean al completar las 5 partes del nivel
          correspondiente.
        </p>
      </div>

      <Diploma1RequirementsBanner totalHours={totalHours} completions={completions} />

      {SECTIONS.map((s) => (
        <LevelExtraSection
          key={s.level}
          level={s.level}
          title={s.title}
          accent={s.accent}
          diplomaTier={s.diplomaTier}
          completions={completions}
          isAdmin={isAdmin}
          onOpenTask={setActiveTask}
        />
      ))}

      {activeTask && (
        <ExtraTaskModal
          task={activeTask}
          isAdmin={isAdmin}
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
