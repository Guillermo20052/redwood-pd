import type { CompletionMap } from './verification';
import {
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  meetsDiplomaExtrasRequirement,
  getDiploma1Progress,
} from './extras-gating';

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
      'Por completar Niveles 1 y 2 (20h), más al menos 4 tareas extra de cada nivel',
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
      'Por integrar IA en su planeación, diferenciación y evaluación cotidianas (24h + extras Diploma 1)',
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
      'Por liderar la transformación pedagógica con IA en el Liceo Redwood (30h + extras Diploma 1)',
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

/** Tier earned only when hours AND (for all tiers) Diploma 1 extra requirements are met. */
export function isDiplomaTierEarned(
  tier: DiplomaTier,
  totalHours: number,
  completions: CompletionMap
): boolean {
  const d = getDiploma(tier);
  if (totalHours < d.hoursRequired) return false;
  return meetsDiplomaExtrasRequirement(completions);
}

export function getEarnedDiplomas(totalHours: number, completions: CompletionMap = {}): Diploma[] {
  return DIPLOMAS.filter((d) => isDiplomaTierEarned(d.tier, totalHours, completions));
}

export function getNextDiploma(
  totalHours: number,
  completions: CompletionMap = {}
): Diploma | null {
  return DIPLOMAS.find((d) => !isDiplomaTierEarned(d.tier, totalHours, completions)) ?? null;
}

export function getEarnedTiers(totalHours: number, completions: CompletionMap = {}): DiplomaTier[] {
  return getEarnedDiplomas(totalHours, completions).map((d) => d.tier);
}

export { DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL, getDiploma1Progress, meetsDiplomaExtrasRequirement };
