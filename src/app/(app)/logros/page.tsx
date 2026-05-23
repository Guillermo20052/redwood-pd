'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';
import { DiplomaCard } from '@/components/DiplomaCard';
import { DiplomaModal } from '@/components/DiplomaModal';
import { DIPLOMAS, getNextDiploma, type Diploma } from '@/lib/diplomas';

const DIPLOMA_EXPLANATION = [
  'Hay 3 diplomas en el programa Redwood PD. Cada uno reconoce un nivel diferente de dominio.',
  'DIPLOMA 1 — DOCENTE IA CONSCIENTE (Bronce): Completa Niveles 1 y 2 (20 horas verificadas) + 4 tareas Level Up del Nivel 1 + 4 tareas Level Up del Nivel 2.',
  'DIPLOMA 2 — DOCENTE IA INNOVADORA (Plata): Diploma 1 completo + 24 horas verificadas en total (los requisitos de Diploma 1 se mantienen).',
  'DIPLOMA 3 — DOCENTE IA TRANSFORMADORA (Oro): Diploma 2 completo + 30 horas verificadas en total + al menos 4 tareas Level Up del Nivel 3 (los requisitos de Diploma 1 y 2 se mantienen).',
] as const;

export default function LogrosPage() {
  const { totalHours, completions, profile } = useProgressContext();
  const [active, setActive] = useState<Diploma | null>(null);
  const next = getNextDiploma(totalHours, completions);
  const progressPct = Math.min(100, (totalHours / 30) * 100);

  return (
    <div className="space-y-10 no-print">
      <div className="logros-hero logros-hero--dramatic">
        <div className="logros-hero-glow" aria-hidden />
        <div className="level-hero-tag">Tus diplomas · Liceo Redwood</div>
        <h2>Cada hora cuenta. Cada paso reconoce tu compromiso.</h2>

        <div className="logros-explanation">
          {DIPLOMA_EXPLANATION.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <p className="logros-hours-summary">
          <strong>{totalHours.toFixed(1)}h</strong> verificadas
          {next ? (
            <>
              {' '}
              · Próximo: <span className="logros-next-name">{next.name}</span>
            </>
          ) : (
            <> · Programa completo</>
          )}
        </p>

        <div className="logros-progress-bar">
          <div className="logros-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="logros-grid">
        {DIPLOMAS.map((d) => (
          <DiplomaCard
            key={d.tier}
            diploma={d}
            totalHours={totalHours}
            completions={completions}
            onOpen={() => setActive(d)}
          />
        ))}
      </div>

      {active && (
        <DiplomaModal
          diploma={active}
          teacherName={profile.full_name}
          teacherSubject={profile.subject}
          awardedDate={new Date()}
          totalHours={totalHours}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
