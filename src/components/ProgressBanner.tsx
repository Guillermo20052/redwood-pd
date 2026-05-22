'use client';

import { getNextDiploma } from '@/lib/diplomas';
import { getDiploma1Progress } from '@/lib/extras-gating';
import type { CompletionMap } from '@/lib/verification';

type Props = {
  totalHours: number;
  percent: number;
  diplomaTier: number;
  completions: CompletionMap;
  profile: { full_name: string; subject: string; start_date: string };
  updateProfile: (p: Partial<{ full_name: string; subject: string; start_date: string }>) => void;
};

export function ProgressBanner({
  totalHours,
  percent,
  diplomaTier,
  completions,
  profile,
  updateProfile,
}: Props) {
  const next = getNextDiploma(totalHours, completions);
  const d1 = getDiploma1Progress(totalHours, completions);
  let hint = '🏆 Programa completo';
  if (next) {
    if (next.tier === 1 && d1.hoursOk && (!d1.extrasL1Ok || !d1.extrasL2Ok)) {
      hint = `Extras L1 ${d1.extrasL1}/4 · L2 ${d1.extrasL2}/4 para Diploma 1`;
    } else if (totalHours < next.hoursRequired) {
      hint = `${(next.hoursRequired - totalHours).toFixed(1)}h restantes para Diploma ${next.tier}`;
    } else {
      hint = `Completa tareas extra para Diploma ${next.tier}`;
    }
  }
  return (
    <>
      <div className="teacher-card no-print">
        <div className="teacher-field">
          <label>Nombre completo</label>
          <input
            value={profile.full_name}
            onChange={(e) => updateProfile({ full_name: e.target.value })}
            placeholder="Tu nombre"
          />
        </div>
        <div className="teacher-field">
          <label>Materia / área</label>
          <input
            value={profile.subject}
            onChange={(e) => updateProfile({ subject: e.target.value })}
            placeholder="p.ej. Biología IB"
          />
        </div>
        <div className="teacher-field">
          <label>Fecha de inicio</label>
          <input
            type="date"
            value={profile.start_date}
            onChange={(e) => updateProfile({ start_date: e.target.value })}
          />
        </div>
        <div className="teacher-field">
          <label>Horas verificadas</label>
          <input readOnly value={`${totalHours}h`} className="opacity-80" />
        </div>
      </div>
      <div className="progress-banner no-print">
        <span className="progress-label">Progreso PD verificado</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="progress-hours">{totalHours}h</span>
        <span className="progress-note">/ 20h mín · diploma</span>
        <span className="progress-note ml-2 italic">{hint}</span>
        {diplomaTier > 0 && (
          <a href="/logros" className="header-badge no-underline ml-2">
            Ver diploma
          </a>
        )}
      </div>
    </>
  );
}
