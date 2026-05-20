'use client';

import Image from 'next/image';
import type { Diploma } from '@/lib/diplomas';

type Props = {
  diploma: Diploma;
  totalHours: number;
  onOpen: () => void;
};

export function DiplomaCard({ diploma, totalHours, onOpen }: Props) {
  const unlocked = totalHours >= diploma.hoursRequired;
  const hoursRemaining = Math.max(0, diploma.hoursRequired - totalHours);
  const previewClass =
    diploma.tier === 1 ? 'lp1' : diploma.tier === 2 ? 'lp2' : 'lp3';

  return (
    <div
      className={`logro-card ${unlocked ? '' : 'opacity-60'}`}
      style={{ borderTop: `4px solid ${diploma.palette.borderColor}` }}
    >
      <div className={`logro-diploma-preview ${previewClass}`}>
        <span className="logro-preview-label">Diploma {diploma.tier}</span>
        <Image
          src={diploma.iconPath}
          alt=""
          width={64}
          height={64}
          className={unlocked ? '' : 'grayscale opacity-70'}
        />
      </div>
      <div className="logro-body">
        <p className={`logro-level ${previewClass}-txt`}>Diploma {diploma.tier}</p>
        <h3 className="logro-title">{diploma.name}</h3>
        <div className="logro-req">
          <strong>{diploma.hoursRequired} horas</strong> verificadas para desbloquear
        </div>
        <p className="logro-msg">{diploma.sublabel}</p>
        <div className="logro-status">
          {unlocked ? (
            <>
              <span className="logro-unlocked">✓ Desbloqueado</span>
              <button
                type="button"
                onClick={onOpen}
                className="btn-primary text-[10px] py-2 px-3"
                style={{ background: diploma.palette.accentColor }}
              >
                Ver e imprimir
              </button>
            </>
          ) : (
            <span className="logro-locked">🔒 Faltan {hoursRemaining.toFixed(1)}h</span>
          )}
        </div>
      </div>
    </div>
  );
}
