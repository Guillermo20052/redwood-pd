'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { levels, metaConfig } from '@/lib/content';
import { useProgressContext } from '@/components/Providers';
import { PersonalizedHero } from '@/components/PersonalizedHero';
import { CaminoVisualization } from '@/components/CaminoVisualization';
import { DiplomaModal } from '@/components/DiplomaModal';
import { TourTrigger } from '@/components/TourTrigger';
import type { DiplomaTier } from '@/lib/diplomas';
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
  'En el Liceo de Monterrey Redwood creemos que una maestra que nunca deja de aprender es la maestra que sus alumnas nunca olvidan. Este programa no es una lista de tareas por completar — es una invitación a mantenerte vigente, curiosa y conectada con lo que más importa.';

const WARM_INTRO_SECONDARY =
  'Cada herramienta que explores y cada reflexión que registres aquí son semillas para tu práctica futura. Avanza a tu ritmo, vuelve cuando lo necesites, y confía en que cada pequeño avance te acerca a tener más tiempo, más energía y más presencia para lo que ninguna herramienta puede reemplazar.';

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
  completions,
  isAdmin,
}: {
  totalHours: number;
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
    <div className="dash-hero-panel">
      <div className="relative mx-auto mb-3" style={{ width: 180, height: 180 }}>
        <ProgressRing percent={ringPct} />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ padding: 24 }}
        >
          <span className="dash-hero-hours font-condensed font-extrabold leading-none">
            {totalHours.toFixed(1)}
          </span>
          <span className="dash-hero-ring-sub text-[11px] mt-1">de {PROGRAM_MAX_HOURS}h</span>
        </div>
      </div>

      {nextDiploma ? (
        <div className="mb-4 text-left">
          <p className="dash-hero-eyebrow">Tu próximo diploma</p>
          <p className="dash-hero-diploma-name font-condensed text-base font-extrabold mt-0.5">
            {nextDiploma.name}
          </p>
          <p className="dash-hero-body mt-0.5">
            Faltan <strong>{hoursRemaining.toFixed(1)}h</strong> verificadas
          </p>
        </div>
      ) : (
        <p className="mb-4 text-sm font-semibold text-[var(--gold)]">
          ¡Todos los diplomas alcanzados!
        </p>
      )}

      <div className="text-left">
        <p className="dash-hero-levels-label">Niveles activos</p>
        <div className="flex flex-wrap items-center gap-2">
          {levelLabels.map(({ slug, label }) => {
            const status = levelDotStatus(slug, completions, isAdmin);
            return (
              <div
                key={slug}
                className={`dash-hero-level-item dash-hero-level-item--${slug} dash-hero-level-item--${status}`}
                title={
                  status === 'complete'
                    ? `${label} completado`
                    : status === 'locked'
                      ? `${label} bloqueado`
                      : `${label} en progreso`
                }
              >
                <span className="dash-hero-level-dot" aria-hidden />
                <span className="dash-hero-level-tag">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="dash-hero-hint">
        {ringPct.toFixed(0)}% del camino completo ({PROGRAM_MAX_HOURS}h hacia Diploma 3)
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
  dataTour,
}: {
  slug: LevelSlug;
  name: string;
  tagline: string;
  color: string;
  hours: number;
  pct: number;
  unlocked: boolean;
  unlockMsg: string;
  dataTour?: string;
}) {
  const icon = LEVEL_ICONS[slug] ?? '📚';
  const bg = LEVEL_BG[slug] ?? 'rgba(0,0,0,0.03)';

  return (
    <Link
      href={`/nivel/${slug}`}
      data-tour={dataTour}
      className={`dash-level-card dash-level-card--${slug} relative flex gap-5 rounded-xl border no-underline ${
        unlocked ? 'cursor-pointer' : 'opacity-75'
      }`}
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, #fff 72%)`,
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
            <p className="dash-level-stat-num text-[11px] font-semibold mt-1.5" style={{ color }}>
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
  const { totalHours, completions, profile, diplomaAwardDates } = useProgressContext();
  const isAdmin = profile.role === 'admin';
  const [evaluation, setEvaluation] = useState<EvaluationRow | null>(null);
  const [evalLoaded, setEvalLoaded] = useState(false);
  const [diplomaModalTier, setDiplomaModalTier] = useState<DiplomaTier | null>(null);

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
    <div className="app-page">
      <Suspense fallback={null}>
        <TourTrigger />
      </Suspense>

      <PersonalizedHero
        profile={profile}
        totalHours={totalHours}
        completions={completions}
        onViewDiploma={(tier) => setDiplomaModalTier(tier)}
        progressPanel={
          <DashboardHeroProgress
            totalHours={totalHours}
            completions={completions}
            isAdmin={isAdmin}
          />
        }
      />

      <CaminoVisualization
        totalHours={totalHours}
        completions={completions}
        profile={profile}
        onViewDiploma={(tier) => setDiplomaModalTier(tier)}
      />

      <div className="dash-intro-block">
        <p className="mb-3">{WARM_INTRO_PRIMARY}</p>
        <p>{WARM_INTRO_SECONDARY}</p>
        <div className="hero-stat-row dash-intro-stats">
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

      {diplomaModalTier != null && (
        <DiplomaModal
          tier={diplomaModalTier}
          teacherName={profile.full_name}
          teacherEmail={profile.email}
          awardedDate={diplomaAwardDates[diplomaModalTier] ?? new Date()}
          totalHours={totalHours}
          onClose={() => setDiplomaModalTier(null)}
        />
      )}

      {showEvalCta && (
        <EvaluationCta evaluation={evalLoaded ? evaluation : null} loaded={evalLoaded} />
      )}

      <div className="dash-level-grid grid gap-6 md:grid-cols-3" data-tour="levels">
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
              dataTour={slug === 'b' ? 'level-b' : undefined}
            />
          );
        })}
      </div>
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
      className={`eval-cta-card block rounded-xl border p-6 transition no-underline ${
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
