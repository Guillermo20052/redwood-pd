/** IB ATL + Learner Profile bullets when level-ancillary skills.blocks items are empty. */
export const HABILIDADES_FALLBACK: Record<
  string,
  { teacher: string[]; students: string[] }
> = {
  b: {
    teacher: [
      'Verifica información generada por IA usando fuentes confiables — alineado con Investigación (ATL) y atributo Indagador.',
      'Redacta prompts claros y retroalimentación específica con MagicSchool — alineado con Comunicación (ATL) y atributo Comunicador.',
      'Evalúa críticamente cada respuesta de ChatGPT o Claude antes de usarla en clase — alineado con Pensamiento (ATL) y atributo Reflexivo.',
      'Documenta prompts efectivos y reflexiona qué funcionó en tu práctica — alineado con Autogestión (ATL) y atributo Reflexivo.',
      'Modela uso ético de IA y normas de integridad académica IB con tus alumnas — alineado con Sociales (ATL) y atributo Íntegro.',
    ],
    students: [
      'Cuestionan resultados de IA y comparan con fuentes del currículum IB DP — alineado con Pensamiento (ATL) y atributo Indagador.',
      'Localizan y citan fuentes con herramientas como Perplexity en trabajos de indagación — alineado con Investigación (ATL).',
      'Reciben retroalimentación más clara y oportuna sobre borradores y ensayos IB — alineado con Comunicación (ATL).',
      'Practican iterar prompts y registrar qué estrategias les funcionan — alineado con Autogestión (ATL) y atributo Reflexivo.',
      'Debaten normas de uso de IA en el salón y acuerdan límites — alineado con Sociales (ATL) y atributo Mentalidad abierta.',
    ],
  },
  i: {
    teacher: [
      'Diseña actividades diferenciadas para distintos niveles de lectura en prepa IB — alineado con Pensamiento (ATL) y atributo Reflexivo.',
      'Organiza fuentes propias del curso en NotebookLM para síntesis alineada a objetivos DP — alineado con Investigación (ATL).',
      'Produce materiales visuales y presentaciones coherentes con Canva y Gamma — alineado con Comunicación (ATL).',
      'Usa Brisk para ciclos de retroalimentación sostenibles sin agotarse — alineado con Autogestión (ATL) y atributo Equilibrado.',
      'Colabora con colegas compartiendo plantillas y rúbricas IB generadas con IA — alineado con Sociales (ATL) y atributo Solidario.',
    ],
    students: [
      'Analizan infografías y presentaciones generadas con IA y proponen mejoras — alineado con Pensamiento (ATL).',
      'Estudian con guías derivadas de los materiales reales del curso en NotebookLM — alineado con Investigación (ATL).',
      'Acceden a resultados visuales que apoyan distintos estilos de aprendizaje — alineado con Comunicación (ATL).',
      'Reciben retroalimentación más rápida y planifican correcciones — alineado con Autogestión (ATL) y atributo Reflexivo.',
      'Participan en proyectos con briefs generados por IA que exigen discusión genuina — alineado con Sociales (ATL) y atributo Colaborador.',
    ],
  },
  a: {
    teacher: [
      'Configura experiencias monitoreadas en SchoolAI con límites éticos claros para prepa — alineado con Pensamiento (ATL) y atributo Íntegro.',
      'Usa Copilot y fuentes del curso para Extended Essay y proyectos de indagación IB — alineado con Investigación (ATL).',
      'Crea diagramas con Napkin y narraciones con ElevenLabs para accesibilidad — alineado con Comunicación (ATL).',
      'Lidera políticas de uso de IA en el departamento con reflexión documentada — alineado con Autogestión (ATL) y atributo Reflexivo.',
      'Facilita espacios donde alumnas debaten el impacto de la IA en su aprendizaje — alineado con Sociales (ATL) y atributo Mentalidad abierta.',
    ],
    students: [
      'Interactúan con tutores IA bajo reglas explícitas y evalúan sesgos — alineado con Pensamiento (ATL) y atributo Indagador.',
      'Practican indagación con Khanmigo sin recibir respuestas completas de inmediato — alineado con Investigación (ATL).',
      'Consumen contenido en texto, audio y visual según su perfil de aprendizaje — alineado con Comunicación (ATL).',
      'Reflexionan sobre cuándo la IA ayuda y cuándo deben trabajar solas — alineado con Autogestión (ATL) y atributo Íntegro.',
      'Debaten dilemas éticos de IA en contextos IB globales — alineado con Sociales (ATL) y atributo Informado.',
    ],
  },
};
