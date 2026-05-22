'use client';

import Image from 'next/image';
import { isDiplomaTierEarned, type Diploma } from '@/lib/diplomas';
import {
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  getDiploma1Progress,
} from '@/lib/extras-gating';
import type { CompletionMap } from '@/lib/verification';

type Props = {
  diploma: Diploma;
  totalHours: number;
  completions: CompletionMap;
  onOpen: () => void;
};

export function DiplomaCard({ diploma, totalHours, completions, onOpen }: Props) {
  const unlocked = isDiplomaTierEarned(diploma.tier, totalHours, completions);
  const hoursRemaining = Math.max(0, diploma.hoursRequired - totalHours);
  const d1 = diploma.tier === 1 ? getDiploma1Progress(totalHours, completions) : null;
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
          <strong>{diploma.hoursRequired} horas</strong> verificadas
          {diploma.tier === 1 && (
            <> + {DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} extras L1 y L2</>
          )}
        </div>
        <p className="logro-msg">{diploma.sublabel}</p>
        {d1 && !unlocked && (
          <p className="text-xs text-[var(--gray-600)] mt-2 leading-relaxed">
            {d1.hoursOk ? '20h ✓' : `${totalHours.toFixed(1)}h / 20h`} · Extras L1:{' '}
            {d1.extrasL1}/{DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL}
            {d1.extrasL1Ok ? ' ✓' : ''} · Extras L2: {d1.extrasL2}/{DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL}
            {!d1.extrasL2Ok && d1.hoursOk
              ? ` — faltan ${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - d1.extrasL2} extras del Nivel 2`
              : d1.extrasL2Ok
                ? ' ✓'
                : ''}
          </p>
        )}
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
            <span className="logro-locked">
              🔒{' '}
              {!d1?.hoursOk && hoursRemaining > 0
                ? `Faltan ${hoursRemaining.toFixed(1)}h`
                : d1 && (!d1.extrasL1Ok || !d1.extrasL2Ok)
                  ? 'Faltan tareas extra'
                  : `Faltan ${hoursRemaining.toFixed(1)}h`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
