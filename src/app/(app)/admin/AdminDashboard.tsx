'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { EvaluationRow } from '@/lib/local-db';
import { Q12_LABEL } from '@/lib/evaluation';

type PairingSummary = {
  partId: string;
  partTitle: string;
  partnerName: string;
};

type CohortRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  subject: string | null;
  role: 'teacher' | 'admin';
  totalHours: number;
  level: string;
  lastActivity: string | null;
  earnedDiplomas: number[];
  pairings?: PairingSummary[];
};

type EvaluationWithProfile = EvaluationRow & {
  full_name: string | null;
  email: string | null;
  subject: string | null;
};

const LEVEL_LABEL: Record<string, string> = { b: 'Básico', i: 'Intermedio', a: 'Avanzado' };

export function AdminDashboard() {
  const [cohort, setCohort] = useState<CohortRow[]>([]);
  const [error, setError] = useState('');
  const [evaluations, setEvaluations] = useState<EvaluationWithProfile[]>([]);
  const [evalError, setEvalError] = useState('');
  const [openEvals, setOpenEvals] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [openPairings, setOpenPairings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/admin/cohort')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setCohort(d.cohort || []);
      })
      .catch(() => setError('No se pudo cargar el cohorte'));

    fetch('/api/admin/evaluations')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setEvalError(d.error);
        else setEvaluations(d.evaluations || []);
      })
      .catch(() => setEvalError('No se pudo cargar las evaluaciones'));
  }, []);

  const summary = useMemo(() => buildEvaluationSummary(evaluations), [evaluations]);

  return (
    <div className="space-y-8">
      <div className="level-hero lh-b">
        <div className="level-hero-tag">Coordinación · Liceo de Monterrey Redwood</div>
        <h2>Panel de coordinación</h2>
        <p>Vista de cohorte, parejas colaborativas y evaluaciones finales del programa.</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4">
        <a
          href="/api/admin/export"
          className="rounded-lg bg-[var(--navy)] text-white px-4 py-2 text-sm font-bold"
        >
          ⬇ Exportar CSV
        </a>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          {error}.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--gray-100)] text-left">
            <tr>
              <th className="p-3 font-bold">Docente</th>
              <th className="p-3 font-bold">Materia</th>
              <th className="p-3 font-bold">Horas</th>
              <th className="p-3 font-bold">Nivel actual</th>
              <th className="p-3 font-bold">Diplomas</th>
              <th className="p-3 font-bold">Colaboraciones</th>
              <th className="p-3 font-bold">Última actividad</th>
              <th className="p-3 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {cohort.map((t) => {
              const pairings = t.pairings ?? [];
              const pairingsOpen = !!openPairings[t.user_id];
              return (
                <tr key={t.user_id} className="border-t align-top">
                  <td className="p-3">
                    <div className="font-semibold">{t.full_name || '—'}</div>
                    <div className="text-xs text-[var(--gray-500)]">{t.email}</div>
                  </td>
                  <td className="p-3">{t.subject || '—'}</td>
                  <td className="p-3 font-bold text-[var(--red)]">{t.totalHours}h</td>
                  <td className="p-3">{LEVEL_LABEL[t.level] ?? t.level}</td>
                  <td className="p-3">
                    {t.earnedDiplomas.length > 0
                      ? t.earnedDiplomas.map((d) => `D${d}`).join(' · ')
                      : '—'}
                  </td>
                  <td className="p-3">
                    {pairings.length === 0 ? (
                      <span className="text-xs text-[var(--gray-500)]">—</span>
                    ) : (
                      <div>
                        <button
                          type="button"
                          className="rounded-md border border-[var(--gray-300)] bg-white px-2 py-1 text-xs font-semibold hover:bg-[var(--gray-50)]"
                          onClick={() =>
                            setOpenPairings((p) => ({
                              ...p,
                              [t.user_id]: !p[t.user_id],
                            }))
                          }
                          aria-expanded={pairingsOpen}
                        >
                          {pairings.length} {pairings.length === 1 ? 'pareja' : 'parejas'}{' '}
                          {pairingsOpen ? '▲' : '▼'}
                        </button>
                        {pairingsOpen && (
                          <ul className="mt-2 space-y-1 text-xs text-[var(--gray-700)]">
                            {pairings.map((p) => (
                              <li
                                key={p.partId}
                                className="rounded-md border border-[var(--gray-200)] bg-[var(--gray-50)] px-2 py-1"
                              >
                                <span className="font-semibold">{p.partTitle}:</span>{' '}
                                {p.partnerName}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs text-[var(--gray-500)]">
                    {t.lastActivity ? new Date(t.lastActivity).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/teacher/${t.user_id}`}
                      className="rounded-md border border-[var(--gray-300)] bg-white px-2 py-1 text-xs font-semibold hover:bg-[var(--gray-50)] whitespace-nowrap"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {cohort.length === 0 && !error && (
          <p className="p-8 text-center text-[var(--gray-500)]">Sin docentes registrados aún.</p>
        )}
      </div>

      <section className="rounded-xl border bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          onClick={() => setOpenEvals((v) => !v)}
          aria-expanded={openEvals}
        >
          <h2 className="font-condensed text-xl font-extrabold">
            Evaluaciones recibidas ({evaluations.length})
          </h2>
          <span className="text-sm text-[var(--gray-500)]">{openEvals ? '▲' : '▼'}</span>
        </button>

        {openEvals && (
          <div className="space-y-5 border-t p-5">
            {evalError && (
              <p className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
                {evalError}
              </p>
            )}

            {!evalError && evaluations.length === 0 && (
              <p className="text-sm text-[var(--gray-500)]">
                Aún no hay evaluaciones enviadas.
              </p>
            )}

            {evaluations.length > 0 && <SummaryPanel summary={summary} />}

            {evaluations.map((e) => {
              const open = !!expanded[e.user_id];
              return (
                <article
                  key={e.user_id}
                  className="rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)]"
                >
                  <header className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-condensed text-base font-bold">
                        {e.full_name || e.email || e.user_id}
                      </p>
                      <p className="text-xs text-[var(--gray-500)]">
                        {e.subject || 'Sin materia'} ·{' '}
                        Enviada {formatDate(e.submitted_at)}
                        {e.updated_at && e.updated_at !== e.submitted_at && (
                          <> · Editada {formatDate(e.updated_at)}</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Pill>Valor {e.q1_value}/5</Pill>
                      <Pill>AI-ready {e.q2_value}/5</Pill>
                      <Pill>Continuará {e.q3_value}/5</Pill>
                      <Pill>Recomienda: {Q12_LABEL[e.q12_value]}</Pill>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((p) => ({ ...p, [e.user_id]: !p[e.user_id] }))
                        }
                        className="rounded-md border border-[var(--gray-300)] bg-white px-3 py-1 text-xs font-semibold"
                      >
                        {open ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>
                    </div>
                  </header>

                  {open && <EvaluationDetail row={e} />}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EvaluationDetail({ row }: { row: EvaluationWithProfile }) {
  return (
    <div className="grid gap-4 border-t border-[var(--gray-200)] p-4 text-sm md:grid-cols-2">
      <Field label="Q1 · Valor del programa">{row.q1_value}/5</Field>
      <Field label="Q2 · AI-ready vs. antes">{row.q2_value}/5</Field>
      <Field label="Q3 · Seguirá usando IA">{row.q3_value}/5</Field>
      <Field label="Q7 · Duración (1=larga, 3=adecuada, 5=corta)">{row.q7_value}/5</Field>
      <Field label="Q8 · Calificación general del programa">{row.q8_value}%</Field>
      <Field label="Q12 · Recomendaría">{Q12_LABEL[row.q12_value]}</Field>

      <TextField label="Q4 · Lo más útil del Nivel 1">{row.q4_text}</TextField>
      <TextField label="Q5 · Lo más útil del Nivel 2">{row.q5_text}</TextField>
      <TextField label="Q6 · Nivel 3 (opcional)">{row.q6_text || '—'}</TextField>
      <TextField label="Q10 · Plan de implementación (4 semanas)">{row.q10_text}</TextField>
      <TextField label="Q11 · Sugerencias (opcional)">{row.q11_text || '—'}</TextField>
      <TextField label="Q9 · Partes que funcionaron">
        {row.q9_selections.length > 0 ? row.q9_selections.join(', ') : '—'}
      </TextField>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--gray-500)]">{label}</p>
      <p className="font-semibold text-[var(--gray-800)]">{children}</p>
    </div>
  );
}

function TextField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="md:col-span-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--gray-500)]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap rounded-lg border border-[var(--gray-200)] bg-white p-3 text-sm text-[var(--gray-800)]">
        {children}
      </p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[var(--gray-700)] ring-1 ring-[var(--gray-200)]">
      {children}
    </span>
  );
}

type EvaluationSummary = {
  count: number;
  averages: {
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q7: number | null;
    q8: number | null;
  };
  q12: { yes: number; reservations: number; no: number };
};

function buildEvaluationSummary(rows: EvaluationWithProfile[]): EvaluationSummary {
  const avg = (key: keyof EvaluationRow) => {
    const nums = rows
      .map((r) => r[key])
      .filter((v): v is number => typeof v === 'number');
    if (nums.length === 0) return null;
    return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
  };
  return {
    count: rows.length,
    averages: {
      q1: avg('q1_value'),
      q2: avg('q2_value'),
      q3: avg('q3_value'),
      q7: avg('q7_value'),
      q8: avg('q8_value'),
    },
    q12: {
      yes: rows.filter((r) => r.q12_value === 'yes').length,
      reservations: rows.filter((r) => r.q12_value === 'yes-with-reservations').length,
      no: rows.filter((r) => r.q12_value === 'no').length,
    },
  };
}

function SummaryPanel({ summary }: { summary: EvaluationSummary }) {
  const fmt = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}/5`);
  const fmtQ8 = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`);
  return (
    <div className="rounded-xl border border-[var(--navy)]/20 bg-[var(--navy)]/5 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--navy)]">
        Resumen · {summary.count} {summary.count === 1 ? 'respuesta' : 'respuestas'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        <Stat label="Valor (Q1)" value={fmt(summary.averages.q1)} />
        <Stat label="AI-ready (Q2)" value={fmt(summary.averages.q2)} />
        <Stat label="Continuará (Q3)" value={fmt(summary.averages.q3)} />
        <Stat label="Duración (Q7)" value={fmt(summary.averages.q7)} />
        <Stat label="Calificación (Q8)" value={fmtQ8(summary.averages.q8)} />
      </div>
      <div className="mt-3 text-xs text-[var(--gray-700)]">
        Recomendarían: <strong>{summary.q12.yes}</strong> sí ·{' '}
        <strong>{summary.q12.reservations}</strong> sí con reservas ·{' '}
        <strong>{summary.q12.no}</strong> no
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--gray-500)]">
        {label}
      </p>
      <p className="font-condensed text-xl font-extrabold text-[var(--navy)]">{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
