'use client';

import { getNextDiploma } from '@/lib/diplomas';

type Props = {
  totalHours: number;
  percent: number;
  diplomaTier: number;
  profile: { full_name: string; subject: string; start_date: string };
  updateProfile: (p: Partial<{ full_name: string; subject: string; start_date: string }>) => void;
};

export function ProgressBanner({ totalHours, percent, diplomaTier, profile, updateProfile }: Props) {
  const next = getNextDiploma(totalHours);
  const hint = next
    ? `${(next.hoursRequired - totalHours).toFixed(1)}h restantes para Diploma ${next.tier}`
    : '🏆 Programa completo';
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
