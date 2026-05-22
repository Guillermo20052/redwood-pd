'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { levels, tools, metaConfig } from '@/lib/content';
import { useProgressContext } from '@/components/Providers';
import {
  getLevelHours,
  getLevelProgressPercent,
  getNextDiploma,
  isLevelUnlocked,
} from '@/lib/progress';
import type { EvaluationRow } from '@/lib/local-db';

const EVAL_UNLOCK_HOURS = 20;
const LEVEL_TARGET_HOURS = 10;
const PROGRAM_MAX_HOURS = metaConfig.programMaxHours ?? 30;

const WARM_INTRO_PRIMARY =
  'En Redwood High creemos que una maestra que nunca deja de aprender es la maestra que sus alumnas nunca olvidan. Este programa no es una lista de tareas por completar — es una invitación a mantenerte vigente, curiosa y conectada con lo que más importa: encontrar mejores formas de llegar a cada alumna, liberar tiempo para lo que le da alma a nuestra comunidad y fortalecer la esencia que nos hace ser quienes somos.';

const WARM_INTRO_SECONDARY =
  'Cada herramienta que explores y cada reflexión que registres aquí son semillas para tu práctica futura — no para mañana, sino para la docente que seguirás eligiendo ser. Avanza a tu ritmo, vuelve cuando lo necesites, y confía en que cada pequeño avance te acerca a tener más tiempo, más energía y más presencia para lo que ninguna herramienta puede reemplazar: conocer, guiar y acompañar a cada alumna.';

const LEVEL_ICONS: Record<string, string> = { b: '🌱', i: '🌳', a: '🌲' };

const LEVEL_BG: Record<string, string> = {
  b: 'rgba(26,46,74,0.06)',
  i: 'rgba(26,122,110,0.06)',
  a: 'rgba(178,34,52,0.06)',
};

type LevelSlug = 'b' | 'i' | 'a';

function ProgressRing({ percent, size = 180 }: { percent: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, percent) / 100) * circumference;
  const cx = size / 2;

  return (
    <svg width={size} height={size} aria-hidden className="block">
      <circle
        cx={cx}
        cy={cx}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cx}
        r={radius}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 0.65s ease' }}
      />
    </svg>
  );
}

function levelDotStatus(
  slug: LevelSlug,
  completions: ReturnType<typeof useProgressContext>['completions'],
  isAdmin: boolean
): 'complete' | 'active' | 'locked' {
  const hours = getLevelHours(completions, slug);
  if (hours >= LEVEL_TARGET_HOURS) return 'complete';
  if (slug === 'b' || isAdmin) return hours > 0 ? 'active' : 'active';
  if (!isLevelUnlocked(completions, slug)) return 'locked';
  return hours > 0 ? 'active' : 'active';
}

function DashboardHeroProgress({
  totalHours,
  percent,
  completions,
  isAdmin,
}: {
  totalHours: number;
  percent: number;
  completions: ReturnType<typeof useProgressContext>['completions'];
  isAdmin: boolean;
}) {
  const nextDiploma = getNextDiploma(totalHours, completions);
  const hoursRemaining = nextDiploma
    ? Math.max(0, nextDiploma.hoursRequired - totalHours)
    : 0;
  const ringPct = Math.min(100, (totalHours / PROGRAM_MAX_HOURS) * 100);

  const levelLabels: { slug: LevelSlug; label: string }[] = [
    { slug: 'b', label: 'L1' },
    { slug: 'i', label: 'L2' },
    { slug: 'a', label: 'L3' },
  ];

  return (
    <div
      className="w-full max-w-[320px] rounded-xl px-5 py-5 text-center"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="relative mx-auto mb-3" style={{ width: 180, height: 180 }}>
        <ProgressRing percent={ringPct} />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ padding: 24 }}
        >
          <span
            className="font-condensed font-extrabold leading-none text-white"
            style={{ fontSize: 36 }}
          >
            {totalHours.toFixed(1)}
          </span>
          <span className="text-[11px] text-white/65 mt-1">de {PROGRAM_MAX_HOURS}h</span>
        </div>
      </div>

      {nextDiploma ? (
        <div className="mb-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Tu próximo diploma
          </p>
          <p className="font-condensed text-base font-extrabold text-[var(--gold)] mt-0.5">
            {nextDiploma.name}
          </p>
          <p className="text-xs text-white/75 mt-0.5">
            Faltan <strong>{hoursRemaining.toFixed(1)}h</strong> verificadas
          </p>
        </div>
      ) : (
        <p className="mb-4 text-sm font-semibold text-[var(--gold)]">
          ¡Todos los diplomas alcanzados!
        </p>
      )}

      <div className="text-left">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
          Niveles activos
        </p>
        <div className="flex items-center gap-4">
          {levelLabels.map(({ slug, label }) => {
            const status = levelDotStatus(slug, completions, isAdmin);
            const fill =
              status === 'complete'
                ? 'var(--teal)'
                : status === 'active'
                  ? 'var(--gold)'
                  : 'rgba(255,255,255,0.2)';
            const border =
              status === 'locked' ? '1px dashed rgba(255,255,255,0.35)' : 'none';
            return (
              <div key={slug} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ background: fill, border }}
                  title={
                    status === 'complete'
                      ? `${label} completado`
                      : status === 'locked'
                        ? `${label} bloqueado`
                        : `${label} en progreso`
                  }
                />
                <span className="text-[11px] font-semibold text-white/80">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-white/55">
        {percent.toFixed(0)}% hacia diploma mínimo ({metaConfig.totalGoalHours}h)
      </p>
    </div>
  );
}

