'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';
import { DiplomaCard } from '@/components/DiplomaCard';
import { DiplomaModal } from '@/components/DiplomaModal';
import { DIPLOMAS, getNextDiploma, type DiplomaTier } from '@/lib/diplomas';

const DIPLOMA_EXPLANATION = [
  'La Ruta de Desarrollo Profesional del Liceo de Monterrey Redwood culmina en el Diploma 3 (Oro): Docente IA Transformadora. Los diplomas de Bronce y Plata reconocen tu progreso a lo largo del camino.',
  'Diploma 1 — Docente IA Consciente (Bronce): completa los Niveles 1 y 2 (20 horas verificadas) + 4 tareas Level Up del Nivel 1 + 4 tareas Level Up del Nivel 2.',
  'Diploma 2 — Docente IA Innovadora (Plata): cumple todo lo del Diploma 1 + alcanza 24 horas verificadas en total.',
  'Diploma 3 — Docente IA Transformadora (Oro): cumple todo lo del Diploma 2 + alcanza 30 horas verificadas + 4 tareas Level Up del Nivel 3 + leer la política de ética + al menos 1 reflexión por nivel + evaluación final completa.',
] as const;

export default function LogrosPage() {
  const { totalHours, completions, profile, diplomaAwardDates, diploma3Program } =
    useProgressContext();
  const [activeTier, setActiveTier] = useState<DiplomaTier | null>(null);
  const next = getNextDiploma(totalHours, completions, diploma3Program);
  const progressPct = Math.min(100, (totalHours / 30) * 100);

  const activeAwardDate =
    activeTier != null ? diplomaAwardDates[activeTier] ?? new Date() : new Date();

  return (
    <div className="app-page no-print">
      <div className="logros-hero logros-hero--dramatic">
        <div className="logros-hero-glow" aria-hidden />
        <div className="level-hero-tag">Tus diplomas · Ruta de Desarrollo Profesional</div>
        <h2>Cada hora cuenta. Cada paso reconoce tu compromiso.</h2>

        <div className="logros-explanation">
          {DIPLOMA_EXPLANATION.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <div className="logros-progress-panel">
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
      </div>

      <div className="logros-grid">
        {DIPLOMAS.map((d) => (
          <DiplomaCard
            key={d.tier}
            diploma={d}
            totalHours={totalHours}
            completions={completions}
            diploma3Program={diploma3Program}
            onOpen={() => setActiveTier(d.tier)}
          />
        ))}
      </div>

      {activeTier != null && (
        <DiplomaModal
          tier={activeTier}
          teacherName={profile.full_name}
          teacherEmail={profile.email}
          awardedDate={activeAwardDate}
          totalHours={totalHours}
          onClose={() => setActiveTier(null)}
        />
      )}
    </div>
  );
}
