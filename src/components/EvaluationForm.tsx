'use client';

import { useMemo, useState } from 'react';
import type { EvaluationInput, EvaluationQ12, EvaluationRow } from '@/lib/local-db';
import {
  EVAL_Q9_OPTIONS,
  EVAL_TEXT_MIN_CHARS,
  validateEvaluation,
} from '@/lib/evaluation';

type Props = {
  initial: EvaluationRow | null;
  onSaved: (row: EvaluationRow, grade?: { score: number; feedback: string } | null) => void;
};

type FormState = {
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: string;
  q5: string;
  q6: string;
  q7: number | null;
  q8: number | null;
  q9: string[];
  q10: string;
  q11: string;
  q12: EvaluationQ12 | null;
};

function emptyState(): FormState {
  return {
    q1: null,
    q2: null,
    q3: null,
    q4: '',
    q5: '',
    q6: '',
    q7: null,
    q8: null,
    q9: [],
    q10: '',
    q11: '',
    q12: null,
  };
}

function stateFromRow(row: EvaluationRow): FormState {
  return {
    q1: row.q1_value,
    q2: row.q2_value,
    q3: row.q3_value,
    q4: row.q4_text,
    q5: row.q5_text,
    q6: row.q6_text ?? '',
    q7: row.q7_value,
    q8: row.q8_value,
    q9: [...row.q9_selections],
    q10: row.q10_text,
    q11: row.q11_text ?? '',
    q12: row.q12_value,
  };
}

function toInput(state: FormState): Partial<EvaluationInput> {
  return {
    q1_value: state.q1 ?? undefined,
    q2_value: state.q2 ?? undefined,
    q3_value: state.q3 ?? undefined,
    q4_text: state.q4,
    q5_text: state.q5,
    q6_text: state.q6,
    q7_value: state.q7 ?? undefined,
    q8_value: state.q8 ?? undefined,
    q9_selections: state.q9,
    q10_text: state.q10,
    q11_text: state.q11,
    q12_value: state.q12 ?? undefined,
  } as Partial<EvaluationInput>;
}

const SCALE_LABELS: Record<string, [string, string]> = {
  q1: ['Nada valioso', 'Extremadamente valioso'],
  q2: ['Igual o menos', 'Mucho más preparada'],
  q3: ['Poco probable', 'Totalmente probable'],
  q7: ['Demasiado larga', 'Demasiado corta'],
  q8: ['Demasiado bajo', 'Demasiado alto'],
};

