'use client';

import type { CaminoMilestone } from './constants';

type Props = {
  milestone: CaminoMilestone;
  achieved: boolean;
  position: { x: number; y: number };
  animateDelay: number;
  animate: boolean;
  highlighted: boolean;
  onHover: (id: string | null) => void;
  onClick: (milestone: CaminoMilestone) => void;
};

export function Milestone({
  milestone,
  achieved,
  position,
  animateDelay,
  animate,
  highlighted,
  onHover,
  onClick,
}: Props) {
  const sizeClass =
    milestone.size === 'large'
      ? 'camino-milestone--large'
      : milestone.size === 'medium'
        ? 'camino-milestone--medium'
        : 'camino-milestone--small';

  return (
    <div
      className={`camino-milestone ${sizeClass} ${achieved ? 'camino-milestone--achieved' : 'camino-milestone--upcoming'} ${highlighted ? 'camino-milestone--highlight' : ''} ${animate ? 'camino-milestone--enter' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: animate ? `${animateDelay}ms` : undefined,
        ['--milestone-color' as string]: milestone.color ?? 'var(--navy)',
      }}
    >
      <button
        type="button"
        className="camino-milestone-btn"
        aria-label={milestone.tooltip}
        title={milestone.tooltip}
        onMouseEnter={() => onHover(milestone.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(milestone.id)}
        onBlur={() => onHover(null)}
        onClick={() => onClick(milestone)}
      >
        {milestone.icon ? (
          <span className="camino-milestone-icon" aria-hidden>
            {milestone.icon}
          </span>
        ) : (
          <span className="camino-milestone-dot" aria-hidden />
        )}
        <span className="camino-milestone-label">{milestone.shortLabel}</span>
      </button>
    </div>
  );
}
