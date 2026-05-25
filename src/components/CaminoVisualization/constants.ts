import type { DiplomaTier } from '@/lib/diplomas';

export const CAMINO_MAX_HOURS = 30;

export type MilestoneSize = 'small' | 'medium' | 'large';

export type CaminoMilestone = {
  id: string;
  hours: number;
  /** Position along the path (0–100). */
  pct: number;
  shortLabel: string;
  tooltip: string;
  size: MilestoneSize;
  tier?: DiplomaTier;
  icon?: string;
  color?: string;
  clickNote?: string;
};

export const CAMINO_MILESTONES: readonly CaminoMilestone[] = [
  {
    id: 'inicio',
    hours: 0,
    pct: 0,
    shortLabel: 'Inicio',
    tooltip: 'Comienza tu camino aquí',
    size: 'small',
  },
  {
    id: '5h',
    hours: 5,
    pct: 16.7,
    shortLabel: '5h',
    tooltip: 'Primeros pasos · 5h verificadas',
    size: 'small',
    clickNote: 'Buen ritmo. Sigue así.',
  },
  {
    id: '10h',
    hours: 10,
    pct: 33.3,
    shortLabel: 'Nivel 1',
    tooltip: 'Nivel 1 completo · ¡Buen trabajo!',
    size: 'medium',
    color: 'var(--navy)',
    clickNote: 'Nivel 1 completo. ¡Buen trabajo!',
  },
  {
    id: '15h',
    hours: 15,
    pct: 50,
    shortLabel: '15h',
    tooltip: 'A medio camino del Diploma 1',
    size: 'small',
    clickNote: 'Buen ritmo. Sigue así.',
  },
  {
    id: 'd1',
    hours: 20,
    pct: 66.7,
    shortLabel: 'D1',
    tooltip: 'Diploma 1 (Bronce) · Docente IA Consciente',
    size: 'large',
    tier: 1,
    icon: '🌱',
    color: '#8B7355',
  },
  {
    id: 'd2',
    hours: 24,
    pct: 80,
    shortLabel: 'D2',
    tooltip: 'Diploma 2 (Plata) · Docente IA Innovadora',
    size: 'large',
    tier: 2,
    icon: '🌳',
    color: '#7A9BAE',
  },
  {
    id: 'd3',
    hours: 30,
    pct: 100,
    shortLabel: 'D3',
    tooltip: 'Diploma 3 (Oro) · Docente IA Transformadora',
    size: 'large',
    tier: 3,
    icon: '🌲',
    color: 'var(--gold)',
  },
] as const;

export function hoursToPathPct(hours: number): number {
  return Math.min(100, Math.max(0, (hours / CAMINO_MAX_HOURS) * 100));
}

export function getCaminoSubtitle(
  totalHours: number,
  isAdmin: boolean,
  hasD1: boolean,
  hasD2: boolean,
  hasD3: boolean
): string {
  if (isAdmin) return 'Vista de administradora — todos los milestones desbloqueados.';
  if (hasD3 || totalHours >= CAMINO_MAX_HOURS) {
    return 'Has recorrido el camino completo. 🌲';
  }
  if (hasD2 || totalHours >= 24) {
    return 'Diploma 2 en tus manos. Sigue hacia el Oro.';
  }
  if (hasD1 || totalHours >= 20) {
    return 'Diploma 1 logrado. Siguiente: 24h para el Diploma de Plata.';
  }
  if (totalHours > 0) {
    return 'Estás aquí. Te falta poco para tu siguiente milestone.';
  }
  return 'Cada paso te acerca a tu próximo logro. Aquí empieza.';
}
