'use client';

import { useEffect, useState } from 'react';
import { EvaluationForm } from '@/components/EvaluationForm';
import type { EvaluationRow } from '@/lib/local-db';

export default function EvaluacionPage() {
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<EvaluationRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [grade, setGrade] = useState<{ score: number; feedback: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/evaluations');
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { evaluation: EvaluationRow | null };
          setExisting(data.evaluation);
          const ev = data.evaluation;
          if (ev?.score != null && ev.score_feedback) {
            setGrade({ score: ev.score, feedback: ev.score_feedback });
          }
        }
      } catch {
        /* show empty form */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showForm = !existing || editing;

  return (
    <div className="space-y-6">
      <div className="level-hero lh-eval">
        <div className="level-hero-tag">Cierre del programa</div>
        <h2>Tu voz construye la próxima edición</h2>
        <p>
          Tu retroalimentación honesta nos ayuda a diseñar una ruta aún más útil para las
          docentes que vienen después. Puedes editar tus respuestas cuando quieras.
        </p>
      </div>

      {!loaded && <p className="text-sm text-[var(--gray-500)]">Cargando…</p>}

      {loaded && existing && !editing && (
        <div className="eval-success-card space-y-3 text-left">
          {grade && (
            <p className="text-sm text-[var(--green)]">
              ¡Gracias por completar tu evaluación! Recibiste un puntaje de{' '}
              <strong>{grade.score}/100</strong>. {grade.feedback}
            </p>
          )}
          {!grade && (
            <p className="text-sm text-[var(--green)]">
              Gracias por tu evaluación. Puedes editarla cuando quieras.
            </p>
          )}
          <p className="text-xs text-[var(--gray-600)]">
            Enviada el <strong>{formatDate(existing.submitted_at)}</strong>
          </p>
          <button type="button" onClick={() => setEditing(true)} className="btn-outline">
            Editar respuestas
          </button>
        </div>
      )}

      {loaded && showForm && (
        <EvaluationForm
          initial={existing}
          onSaved={(row, g) => {
            setExisting(row);
            if (g) setGrade(g);
            else if (row.score != null && row.score_feedback) {
              setGrade({ score: row.score, feedback: row.score_feedback });
            }
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
