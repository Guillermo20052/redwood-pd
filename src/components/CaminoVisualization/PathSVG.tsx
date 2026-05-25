'use client';

type Props = {
  progressPct: number;
  vertical?: boolean;
  animate?: boolean;
};

function horizontalPathD(): string {
  return 'M 2 52 C 18 38, 32 62, 50 48 S 82 38, 98 52';
}

function verticalPathD(): string {
  return 'M 50 2 C 62 18, 38 32, 52 50 S 62 82, 50 98';
}

export function PathSVG({ progressPct, vertical = false, animate = true }: Props) {
  const pathD = vertical ? verticalPathD() : horizontalPathD();
  const achieved = Math.min(100, Math.max(0, progressPct));
  const gradientId = vertical ? 'caminoAchievedGradientV' : 'caminoAchievedGradient';

  return (
    <svg
      className={`camino-path-svg ${vertical ? 'camino-path-svg--vertical' : ''}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="caminoAchievedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--navy)" />
          <stop offset="66%" stopColor="#8B7355" />
          <stop offset="80%" stopColor="#7A9BAE" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
        <linearGradient id="caminoAchievedGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--navy)" />
          <stop offset="66%" stopColor="#8B7355" />
          <stop offset="80%" stopColor="#7A9BAE" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>

      <path
        d={pathD}
        pathLength={100}
        className={`camino-path camino-path--upcoming ${animate ? 'camino-path--fade-in' : ''}`}
        vectorEffect="non-scaling-stroke"
      />

      {achieved > 0 && (
        <path
          d={pathD}
          pathLength={100}
          className={`camino-path camino-path--achieved ${animate ? 'camino-path--draw-achieved' : ''}`}
          style={{
            stroke: `url(#${gradientId})`,
            strokeDasharray: `${achieved} ${100 - achieved}`,
          }}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

/** Approximate milestone anchor on the curved path (viewBox coords). */
export function getPointOnPath(t: number, vertical: boolean): { x: number; y: number } {
  const clamped = Math.min(100, Math.max(0, t));
  if (vertical) {
    const y = 2 + (clamped / 100) * 96;
    const x = 50 + Math.sin((clamped / 100) * Math.PI * 1.6) * 10;
    return { x, y };
  }
  const x = 2 + (clamped / 100) * 96;
  const y = 52 + Math.sin((clamped / 100) * Math.PI * 1.6) * 10;
  return { x, y };
}
