'use client';

import { getProgressBannerState } from '@/lib/progress';
import type { Diploma3ProgramRequirements } from '@/lib/diploma3-requirements';
import type { CompletionMap } from '@/lib/verification';

type Props = {
  totalHours: number;
  completions: CompletionMap;
  isAdmin?: boolean;
  diploma3Program?: Diploma3ProgramRequirements | null;
};

export function ProgressBanner({
  totalHours,
  completions,
  isAdmin = false,
  diploma3Program,
}: Props) {
  const state = getProgressBannerState(
    totalHours,
    completions,
    isAdmin,
    diploma3Program
  );

  return (
    <div className="progress-banner no-print">
      <span className="progress-label">Progreso PD verificado</span>
      <div className="progress-track">
        <div
          className={`progress-fill${state.goldGlow ? ' progress-fill--complete' : ''}`}
          style={{ width: `${state.fillPercent}%` }}
        />
      </div>
      <span className="progress-hours">{totalHours.toFixed(1)}h</span>
      <span className="progress-note">{state.thresholdLabel}</span>
      <span className="progress-note ml-2 italic">{state.hint}</span>
      {state.complete && !isAdmin && (
        <a href="/logros" className="header-badge no-underline ml-2">
          Ver diplomas
        </a>
      )}
    </div>
  );
}
