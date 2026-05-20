'use client';

import { useState } from 'react';
import { getSessionsByLevel } from '@/lib/content';

type Props = { level: string };

export function SessionsSection({ level }: Props) {
  const sessions = getSessionsByLevel(level);
  const [weekIdx, setWeekIdx] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!sessions?.weeks?.length) {
    return (
      <div className="sec-content active">
        <p className="text-sm text-[var(--gray-600)]">
          Plan de sesiones no disponible. Usa la lista de verificación para avanzar.
        </p>
      </div>
    );
  }

  const week = sessions.weeks[weekIdx];

  return (
    <div className="sec-content active">
      <div className="sec-hdr">
        <h2 className="sec-title">Plan de Sesiones</h2>
      </div>
      <div className="week-tabs">
        {sessions.weeks.map((w, i) => (
          <button
            key={w.id}
            type="button"
            className={`wtab ${i === weekIdx ? 'active' : ''}`}
            onClick={() => {
              setWeekIdx(i);
              setExpanded(null);
            }}
          >
            {w.label}
          </button>
        ))}
      </div>
      {week.title && (
        <div className="mb-3">
          <div style={{ fontSize: 13, fontWeight: 700 }}>{week.title}</div>
          {week.objective && (
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{week.objective}</div>
          )}
        </div>
      )}
      <div className="days-grid">
        {week.days.map((day, i) => (
          <div
            key={i}
            className={`day-card ${expanded === i ? 'expanded' : ''}`}
            onClick={() => setExpanded(expanded === i ? null : i)}
            onKeyDown={(e) => e.key === 'Enter' && setExpanded(expanded === i ? null : i)}
            role="button"
            tabIndex={0}
          >
            <div className="day-hdr">
              <span className="day-name">{day.name}</span>
              <span className="day-exp">{expanded === i ? '−' : '+'}</span>
            </div>
            <div className="day-theme">{day.theme}</div>
            <div className="day-detail">
              {day.objective && (
                <div className="db">
                  <div className="db-lbl">Objetivo del día</div>
                  <div className="task-txt">{day.objective}</div>
                </div>
              )}
              {day.practiceTask && (
                <div className="task-box">
                  <div className="task-lbl">Tarea de práctica</div>
                  <div className="task-txt">{day.practiceTask}</div>
                </div>
              )}
              {day.transferTask && (
                <div className="task-box trf">
                  <div className="task-lbl">Transferencia al aula</div>
                  <div className="task-txt">{day.transferTask}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
