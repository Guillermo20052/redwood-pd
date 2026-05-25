'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CompletionMap } from '@/lib/verification';
import { isDiplomaTierEarned, type DiplomaTier } from '@/lib/diplomas';
import { getFirstName } from '@/lib/get-first-name';
import {
  CAMINO_MILESTONES,
  getCaminoSubtitle,
  hoursToPathPct,
  type CaminoMilestone,
} from './CaminoVisualization/constants';
import { Milestone } from './CaminoVisualization/Milestone';
import { PathSVG, getPointOnPath } from './CaminoVisualization/PathSVG';
import { YouAreHereMarker } from './CaminoVisualization/YouAreHereMarker';

type Props = {
  totalHours: number;
  completions: CompletionMap;
  profile: {
    full_name: string;
    email: string;
    role: 'teacher' | 'admin';
  };
  onViewDiploma?: (tier: DiplomaTier) => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

function useIsVerticalLayout(): boolean {
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setVertical(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return vertical;
}

export function CaminoVisualization({
  totalHours,
  completions,
  profile,
  onViewDiploma,
}: Props) {
  const isAdmin = profile.role === 'admin';
  const prefersReducedMotion = usePrefersReducedMotion();
  const vertical = useIsVerticalLayout();
  const animate = !prefersReducedMotion;

  const hasD1 = isAdmin || isDiplomaTierEarned(1, totalHours, completions);
  const hasD2 = isAdmin || isDiplomaTierEarned(2, totalHours, completions);
  const hasD3 = isAdmin || isDiplomaTierEarned(3, totalHours, completions);

  const progressPct = isAdmin ? 100 : hoursToPathPct(totalHours);
  const subtitle = getCaminoSubtitle(totalHours, isAdmin, hasD1, hasD2, hasD3);

  const firstName = getFirstName(profile.full_name, profile.email);
  const initial = firstName.charAt(0).toUpperCase() || 'D';

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickMessage, setClickMessage] = useState<string | null>(null);

  const youPosition = useMemo(
    () => getPointOnPath(progressPct, vertical),
    [progressPct, vertical]
  );

  const isMilestoneAchieved = useCallback(
    (m: CaminoMilestone) => {
      if (isAdmin) return true;
      if (m.tier != null) {
        return isDiplomaTierEarned(m.tier, totalHours, completions);
      }
      return totalHours >= m.hours;
    },
    [completions, isAdmin, totalHours]
  );

  const handleMilestoneClick = useCallback(
    (m: CaminoMilestone) => {
      if (m.tier != null) {
        const earned = isMilestoneAchieved(m);
        if (earned) {
          onViewDiploma?.(m.tier);
          setClickMessage(null);
          return;
        }
        const remaining = Math.max(0, m.hours - totalHours);
        setClickMessage(`Te faltan ${remaining.toFixed(1)}h para este diploma`);
        setHoveredId(m.id);
        return;
      }

      setClickMessage(m.clickNote ?? m.tooltip);
      setHoveredId(m.id);
    },
    [isMilestoneAchieved, onViewDiploma, totalHours]
  );

  useEffect(() => {
    if (!clickMessage) return;
    const t = setTimeout(() => {
      setClickMessage(null);
      setHoveredId(null);
    }, 3500);
    return () => clearTimeout(t);
  }, [clickMessage]);

  const tooltipText = useMemo(() => {
    if (clickMessage) return clickMessage;
    if (!hoveredId) return null;
    return CAMINO_MILESTONES.find((m) => m.id === hoveredId)?.tooltip ?? null;
  }, [clickMessage, hoveredId]);

  return (
    <section className="camino-section" aria-labelledby="camino-title" data-tour="camino">
      <header className="camino-header">
        <p className="camino-eyebrow">Progreso del programa</p>
        <h2 id="camino-title" className="camino-title font-condensed">
          Tu camino al Diploma de Oro
        </h2>
        <p className="camino-subtitle">{subtitle}</p>
      </header>

      <div
        className={`camino-viz ${vertical ? 'camino-viz--vertical' : ''} ${isAdmin ? 'camino-viz--admin' : ''}`}
      >
        <PathSVG progressPct={progressPct} vertical={vertical} animate={animate} />

        {CAMINO_MILESTONES.map((m, index) => (
          <Milestone
            key={m.id}
            milestone={m}
            achieved={isMilestoneAchieved(m)}
            position={getPointOnPath(m.pct, vertical)}
            animateDelay={120 + index * 80}
            animate={animate}
            highlighted={hoveredId === m.id}
            onHover={setHoveredId}
            onClick={handleMilestoneClick}
          />
        ))}

        <YouAreHereMarker initial={initial} position={youPosition} animate={animate} />

        {tooltipText && (
          <div className="camino-floating-msg" role="status">
            {tooltipText}
          </div>
        )}
      </div>
    </section>
  );
}
