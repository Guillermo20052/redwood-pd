import type { CompletionMap } from './verification';
import {
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  meetsDiploma1ExtrasRequirement,
  meetsDiploma3ExtrasRequirement,
  getDiploma1Progress,
  countCompletedExtras,
} from './extras-gating';
import {
  meetsDiploma3CoreRequirements,
  meetsDiploma3ProgramRequirements,
  type Diploma3ProgramRequirements,
} from './diploma3-requirements';

export type { Diploma3ProgramRequirements };

export type DiplomaTier = 1 | 2 | 3;

export interface DiplomaPalette {
  borderColor: string;
  gradient: string;
  accentColor: string;
}

export interface Diploma {
  tier: DiplomaTier;
  name: string;
  sublabel: string;
  hoursRequired: number;
  iconPath: string;
  palette: DiplomaPalette;
}

export const DIPLOMAS: readonly Diploma[] = [
  {
    tier: 1,
    name: 'Docente IA Consciente',
    sublabel:
      'Bronce · Niveles 1 y 2 completos (20h) + 4 Level Up de cada nivel',
    hoursRequired: 20,
    iconPath: '/assets/diplomas/diploma-1.svg',
    palette: {
      borderColor: '#1A2E4A',
      gradient: 'linear-gradient(160deg, #fff 0%, #EAF0F8 100%)',
      accentColor: '#1A2E4A',
    },
  },
  {
    tier: 2,
    name: 'Docente IA Innovadora',
    sublabel:
      'Plata · Diploma 1 + 24h verificadas en total',
    hoursRequired: 24,
    iconPath: '/assets/diplomas/diploma-2.svg',
    palette: {
      borderColor: '#1A7A6E',
      gradient: 'linear-gradient(160deg, #fff 0%, #E0F5F0 100%)',
      accentColor: '#1A7A6E',
    },
  },
  {
    tier: 3,
    name: 'Docente IA Transformadora',
    sublabel:
      'Oro · Diploma 2 + 30h + 4 Level Up del Nivel 3 + ética + reflexiones + evaluación',
    hoursRequired: 30,
    iconPath: '/assets/diplomas/diploma-3.svg',
    palette: {
      borderColor: '#B22234',
      gradient: 'linear-gradient(160deg, #fff 0%, #FDF5E4 100%)',
      accentColor: '#B22234',
    },
  },
] as const;

export function getDiploma(tier: DiplomaTier): Diploma {
  const d = DIPLOMAS.find((x) => x.tier === tier);
  if (!d) throw new Error(`Unknown diploma tier: ${tier}`);
  return d;
}

/** Tier earned when hours AND cumulative extra requirements for that tier are met. */
export function isDiplomaTierEarned(
  tier: DiplomaTier,
  totalHours: number,
  completions: CompletionMap,
  diploma3Program?: Diploma3ProgramRequirements | null
): boolean {
  const d = getDiploma(tier);
  if (totalHours < d.hoursRequired) return false;
  if (!meetsDiploma1ExtrasRequirement(completions)) return false;
  if (tier === 3) {
    if (!meetsDiploma3CoreRequirements(totalHours, completions)) return false;
    if (!meetsDiploma3ProgramRequirements(diploma3Program)) return false;
    return true;
  }
  return true;
}

export function getEarnedDiplomas(
  totalHours: number,
  completions: CompletionMap = {},
  diploma3Program?: Diploma3ProgramRequirements | null
): Diploma[] {
  return DIPLOMAS.filter((d) =>
    isDiplomaTierEarned(d.tier, totalHours, completions, diploma3Program)
  );
}

export function getNextDiploma(
  totalHours: number,
  completions: CompletionMap = {},
  diploma3Program?: Diploma3ProgramRequirements | null
): Diploma | null {
  return (
    DIPLOMAS.find(
      (d) => !isDiplomaTierEarned(d.tier, totalHours, completions, diploma3Program)
    ) ?? null
  );
}

export function getEarnedTiers(
  totalHours: number,
  completions: CompletionMap = {},
  diploma3Program?: Diploma3ProgramRequirements | null
): DiplomaTier[] {
  return getEarnedDiplomas(totalHours, completions, diploma3Program).map((d) => d.tier);
}

export {
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  getDiploma1Progress,
  meetsDiploma1ExtrasRequirement,
  meetsDiploma3ExtrasRequirement,
  countCompletedExtras,
};
