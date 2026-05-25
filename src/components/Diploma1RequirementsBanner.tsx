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
    <div className="extras-diploma-banner">
      <p className="extras-diploma-eyebrow">Diploma 1 (Bronce)</p>
      <p className="extras-diploma-title">
        Para conseguir el Diploma 1 necesitas estas 3 cosas:
      </p>
      <ul className="extras-diploma-list">
        <li className={d1.hoursOk ? 'extras-diploma-req extras-diploma-req--done' : 'extras-diploma-req'}>
          Completar Niveles 1 y 2 — 20 horas verificadas{' '}
          <span className="extras-diploma-req-meta">({totalHours.toFixed(1)}h actuales)</span>
        </li>
        <li
          className={
            d1.extrasL1Ok ? 'extras-diploma-req extras-diploma-req--done' : 'extras-diploma-req'
          }
        >
          Terminar 4 tareas Level Up del Nivel 1 ({d1.extrasL1}/4)
        </li>
        <li
          className={
            d1.extrasL2Ok ? 'extras-diploma-req extras-diploma-req--done' : 'extras-diploma-req'
          }
        >
          Terminar 4 tareas Level Up del Nivel 2 ({d1.extrasL2}/4)
        </li>
      </ul>
      <p className="extras-diploma-next">
        El Diploma 1 (Bronce) es tu primer milestone. Para alcanzar el Diploma 3 (Oro) necesitas
        completar los 3 niveles + 4 Level Up por nivel.
      </p>
    </div>
  );
}
