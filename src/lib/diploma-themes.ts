import type { DiplomaTier } from './diplomas';

export type DiplomaTheme = {
  tier: DiplomaTier;
  name: string;
  icon: string;
  metal: 'Bronce' | 'Plata' | 'Oro';
  label: string;
  subtitle: string;
  description: string;
  accentColor: string;
  backgroundTint: string;
  cornerMotif: 'sprout' | 'tree' | 'laurel';
  nextTierHint: string | null;
};

export const DIPLOMA_THEMES: Record<DiplomaTier, DiplomaTheme> = {
  1: {
    tier: 1,
    name: 'Docente IA Consciente',
    icon: '🌱',
    metal: 'Bronce',
    label: 'NIVEL I · 20 HORAS',
    subtitle: 'Fundamentos e Integración',
    description:
      'Ha demostrado compromiso con la innovación educativa, integrando la Inteligencia Artificial como herramienta pedagógica responsable en el aula IB de Redwood High School.',
    accentColor: '#7B8B5C',
    backgroundTint: '#FAF7F0',
    cornerMotif: 'sprout',
    nextTierHint: "Completa 24h para el Diploma 'Docente IA Innovadora'",
  },
  2: {
    tier: 2,
    name: 'Docente IA Innovadora',
    icon: '🌳',
    metal: 'Plata',
    label: 'NIVELES I + II · 24 HORAS',
    subtitle: 'Integración Pedagógica Avanzada',
    description:
      'Ha alcanzado dominio en la integración de múltiples herramientas de IA en su práctica docente, demostrando innovación pedagógica y capacidad de articular flujos de trabajo complejos en el aula IB.',
    accentColor: '#B8C4D6',
    backgroundTint: '#F5F7FA',
    cornerMotif: 'tree',
    nextTierHint:
      "Completa 30h y 4 tareas Level Up del Nivel 3 para el Diploma 'Docente IA Transformadora'",
  },
  3: {
    tier: 3,
    name: 'Docente IA Transformadora',
    icon: '🌲',
    metal: 'Oro',
    label: 'NIVELES I + II + III · 30 HORAS',
    subtitle: 'Liderazgo Pedagógico con IA',
    description:
      'Ha completado el camino completo de transformación docente, demostrando capacidad de liderazgo en la integración de IA en el aula IB y compromiso con elevar la práctica pedagógica del Liceo de Monterrey Redwood.',
    accentColor: '#C8972A',
    backgroundTint: '#FAF6E8',
    cornerMotif: 'laurel',
    nextTierHint: null,
  },
};

export function getDiplomaTheme(tier: DiplomaTier): DiplomaTheme {
  return DIPLOMA_THEMES[tier];
}
