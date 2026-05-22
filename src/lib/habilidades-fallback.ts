/** IB ATL + Learner Profile bullets when level-ancillary skills.blocks items are empty. */
export const HABILIDADES_FALLBACK: Record<
  string,
  { teacher: string[]; students: string[] }
> = {
  b: {
    teacher: [
      'Pensamiento (ATL): evalúa críticamente cada respuesta de ChatGPT o Claude antes de usarla en clase — perfil IB Thinkers.',
      'Investigación (ATL): usa Perplexity con citas verificables para preparar unidades IB, no solo resultados sin fuente.',
      'Comunicación (ATL): redacta prompts claros y retroalimentación específica con MagicSchool — perfil Communicators.',
      'Autogestión (ATL): documenta prompts efectivos y reflexiona qué funcionó — perfil Reflective y principled.',
      'Sociales (ATL): modela uso ético de IA y normas de integridad académica IB con sus alumnas — perfil Principled.',
    ],
    students: [
      'Pensamiento (ATL): cuestionan resultados de IA y comparan con fuentes del currículum IB — desarrollan perfil Thinkers e Inquirers.',
      'Investigación (ATL): localizan y citan fuentes con herramientas como Perplexity en trabajos de indagación.',
      'Comunicación (ATL): reciben retroalimentación más clara y oportuna sobre borradores y ensayos IB.',
      'Autogestión (ATL): practican iterar prompts y registrar qué estrategias les funcionan — perfil Reflective.',
      'Sociales (ATL): debaten normas de uso de IA en el salón y acuerdan límites — perfil Principled y Open-minded.',
    ],
  },
  i: {
    teacher: [
      'Pensamiento (ATL): diseña flujos que combinan NotebookLM, Canva y Gamma con criterio pedagógico IB — Thinkers.',
      'Investigación (ATL): organiza fuentes propias del curso en NotebookLM para síntesis alineada a objetivos DP.',
      'Comunicación (ATL): produce materiales visuales y presentaciones coherentes con Canva y Gamma — Communicators.',
      'Autogestión (ATL): usa Brisk para ciclos de retroalimentación sostenibles sin agotarse — Reflective y Balanced.',
      'Sociales (ATL): colabora con colegas compartiendo plantillas y rúbricas IB generadas con IA — Caring y Open-minded.',
    ],
    students: [
      'Pensamiento (ATL): analizan infografías y presentaciones generadas con IA y proponen mejoras — Thinkers.',
      'Investigación (ATL): estudian con guías derivadas de los materiales reales del curso en NotebookLM.',
      'Comunicación (ATL): acceden a recursos visuales que apoyan distintos estilos de aprendizaje IB.',
      'Autogestión (ATL): reciben retroalimentación más rápida y planifican correcciones — Reflective.',
      'Sociales (ATL): participan en proyectos con briefs generados por IA que exigen discusión genuina — Collaborators.',
    ],
  },
  a: {
    teacher: [
      'Pensamiento (ATL): configura experiencias monitoreadas en SchoolAI con límites éticos claros — Thinkers y Principled.',
      'Investigación (ATL): usa Copilot y fuentes del curso para Extended Essay y proyectos de indagación IB.',
      'Comunicación (ATL): crea diagramas con Napkin y narraciones con ElevenLabs para accesibilidad — Communicators.',
      'Autogestión (ATL): lidera políticas de uso de IA en el departamento con reflexión documentada — Reflective.',
      'Sociales (ATL): facilita espacios donde alumnas debaten el impacto de la IA en su aprendizaje — Open-minded y Caring.',
    ],
    students: [
      'Pensamiento (ATL): interactúan con tutores IA bajo reglas explícitas y evalúan sesgos — Inquirers y Thinkers.',
      'Investigación (ATL): practican indagación con Khanmigo sin recibir respuestas completas de inmediato.',
      'Comunicación (ATL): consumen contenido en texto, audio y visual según su perfil de aprendizaje.',
      'Autogestión (ATL): reflexionan sobre cuándo la IA ayuda y cuándo debe trabajar solas — Reflective y Principled.',
      'Sociales (ATL): debaten dilemas éticos de IA en contextos IB globales — Open-minded y Knowledgeable.',
    ],
  },
};
