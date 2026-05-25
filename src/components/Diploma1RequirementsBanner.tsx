'use client';

import type { CompletionMap } from '@/lib/verification';
import { getDiploma1Progress } from '@/lib/extras-gating';

type Props = {
  totalHours: number;
  completions: CompletionMap;
};

export function Diploma1RequirementsBanner({ totalHours, completions }: Props) {
  const d1 = getDiploma1Progress(totalHours, completions);

  return (
    <div className="extras-diploma-banner border-2 border-[var(--gold)] bg-[var(--gold-light)] space-y-2">
      <p className="text-sm font-bold text-[var(--navy)]">
        Para conseguir el Diploma 1 (Bronce) necesitas estas 3 cosas:
      </p>
      <ul className="text-sm text-[var(--gray-800)] space-y-1 list-none">
        <li>
          {d1.hoursOk ? '✓' : '○'} Completar Niveles 1 y 2 — 20 horas verificadas{' '}
          <span className="text-[var(--gray-500)]">({totalHours.toFixed(1)}h actuales)</span>
        </li>
        <li>
          {d1.extrasL1Ok ? '✓' : '○'} Terminar 4 tareas Level Up del Nivel 1 ({d1.extrasL1}/4)
        </li>
        <li>
          {d1.extrasL2Ok ? '✓' : '○'} Terminar 4 tareas Level Up del Nivel 2 ({d1.extrasL2}/4)
        </li>
      </ul>
      <p className="text-sm text-[var(--gray-700)] leading-relaxed pt-1">
        Una vez logres el Diploma 1, desbloqueas la ruta al Diploma 2 (Plata, 24h) y al Diploma 3
        (Oro, 30h + 4 tareas Level Up del Nivel 3).
      </p>
    </div>
  );
}
