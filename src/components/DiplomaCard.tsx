'use client';

import {
  isDiplomaTierEarned,
  type Diploma,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
} from '@/lib/diplomas';
import {
  countCompletedExtras,
  meetsDiploma1ExtrasRequirement,
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
  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const extrasL3 = countCompletedExtras('a', completions);
  const d1Complete =
    totalHours >= 20 &&
    meetsDiploma1ExtrasRequirement(completions);
  const d2Complete =
    totalHours >= 24 && d1Complete;

  if (tier === 1) {
    return [
      {
        label: 'Completa los Niveles 1 y 2 (20 horas verificadas)',
        met: totalHours >= 20,
      },
      {
        label: `Termina 4 tareas Level Up del Nivel 1 (${extrasL1}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
        met: extrasL1 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
      },
      {
        label: `Termina 4 tareas Level Up del Nivel 2 (${extrasL2}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
        met: extrasL2 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
      },
    ];
  }

  if (tier === 2) {
    return [
      {
        label: 'Cumple todo lo del Diploma 1',
        met: d1Complete,
      },
      {
        label: `Alcanza 24 horas verificadas en total (${totalHours.toFixed(1)}h)`,
        met: totalHours >= 24,
      },
    ];
  }

  return [
    {
      label: 'Cumple todo lo del Diploma 2',
      met: d2Complete,
    },
    {
      label: `Alcanza 30 horas verificadas en total (${totalHours.toFixed(1)}h)`,
      met: totalHours >= 30,
    },
    {
      label: `Termina al menos 4 tareas Level Up del Nivel 3 (${extrasL3}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL3 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    },
  ];
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

  if (tier === 1) {
    if (extrasL1 < DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL) {
      parts.push(`${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL1} Level Up L1`);
    }
    if (extrasL2 < DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL) {
      parts.push(`${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL2} Level Up L2`);
    }
  }

  if (tier === 3 && extrasL3 < DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL) {
    parts.push(`${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL3} Level Up L3`);
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

        <p className="text-xs font-semibold text-[var(--gray-600)] mt-2 mb-1">
          {tier === 1
            ? 'Para conseguir el Diploma de Bronce:'
            : tier === 2
              ? 'Para conseguir el Diploma de Plata:'
              : 'Para conseguir el Diploma de Oro:'}
        </p>

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
                Ver certificado
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
