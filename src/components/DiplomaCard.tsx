'use client';

import {
  isDiplomaTierEarned,
  type Diploma,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
} from '@/lib/diplomas';
import {
  countCompletedExtras,
  meetsDiploma1ExtrasRequirement,
  meetsDiploma3ExtrasRequirement,
} from '@/lib/extras-gating';
import type { CompletionMap } from '@/lib/verification';

const DIPLOMA_BADGES: Record<1 | 2 | 3, string> = {
  1: '/diplomas/diploma-1-bronze.png',
  2: '/diplomas/diploma-2-silver.png',
  3: '/diplomas/diploma-3-gold.png',
};

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Bronce',
  2: 'Plata',
  3: 'Oro',
};

type ReqItem = { label: string; met: boolean };

function buildRequirements(
  tier: 1 | 2 | 3,
  totalHours: number,
  completions: CompletionMap
): ReqItem[] {
  const hoursRequired = tier === 1 ? 20 : tier === 2 ? 24 : 30;
  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const extrasL3 = countCompletedExtras('a', completions);

  const items: ReqItem[] = [
    {
      label: `${hoursRequired}+ horas verificadas (${totalHours.toFixed(1)}h)`,
      met: totalHours >= hoursRequired,
    },
    {
      label: `4+ Level Up Nivel 1 (${extrasL1}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL1 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    },
    {
      label: `4+ Level Up Nivel 2 (${extrasL2}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL2 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    },
  ];

  if (tier >= 3) {
    items.push({
      label: `4+ Level Up Nivel 3 (${extrasL3}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL3 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    });
  }

  if (tier >= 2) {
    items.unshift({
      label: 'Diploma 1 completo',
      met: meetsDiploma1ExtrasRequirement(completions) && totalHours >= 20,
    });
  }
  if (tier === 3) {
    items.unshift({
      label: 'Diploma 2 completo',
      met:
        totalHours >= 24 &&
        meetsDiploma1ExtrasRequirement(completions),
    });
  }

  return items;
}

function lockedSummary(
  tier: 1 | 2 | 3,
  totalHours: number,
  completions: CompletionMap
): string {
  const hoursRequired = tier === 1 ? 20 : tier === 2 ? 24 : 30;
  const hoursLeft = Math.max(0, hoursRequired - totalHours);
  const parts: string[] = [];

  if (hoursLeft > 0) parts.push(`${hoursLeft.toFixed(1)}h`);

  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const extrasL3 = countCompletedExtras('a', completions);

  if (extrasL1 < DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL || extrasL2 < DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL) {
    const needL1 = Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL1);
    const needL2 = Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL2);
    if (needL1 > 0) parts.push(`${needL1} Level Up L1`);
    if (needL2 > 0) parts.push(`${needL2} Level Up L2`);
  }

  if (tier === 3 && !meetsDiploma3ExtrasRequirement(completions)) {
    const needL3 = Math.max(0, DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL3);
    if (needL3 > 0) parts.push(`${needL3} Level Up L3`);
  }

  return parts.length ? `Faltan ${parts.join(' + ')}` : 'Casi lo logras';
}

type Props = {
  diploma: Diploma;
  totalHours: number;
  completions: CompletionMap;
  onOpen: () => void;
};

export function DiplomaCard({ diploma, totalHours, completions, onOpen }: Props) {
  const earned = isDiplomaTierEarned(diploma.tier, totalHours, completions);
  const previewClass =
    diploma.tier === 1 ? 'lp1' : diploma.tier === 2 ? 'lp2' : 'lp3';
  const tier = diploma.tier;
  const requirements = buildRequirements(tier, totalHours, completions);

  return (
    <div
      className={`logro-card ${earned ? 'logro-card--earned' : 'logro-card--locked'}`}
      style={{ borderTop: `4px solid ${diploma.palette.borderColor}` }}
    >
      <div className={`logro-diploma-preview ${previewClass}`}>
        <span className="logro-preview-label">Diploma {tier}</span>
        <div className="diploma-badge-wrap">
          <img
            src={DIPLOMA_BADGES[tier]}
            alt={`Insignia Diploma ${tier}`}
            className={`diploma-badge ${earned ? 'diploma-badge-earned' : 'diploma-badge-locked'}`}
            data-tier={tier}
          />
        </div>
      </div>

      <div className="logro-body">
        <p className={`logro-level ${previewClass}-txt`}>
          Diploma {tier} · {TIER_LABEL[tier]}
        </p>
        <h3 className="logro-title">{diploma.name}</h3>

        <div className="logro-req-pill">
          <strong>{diploma.hoursRequired}h</strong> verificadas mínimo
        </div>

        <ul className="logro-checklist" aria-label="Requisitos del diploma">
          {requirements.map((req) => (
            <li key={req.label} className={req.met ? 'logro-check--met' : 'logro-check--pending'}>
              <span className="logro-check-icon" aria-hidden>
                {req.met ? '✓' : '○'}
              </span>
              {req.label}
            </li>
          ))}
        </ul>

        <div className="logro-status">
          {earned ? (
            <>
              <span className="logro-unlocked">✓ Desbloqueado</span>
              <button
                type="button"
                onClick={onOpen}
                className="btn-primary text-[10px] py-2 px-3 logro-print-btn"
                style={{ background: diploma.palette.accentColor }}
              >
                Ver e imprimir
              </button>
            </>
          ) : (
            <span className="logro-locked">
              🔒 {lockedSummary(tier, totalHours, completions)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