function LevelDashboardCard({
  slug,
  name,
  tagline,
  color,
  hours,
  pct,
  unlocked,
  unlockMsg,
  optional,
}: {
  slug: LevelSlug;
  name: string;
  tagline: string;
  color: string;
  hours: number;
  pct: number;
  unlocked: boolean;
  unlockMsg: string;
  optional?: boolean;
}) {
  const icon = LEVEL_ICONS[slug] ?? '📚';
  const bg = LEVEL_BG[slug] ?? 'rgba(0,0,0,0.03)';

  return (
    <Link
      href={`/nivel/${slug}`}
      className={`dash-level-card relative flex gap-3 rounded-xl border p-4 no-underline transition-all duration-150 ${
        unlocked ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : 'opacity-75'
      }`}
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, #fff 70%)`,
        borderColor: 'var(--gray-200)',
        borderTopWidth: 4,
        borderTopColor: color,
      }}
      onMouseEnter={(e) => {
        if (unlocked) e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gray-200)';
      }}
    >
      {!unlocked ? (
        <span
          className="absolute top-3 right-3 text-sm opacity-50"
          aria-label="Nivel bloqueado"
          title="Nivel bloqueado"
        >
          🔒
        </span>
      ) : null}

      <span className="text-3xl shrink-0 leading-none" aria-hidden>
        {icon}
      </span>

      <div className="min-w-0 flex-1 pr-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-condensed text-lg font-extrabold text-[var(--gray-900)] m-0">
            {name}
          </h3>
          {optional ? (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: 'var(--gold-light)', color: 'var(--gold)' }}
            >
              Opcional
            </span>
          ) : null}
        </div>
        <p className="text-xs text-[var(--gray-600)] mt-1 leading-snug">{tagline}</p>

        {unlocked ? (
          <div className="mt-3">
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: 'var(--gray-200)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <p className="text-[11px] font-semibold mt-1.5" style={{ color }}>
              {hours.toFixed(1)}h / {LEVEL_TARGET_HOURS}h
            </p>
          </div>
        ) : (
          <p className="text-[11px] font-semibold mt-3 text-[var(--gray-500)]">{unlockMsg}</p>
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { totalHours, percent, completions, profile } = useProgressContext();
  const isAdmin = profile.role === 'admin';
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
      <div className="level-hero lh-dash flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1" style={{ maxWidth: '100%' }}>
          <div className="level-hero-tag">
            Liceo Redwood · Monterrey · Ruta de Desarrollo Profesional
          </div>
          <h2>Siempre mejores. Siempre más conectadas.</h2>
          <p className="mb-3">{WARM_INTRO_PRIMARY}</p>
          <p>{WARM_INTRO_SECONDARY}</p>
          <div className="hero-stat-row">
            <div className="hero-stat-box">
              <div className="hs-num">3</div>
              <div className="hs-lbl">Niveles progresivos</div>
            </div>
            <div className="hero-stat-box">
              <div className="hs-num">30h</div>
              <div className="hs-lbl">Horas acreditables</div>
            </div>
            <div className="hero-stat-box">
              <div className="hs-num">Tu ritmo</div>
              <div className="hs-lbl">Sin tiempos impuestos</div>
            </div>
            <div className="hero-stat-box">
              <div className="hs-num">IB + IA</div>
              <div className="hs-lbl">Alineado a tu práctica real</div>
            </div>
          </div>
        </div>

        <DashboardHeroProgress
          totalHours={totalHours}
          percent={percent}
          completions={completions}
          isAdmin={isAdmin}
        />
      </div>

      {showEvalCta && (
        <EvaluationCta evaluation={evalLoaded ? evaluation : null} loaded={evalLoaded} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {levels.map((lvl) => {
          const slug = lvl.slug as LevelSlug;
          const hrs = getLevelHours(completions, slug);
          const pct = getLevelProgressPercent(completions, slug, LEVEL_TARGET_HOURS);
          const unlocked =
            isAdmin || slug === 'b' || isLevelUnlocked(completions, slug, isAdmin);
          const bH = getLevelHours(completions, 'b');
          const iH = getLevelHours(completions, 'i');

          let unlockMsg = '';
          if (!unlocked) {
            if (slug === 'i') {
              const need = Math.max(0, metaConfig.levelLocks.unlockLevel2Hours - bH);
              unlockMsg = `Desbloquea con ${need.toFixed(1)}h más en Nivel 1`;
            } else {
              const need = Math.max(0, metaConfig.levelLocks.unlockLevel3Hours - (bH + iH));
              unlockMsg = `Desbloquea con ${need.toFixed(1)}h más en Niveles 1 y 2`;
            }
          }

          return (
            <LevelDashboardCard
              key={lvl.slug}
              slug={slug}
              name={lvl.name}
              tagline={lvl.tagline}
              color={lvl.color}
              hours={hrs}
              pct={pct}
              unlocked={unlocked}
              unlockMsg={unlockMsg}
              optional={slug === 'a'}
            />
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
