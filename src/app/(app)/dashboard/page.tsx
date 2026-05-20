'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { levels, tools, metaConfig } from '@/lib/content';
import { useProgressContext } from '@/components/Providers';
import { getLevelHours } from '@/lib/progress';
import type { EvaluationRow } from '@/lib/local-db';

const EVAL_UNLOCK_HOURS = 20;

const WARM_INTRO =
  'En Redwood High creemos que una maestra que nunca deja de aprender es la maestra que sus alumnas nunca olvidan. Este programa no es una lista de tareas por completar — es una invitación a mantenerte vigente, curiosa y conectada con lo que más importa.';

export default function DashboardPage() {
  const { totalHours, percent, completions } = useProgressContext();
  const [evaluation, setEvaluation] = useState<EvaluationRow | null>(null);
  const [evalLoaded, setEvalLoaded] = useState(false);

  useEffect(() => {
    if (totalHours < EVAL_UNLOCK_HOURS) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/evaluations');
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { evaluation: EvaluationRow | null };
          setEvaluation(data.evaluation);
        }
      } catch {
        /* CTA still renders */
      } finally {
        if (!cancelled) setEvalLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totalHours]);

  const showEvalCta = totalHours >= EVAL_UNLOCK_HOURS;

  return (
    <div className="space-y-8">
      <div className="level-hero lh-dash">
        <div className="level-hero-tag">
          Liceo Redwood · Monterrey · Ruta de Desarrollo Profesional
        </div>
        <h2>Siempre mejores. Siempre más conectadas.</h2>
        <p>{WARM_INTRO}</p>
        <div className="hero-stat-row">
          <div className="hero-stat-box">
            <div className="hs-num">3</div>
            <div className="hs-lbl">Niveles · A tu ritmo</div>
          </div>
          <div className="hero-stat-box">
            <div className="hs-num">30h</div>
            <div className="hs-lbl">acreditables</div>
          </div>
          <div className="hero-stat-box">
            <div className="hs-num">Tu ritmo</div>
            <div className="hs-lbl">sin fechas límite</div>
          </div>
          <div className="hero-stat-box">
            <div className="hs-num">IB + IA</div>
            <div className="hs-lbl">alineación curricular</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/80">
          <strong>{totalHours.toFixed(1)}h</strong> verificadas ·{' '}
          <strong>{percent.toFixed(0)}%</strong> hacia el diploma (
          {metaConfig.totalGoalHours}h mín.)
        </p>
      </div>

      {showEvalCta && (
        <EvaluationCta evaluation={evalLoaded ? evaluation : null} loaded={evalLoaded} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {levels.map((lvl) => {
          const hrs = getLevelHours(completions, lvl.slug as 'b' | 'i' | 'a');
          return (
            <Link
              key={lvl.slug}
              href={`/nivel/${lvl.slug}`}
              className="tool-crd no-underline block text-left hover:border-[var(--red)] hover:shadow-md transition"
              style={{ borderTop: `4px solid ${lvl.color}` }}
            >
              <h3 className="font-condensed font-bold text-lg">{lvl.name}</h3>
              <p className="text-xs text-[var(--gray-500)] mt-1">{lvl.tagline}</p>
              <p className="text-sm font-semibold mt-3" style={{ color: lvl.color }}>
                {hrs}h completadas
              </p>
            </Link>
          );
        })}
      </div>

      <section>
        <div className="sec-hdr">
          <h2 className="sec-title">Herramientas IA · 2025–2026</h2>
        </div>
        <div className="tools-grid">
          {tools.map((t) => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-crd no-underline"
            >
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-name">{t.name}</div>
              <div className="tool-desc">{t.desc}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function EvaluationCta({
  evaluation,
  loaded,
}: {
  evaluation: EvaluationRow | null;
  loaded: boolean;
}) {
  const submitted = Boolean(evaluation);
  return (
    <Link
      href="/evaluacion"
      className={`block rounded-xl border p-5 transition no-underline ${
        submitted
          ? 'border-[var(--green)] bg-[var(--green-light)]'
          : 'border-[var(--teal)] bg-[var(--teal-light)]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)]">
            {submitted ? 'Evaluación final' : 'Evaluación final desbloqueada'}
          </p>
          <h3 className="font-condensed text-lg font-extrabold text-[var(--gray-900)]">
            {submitted
              ? '✓ Tu voz ya está en la próxima edición'
              : '🎯 Comparte tu experiencia'}
          </h3>
          <p className="mt-1 text-sm text-[var(--gray-700)]">
            {submitted
              ? 'Gracias por tu retroalimentación. Puedes editarla cuando quieras.'
              : 'Has alcanzado las 20h del programa. Tu retroalimentación nos ayuda a mejorar.'}
          </p>
        </div>
        <span className="btn-primary text-[11px]">
          {loaded && submitted ? 'Editar evaluación' : 'Llenar evaluación final'}
        </span>
      </div>
    </Link>
  );
}
