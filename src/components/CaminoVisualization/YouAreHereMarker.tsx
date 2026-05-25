'use client';

type Props = {
  initial: string;
  position: { x: number; y: number };
  animate: boolean;
};

export function YouAreHereMarker({ initial, position, animate }: Props) {
  return (
    <div
      className={`camino-you-marker ${animate ? 'camino-you-marker--pulse' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      aria-label={`Tu posición: ${initial}`}
      title="Estás aquí"
    >
      <span className="camino-you-marker-inner">{initial}</span>
    </div>
  );
}
