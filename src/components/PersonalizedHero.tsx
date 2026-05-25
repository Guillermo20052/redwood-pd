'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getFirstName } from '@/lib/get-first-name';
import {
  computeDashboardState,
  getDashboardHeroContent,
  type DashboardHeroCta,
} from '@/lib/dashboard-state';
import type { CompletionMap } from '@/lib/verification';
import type { Diploma3ProgramRequirements } from '@/lib/diploma3-requirements';

const TAGLINE = 'Siempre mejores. Siempre más conectadas.';

type Props = {
  profile: {
    role: 'teacher' | 'admin';
    full_name: string;
    email: string;
  };
  totalHours: number;
  completions: CompletionMap;
  diploma3Program?: Diploma3ProgramRequirements | null;
  onViewDiploma?: (tier: 1 | 2 | 3) => void;
  progressPanel?: React.ReactNode;
};

function HeroCta({
  cta,
  onViewDiploma,
}: {
  cta: DashboardHeroCta;
  onViewDiploma?: (tier: 1 | 2 | 3) => void;
}) {
  if ('action' in cta) {
    return (
      <button
        type="button"
        className="dash-welcome-cta"
        onClick={() => onViewDiploma?.(cta.tier)}
      >
        {cta.label}
      </button>
    );
  }
  return (
    <Link href={cta.href} className="dash-welcome-cta">
      {cta.label}
    </Link>
  );
}

export function PersonalizedHero({
  profile,
  totalHours,
  completions,
  diploma3Program,
  onViewDiploma,
  progressPanel,
}: Props) {
  const firstName = getFirstName(profile.full_name, profile.email);
  const state = useMemo(
    () => computeDashboardState(profile, { completions, totalHours, diploma3Program }),
    [profile, completions, totalHours, diploma3Program]
  );
  const { subtitle, cta, variant } = useMemo(
    () => getDashboardHeroContent(state),
    [state]
  );

  const showSparkle = variant === 'gold';

  return (
    <section
      className={`personalized-hero dash-welcome-card dash-welcome-card--${variant}`}
      aria-labelledby="dash-welcome-title"
    >
      <div className="dash-welcome-inner">
        <div className="dash-welcome-copy">
          {variant === 'admin' && (
            <span className="dash-welcome-admin-badge">Administradora</span>
          )}
          <p className="dash-welcome-eyebrow">Bienvenida de vuelta</p>
          <h1 id="dash-welcome-title" className="dash-welcome-title">
            Hola, {firstName}
            {showSparkle ? <span aria-hidden> ✨</span> : null}.
          </h1>
          <p className="dash-welcome-tagline">{TAGLINE}</p>
          <p className="dash-welcome-subtitle">{subtitle}</p>
          {cta ? <HeroCta cta={cta} onViewDiploma={onViewDiploma} /> : null}
        </div>
        {progressPanel ? <div className="dash-welcome-progress">{progressPanel}</div> : null}
      </div>
    </section>
  );
}