export function EvaluationForm({ initial, onSaved }: Props) {
  const [state, setState] = useState<FormState>(initial ? stateFromRow(initial) : emptyState());
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ score: number; feedback: string } | null>(
    initial?.score != null && initial.score_feedback
      ? { score: initial.score, feedback: initial.score_feedback }
      : null
  );

  const validation = useMemo(() => validateEvaluation(toInput(state)), [state]);
  const isValid = validation.ok;

  const setScale = (key: 'q1' | 'q2' | 'q3' | 'q7' | 'q8', value: number) =>
    setState((s) => ({ ...s, [key]: value }));

  const toggleQ9 = (option: string) =>
    setState((s) => ({
      ...s,
      q9: s.q9.includes(option) ? s.q9.filter((o) => o !== option) : [...s.q9, option],
    }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    setJustSaved(false);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.value),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors as Record<string, string>);
        setServerError(data.error || 'No se pudo guardar la evaluación.');
        return;
      }
      const grade = data.grade as { score: number; feedback: string } | null | undefined;
      if (grade?.score != null) setGradeResult(grade);
      onSaved(data.evaluation as EvaluationRow, grade ?? null);
      setJustSaved(true);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError((err as Error).message || 'Error de red.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {justSaved && gradeResult && (
        <div className="eval-success-card text-sm text-[var(--green)] space-y-2">
          <p>
            ¡Gracias por completar tu evaluación! Recibiste un puntaje de{' '}
            <strong>{gradeResult.score}/100</strong>.
          </p>
          <p className="text-[var(--gray-800)]">{gradeResult.feedback}</p>
        </div>
      )}
      {justSaved && !gradeResult && (
        <div className="eval-success-card text-sm text-[var(--green)]">
          Gracias por tu evaluación. Puedes editarla cuando quieras.
        </div>
      )}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {serverError}
        </div>
      )}

      <FormSection title="1 · Tu experiencia general">
        <ScaleField
          id="q1"
          legend="En general, ¿qué tan valioso te resultó este programa?"
          value={state.q1}
          onChange={(v) => setScale('q1', v)}
          error={fieldErrors.q1_value}
        />
        <ScaleField
          id="q2"
          legend="¿Qué tan AI-ready te sientes ahora, en comparación con antes del programa?"
          value={state.q2}
          onChange={(v) => setScale('q2', v)}
          error={fieldErrors.q2_value}
        />
        <ScaleField
          id="q3"
          legend="¿Qué tan probable es que sigas usando IA en tu práctica docente después de este programa?"
          value={state.q3}
          onChange={(v) => setScale('q3', v)}
          error={fieldErrors.q3_value}
        />
      </FormSection>

      <FormSection title="2 · Por nivel">
        <LongTextField
          id="q4_text"
          label="¿Qué fue lo más útil del Nivel 1 (Fundamentos)?"
          value={state.q4}
          onChange={(v) => setState((s) => ({ ...s, q4: v }))}
          required
          error={fieldErrors.q4_text}
        />
        <LongTextField
          id="q5_text"
          label="¿Qué fue lo más útil del Nivel 2 (Integración)?"
          value={state.q5}
          onChange={(v) => setState((s) => ({ ...s, q5: v }))}
          required
          error={fieldErrors.q5_text}
        />
        <LongTextField
          id="q6_text"
          label="Si completaste el Nivel 3 (Transformación), ¿qué te llevas?"
          value={state.q6}
          onChange={(v) => setState((s) => ({ ...s, q6: v }))}
          required={false}
        />
      </FormSection>

      <FormSection title="3 · Sobre la mecánica">
        <ScaleField
          id="q7"
          legend="La duración (≈30h totales) fue:"
          value={state.q7}
          onChange={(v) => setScale('q7', v)}
          midLabel="Adecuada"
          error={fieldErrors.q7_value}
        />
        <ScaleField
          id="q8"
          legend="El nivel de exigencia de las tareas (calificación 85 mín) fue:"
          value={state.q8}
          onChange={(v) => setScale('q8', v)}
          midLabel="Adecuado"
          error={fieldErrors.q8_value}
        />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--gray-800)]">
            ¿Qué partes funcionaron mejor para ti?{' '}
            <span className="text-xs font-normal text-[var(--gray-500)]">(elige las que apliquen)</span>
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EVAL_Q9_OPTIONS.map((opt) => {
              const checked = state.q9.includes(opt);
              return (
                <label key={opt} className="eval-chip">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleQ9(opt)}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {fieldErrors.q9_selections && (
            <p className="text-xs text-red-600">{fieldErrors.q9_selections}</p>
          )}
        </fieldset>
      </FormSection>

      <FormSection title="4 · Lo que viene">
        <LongTextField
          id="q10_text"
          label="¿Qué planeas implementar concretamente en tu salón en las próximas 4 semanas?"
          value={state.q10}
          onChange={(v) => setState((s) => ({ ...s, q10: v }))}
          required
          error={fieldErrors.q10_text}
        />
        <LongTextField
          id="q11_text"
          label="¿Algo que sugieras mejorar para la próxima edición del programa?"
          value={state.q11}
          onChange={(v) => setState((s) => ({ ...s, q11: v }))}
          required={false}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--gray-800)]">
            ¿Recomendarías este programa a una colega?
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['yes', 'Sí, sin duda'],
                ['yes-with-reservations', 'Sí, con reservas'],
                ['no', 'No'],
              ] as Array<[EvaluationQ12, string]>
            ).map(([value, label]) => {
              const selected = state.q12 === value;
              return (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    selected
                      ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                      : 'border-[var(--gray-300)] bg-white text-[var(--gray-800)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="q12"
                    value={value}
                    className="sr-only"
                    checked={selected}
                    onChange={() => setState((s) => ({ ...s, q12: value }))}
                  />
                  {label}
                </label>
              );
            })}
          </div>
          {fieldErrors.q12_value && (
            <p className="text-xs text-red-600">{fieldErrors.q12_value}</p>
          )}
        </fieldset>
      </FormSection>

      <div className="border-t pt-6">
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="btn-primary eval-submit disabled:opacity-50"
        >
          {submitting ? 'Enviando…' : initial ? 'Guardar cambios' : 'Enviar evaluación'}
        </button>
        {!isValid && (
          <span className="text-xs text-[var(--gray-500)]">
            Completa todas las respuestas marcadas para enviar.
          </span>
        )}
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  const num = title.match(/^(\d+)/)?.[1] ?? '';
  const label = title.replace(/^\d+\s*·\s*/, '');
  return (
    <section className="eval-section-card space-y-5">
      <h2 className="eval-section-title">
        {num && <span className="eval-section-num">{num}</span>}
        {label}
      </h2>
      {children}
    </section>
  );
}

function ScaleField({
  id,
  legend,
  value,
  onChange,
  midLabel,
  error,
}: {
  id: keyof typeof SCALE_LABELS;
  legend: string;
  value: number | null;
  onChange: (v: number) => void;
  midLabel?: string;
  error?: string;
}) {
  const [lo, hi] = SCALE_LABELS[id];
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--gray-800)]">{legend}</legend>
      <div className="eval-scale-row">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <label key={n} className="eval-scale-opt" aria-label={`${legend} — ${n}`}>
              <input
                type="radio"
                name={id}
                value={n}
                checked={selected}
                onChange={() => onChange(n)}
              />
              <span>{n}</span>
            </label>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-[var(--gray-500)]">
        <span>1 · {lo}</span>
        {midLabel && <span>3 · {midLabel}</span>}
        <span>5 · {hi}</span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

function LongTextField({
  id,
  label,
  value,
  onChange,
  required,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
  error?: string;
}) {
  const trimmedLen = value.trim().length;
  const remaining = Math.max(0, EVAL_TEXT_MIN_CHARS - trimmedLen);
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--gray-800)]">
        {label}{' '}
        <span className="text-xs font-normal text-[var(--gray-500)]">
          {required ? `(mín. ${EVAL_TEXT_MIN_CHARS} caracteres)` : '(opcional)'}
        </span>
      </span>
      <textarea
        id={id}
        className="rw-textarea min-h-[100px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="char-counter flex justify-between">
        <span>{trimmedLen} caracteres{required ? ' · mín 80' : ''}</span>
        {required && remaining > 0 && <span className="warn">Faltan {remaining}</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </label>
  );
}
