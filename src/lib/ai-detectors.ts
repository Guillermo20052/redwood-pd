import aiDetectorsData from '@/content/ai-detectors.json';

export type PricingTier = 'free' | 'freemium' | 'paid';

export type AIDetectorEntry = {
  name: string;
  vendor: string;
  pricing: string;
  pricingTier: PricingTier;
  url: string;
  howItWorks: string;
  bestFor: string[];
  limitations: string[];
  accuracy: string;
};

export const AI_DETECTORS: AIDetectorEntry[] = aiDetectorsData as AIDetectorEntry[];

export const DETECTOR_WARNING = {
  title: 'Antes de usar cualquiera de estas herramientas',
  intro:
    'Estas 5 herramientas son útiles, pero NO son evidencia suficiente por sí solas para acusar a una alumna de plagio con IA. Considera lo siguiente:',
  documentedLimitations: [
    'Estudios independientes muestran 9-15% de falsos positivos en escritura legítima',
    'La Constitución de Estados Unidos, la Biblia y trabajos de Shakespeare han sido marcados como "generados por IA" por varios detectores',
    'Alumnas no-nativas del inglés son desproporcionadamente acusadas falsamente',
    'OpenAI cerró su propio detector en 2023 por baja confiabilidad',
    'Cualquier texto parafraseado o editado humanamente pasa la detección',
  ],
  insteadFramework: [
    {
      title: 'CONVERSACIÓN PRIMERO.',
      body: 'Pídele a la alumna que te explique su trabajo en sus propias palabras. ¿Puede defender las ideas? ¿Conoce las fuentes que citó?',
    },
    {
      title: 'EVIDENCIA DE PROCESO.',
      body: 'Pide ver el historial de versiones en Google Docs / Word. Pide los borradores anteriores. Pide los apuntes de investigación.',
    },
    {
      title: 'DETECTOR COMO UNA SEÑAL, NO COMO VEREDICTO.',
      body: 'Si el detector marca sospecha, úsalo como pretexto para la conversación (paso 1) — no como prueba.',
    },
    {
      title: 'PEDAGOGÍA SOBRE DISCIPLINA.',
      body: "La pregunta no es '¿usó IA?' sino '¿aprendió?'. Si la respuesta es no, replantear la actividad con tareas que requieran proceso visible: borradores, presentaciones orales, defensas en clase.",
    },
    {
      title: 'TRANSPARENCIA.',
      body: 'Define claramente con tus alumnas qué uso de IA es permitido y qué no. Una alumna que no sabía que NO podía usar Claude no está haciendo trampa — está confundida.',
    },
  ],
} as const;
