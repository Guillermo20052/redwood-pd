'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';
import { DiplomaCard } from '@/components/DiplomaCard';
import { DiplomaModal } from '@/components/DiplomaModal';
import { DIPLOMAS, type Diploma } from '@/lib/diplomas';
import { getNextDiploma } from '@/lib/progress';

export default function LogrosPage() {
  const { totalHours, profile } = useProgressContext();
  const [active, setActive] = useState<Diploma | null>(null);
  const next = getNextDiploma(totalHours);
  const progressPct = Math.min(100, (totalHours / 30) * 100);

  return (
    <div className="space-y-8 no-print">
      <div className="logros-hero">
        <div className="level-hero-tag">Tus diplomas · Liceo Redwood</div>
        <h2>Cada hora cuenta. Cada paso reconoce tu compromiso.</h2>
        <p>
          Tres niveles de reconocimiento conforme acumulas horas verificadas en la ruta.
          Cada diploma certifica tu crecimiento con IA en el aula IB.
        </p>
        <p className="mt-3 text-sm text-white/85">
          <strong>{totalHours.toFixed(1)}h</strong> verificadas
          {next ? (
            <>
              {' '}
              · faltan <strong>{(next.hoursRequired - totalHours).toFixed(1)}h</strong> para el
              Diploma {next.tier}
            </>
          ) : (
            <> · 🏆 Programa completo</>
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
