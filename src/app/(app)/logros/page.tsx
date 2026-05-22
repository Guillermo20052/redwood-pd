'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';
import { DiplomaCard } from '@/components/DiplomaCard';
import { DiplomaModal } from '@/components/DiplomaModal';
import { DIPLOMAS, getNextDiploma, type Diploma } from '@/lib/diplomas';
import {
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  getDiploma1Progress,
} from '@/lib/extras-gating';

export default function LogrosPage() {
  const { totalHours, completions, profile } = useProgressContext();
  const [active, setActive] = useState<Diploma | null>(null);
  const next = getNextDiploma(totalHours, completions);
  const d1 = getDiploma1Progress(totalHours, completions);
  const progressPct = Math.min(100, (totalHours / 30) * 100);

  return (
    <div className="space-y-8 no-print">
      <div className="logros-hero">
        <div className="level-hero-tag">Tus diplomas · Liceo Redwood</div>
        <h2>Cada hora cuenta. Cada paso reconoce tu compromiso.</h2>
        <p>
          Tres niveles de reconocimiento conforme acumulas horas verificadas en la ruta obligatoria,
          más tareas extra para el Diploma 1.
        </p>
        <p className="mt-3 text-sm text-white/85">
          <strong>{totalHours.toFixed(1)}h</strong> verificadas (ruta obligatoria)
          {next ? (
            <>
              {' '}
              · próximo: Diploma {next.tier}
            </>
          ) : (
            <> · 🏆 Programa completo</>
          )}
        </p>
        <div
          className="mt-3 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <p className="font-semibold mb-1">Diploma 1 — requisitos</p>
          <p>
            {d1.hoursOk ? '20h ✓' : `${totalHours.toFixed(1)}h / 20h`} · Extras L1:{' '}
            {d1.extrasL1}/{DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL}
            {d1.extrasL1Ok ? ' ✓' : ''} · Extras L2: {d1.extrasL2}/{DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL}
            {d1.extrasL2Ok ? ' ✓' : ` — faltan ${Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - d1.extrasL2)} extras del Nivel 2`}
          </p>
        </div>
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
