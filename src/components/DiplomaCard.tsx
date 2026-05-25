'use client';

import Link from 'next/link';
import {
  isDiplomaTierEarned,
  type Diploma,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
} from '@/lib/diplomas';
import type { Diploma3ProgramRequirements } from '@/lib/diploma3-requirements';
import {
  countCompletedExtras,
  isMandatoryPartsComplete,
  meetsDiploma1ExtrasRequirement,
} from '@/lib/extras-gating';
import { getPartsByLevel } from '@/lib/curriculum-path';
import { isPartComplete } from '@/lib/part-progress';
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

type ReqItem = { label: string; met: boolean; href?: string };

function countCompleteParts(level: 'b' | 'i' | 'a', completions: CompletionMap): number {
  return getPartsByLevel(level).filter((part) => isPartComplete(part, completions)).length;
}

function buildRequirements(
  tier: 1 | 2 | 3,
  totalHours: number,
  completions: CompletionMap,
  diploma3Program?: Diploma3ProgramRequirements | null
): ReqItem[] {
  const extrasL1 = countCompletedExtras('b', completions);
  const extrasL2 = countCompletedExtras('i', completions);
  const extrasL3 = countCompletedExtras('a', completions);
  const d1Complete = totalHours >= 20 && meetsDiploma1ExtrasRequirement(completions);

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
      { label: 'Cumple todo lo del Diploma 1', met: d1Complete },
      {
        label: `Alcanza 24 horas verificadas en total (${totalHours.toFixed(1)}h)`,
        met: totalHours >= 24,
      },
    ];
  }

  const program = diploma3Program ?? {
    eticaRead: false,
    reflectionL1: false,
    reflectionL2: false,
    reflectionL3: false,
    evaluationComplete: false,
  };

  const partsA = countCompleteParts('a', completions);

  return [
    { label: 'Nivel 1 completo', met: isMandatoryPartsComplete('b', completions) },
    { label: 'Nivel 2 completo', met: isMandatoryPartsComplete('i', completions) },
    {
      label: `Nivel 3 completo (${partsA}/5 partes)`,
      met: isMandatoryPartsComplete('a', completions),
    },
    {
      label: `4 tareas Level Up del Nivel 1 (${extrasL1}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL1 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    },
    {
      label: `4 tareas Level Up del Nivel 2 (${extrasL2}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL2 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    },
    {
      label: `4 tareas Level Up del Nivel 3 (${extrasL3}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL})`,
      met: extrasL3 >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
    },
    {
      label: `30h verificadas (${totalHours.toFixed(1)}h)`,
      met: totalHours >= 30,
    },
    {
      label: 'Política de ética leída',
      met: program.eticaRead,
      href: program.eticaRead ? undefined : '/etica',
    },
    {
      label: 'Reflexión del Nivel 1',
      met: program.reflectionL1,
      href: program.reflectionL1 ? undefined : '/reflexion',
    },
    {
      label: 'Reflexión del Nivel 2',
      met: program.reflectionL2,
      href: program.reflectionL2 ? undefined : '/reflexion',
    },
    {
      label: 'Reflexión del Nivel 3',
      met: program.reflectionL3,
      href: program.reflectionL3 ? undefined : '/reflexion',
    },
    {
      label: 'Evaluación completa',
      met: program.evaluationComplete,
      href: program.evaluationComplete ? undefined : '/evaluacion',
    },
  ];
}

function lockedSummary(
  tier: 1 | 2 | 3,
  totalHours: number,
  completions: CompletionMap,
  diploma3Program?: Diploma3ProgramRequirements | null
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

  if (tier === 3) {
    if (extrasL3 < DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL) {
      parts.push(`${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL - extrasL3} Level Up L3`);
    }
    const program = diploma3Program;
    if (program && !program.eticaRead) parts.push('ética');
    if (program && (!program.reflectionL1 || !program.reflectionL2 || !program.reflectionL3)) {
      parts.push('reflexiones');
    }
    if (program && !program.evaluationComplete) parts.push('evaluación');
  }

  return parts.length ? `Faltan ${parts.join(' + ')}` : 'Casi lo logras';
}

type Props = {
  diploma: Diploma;
  totalHours: number;
  completions: CompletionMap;
  diploma3Program?: Diploma3ProgramRequirements | null;
  onOpen: () => void;
};

export function DiplomaCard({
  diploma,
  totalHours,
  completions,
  diploma3Program,
  onOpen,
}: Props) {
  const earned = isDiplomaTierEarned(
    diploma.tier,
    totalHours,
    completions,
    diploma.tier === 3 ? diploma3Program : undefined
  );
  const previewClass =
    diploma.tier === 1 ? 'lp1' : diploma.tier === 2 ? 'lp2' : 'lp3';
  const tier = diploma.tier;
  const requirements = buildRequirements(tier, totalHours, completions, diploma3Program);

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
            <li
              key={req.label}
              className={req.met ? 'logro-check--met' : 'logro-check--pending'}
            >
              <span className="logro-check-icon" aria-hidden>
                {req.met ? '✓' : '○'}
              </span>
              {!req.met && req.href ? (
                <Link href={req.href} className="logro-check-link">
                  {req.label}
                </Link>
              ) : (
                req.label
              )}
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
              🔒 {lockedSummary(tier, totalHours, completions, diploma3Program)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
