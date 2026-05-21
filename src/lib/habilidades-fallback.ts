/** Bullet lists when level-ancillary.generated.json skills.blocks have empty items. */
export const HABILIDADES_FALLBACK: Record<
  string,
  { teacher: string[]; students: string[] }
> = {
  b: {
    teacher: [
      'Domina el manejo básico de ChatGPT, Claude y Perplexity como copilotos diarios',
      'Aprende a verificar información generada por IA usando fuentes confiables',
      'Desarrolla criterio para reconocer cuándo la IA ayuda y cuándo es mejor el trabajo manual',
      'Construye su biblioteca personal de prompts efectivos para su materia',
      'Identifica los usos de IA que respetan el rigor IB y los que no',
    ],
    students: [
      'Aprenden a verificar fuentes con herramientas como Perplexity',
      'Reciben materiales mejor diferenciados gracias a Diffit',
      'Experimentan retroalimentación más específica y rápida',
      'Ven a su docente modelar pensamiento crítico sobre tecnología',
      'Desarrollan vocabulario alrededor del uso ético de IA',
    ],
  },
  i: {
    teacher: [
      'Integra NotebookLM y Canva para crear materiales personalizados desde sus propias fuentes',
      'Diseña presentaciones profesionales en minutos con Gamma',
      'Usa Brisk Teaching para retroalimentar trabajo de alumnas de forma sistemática',
      'Combina varias herramientas de IA en flujos de trabajo coherentes',
      'Mide el ahorro de tiempo y reinvierte en lo que la IA no puede hacer: relación humana',
    ],
    students: [
      'Acceden a recursos visuales más ricos que apoyan distintos estilos de aprendizaje',
      'Reciben guías de estudio personalizadas basadas en los materiales reales de su curso',
      'Ven cómo la diferenciación deja de ser un ideal y se vuelve práctica diaria',
      'Aprenden sobre productividad asistida por IA al ver el modelo de su docente',
      'Desarrollan expectativas más altas sobre la calidad de los materiales de clase',
    ],
  },
  a: {
    teacher: [
      'Crea experiencias de IA monitoreadas para sus alumnas con SchoolAI',
      'Genera recursos visuales sofisticados con Napkin AI',
      'Diseña narraciones de audio para accesibilidad usando ElevenLabs',
      'Lidera con criterio ético sobre cuándo y cómo las alumnas deben usar IA',
      'Se convierte en referente de innovación pedagógica con IA en su área',
    ],
    students: [
      'Interactúan con experiencias de IA cuidadosamente diseñadas por su docente',
      'Reciben contenido en múltiples formatos (texto, audio, visual) para máxima accesibilidad',
      'Aprenden a usar herramientas de IA con marcos éticos claros',
      'Desarrollan pensamiento crítico avanzado sobre los límites y poderes de la IA',
      'Se preparan para un mundo profesional donde la IA será omnipresente',
    ],
  },
};
