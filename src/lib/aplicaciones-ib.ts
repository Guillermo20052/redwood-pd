/** IB-aligned Aplicaciones por Materia — 14 DP subjects per level with concrete use cases. */

export type IbSubjectApplication = {
  icon: string;
  name: string;
  example: string;
};

export const APLICACIONES_IB: Record<string, IbSubjectApplication[]> = {
  b: [
    {
      icon: '🎨',
      name: 'ARTE IB',
      example:
        'ChatGPT puede ayudarte a generar 5 propuestas de proyectos de investigación visual alineados al CAS y al Programa de Artes. También sirve para redactar borradores del Curatorial Rationale comparando intención, materialidad y conexión con artistas de referencia.',
    },
    {
      icon: '📖',
      name: 'ENGLISH IB',
      example:
        'Claude es excelente para revisar ensayos de Paper 2: sube el borrador y pide comentarios por criterio C (organización) y D (interpretación y evidencia textual) listos para pegar en ManageBac.',
    },
    {
      icon: '📐',
      name: 'MATH IB',
      example:
        'ChatGPT genera problemas contextualizados de funciones exponenciales o probabilidad con verbos de comando IB («determine», «justify») y solución desarrollada para practicar antes de una prueba formativa.',
    },
    {
      icon: '📚',
      name: 'LITERATURA IB',
      example:
        'Claude te ayuda a modelar análisis comparativo HL: sube dos obras del corpus y pide un esquema de tesis, evidencia textual y conectores académicos antes de que tus alumnas escriban el ensayo.',
    },
    {
      icon: '🌍',
      name: 'HISTORIA IB',
      example:
        'ChatGPT crea preguntas tipo Paper 2 con énfasis en causas estructurales, perspectivas y uso de evidencia — ideales para repaso de un tema del siglo XX antes del examen IB.',
    },
    {
      icon: '⚛️',
      name: 'FÍSICA IB',
      example:
        'Perplexity te permite verificar datos actuales sobre energías renovables o física de partículas con fuentes académicas citadas, perfecto para enriquecer una unidad de opciones del DP.',
    },
    {
      icon: '🧬',
      name: 'BIOLOGÍA IB',
      example:
        'Claude revisa borradores de informes de laboratorio por criterio (diseño, datos, análisis) con comentarios formativos que puedes adaptar para cada alumna sin reescribir el informe entero.',
    },
    {
      icon: '🇩🇪',
      name: 'ALEMÁN',
      example:
        'MagicSchool Assessment Builder genera rúbricas para producción oral o escrita en alemán con descriptores de fluidez, precisión gramatical y rango de vocabulario alineados al marco IB.',
    },
    {
      icon: '🇫🇷',
      name: 'FRANCÉS',
      example:
        'Diffit nivela un texto literario francés del corpus en tres versiones de lectura más preguntas de comprensión, para que todas practiquen Paper 1 con el mismo extracto base.',
    },
    {
      icon: '🇮🇹',
      name: 'ITALIANO',
      example:
        'ChatGPT propone guiones de role-play para la evaluación oral: situaciones cotidianas o temas del programa con preguntas de seguimiento graduadas por nivel B1/B2 del IB.',
    },
    {
      icon: '💼',
      name: 'BUSINESS IB',
      example:
        'Perplexity investiga casos empresariales recientes (decisiones estratégicas, ética corporativa) con fuentes verificables para alimentar un análisis tipo Paper 1 o el IA de Business Management.',
    },
    {
      icon: '🤔',
      name: 'FILOSOFÍA',
      example:
        'Claude es excelente para discutir argumentos opuestos sobre un dilema ético. Súbele un caso y pídele que tome dos posturas defendidas, perfecto para preparar exámenes de Paper 1.',
    },
    {
      icon: '✝️',
      name: 'RELIGIÓN (Inspirada por Opus Dei)',
      example:
        'Perplexity te permite verificar interpretaciones doctrinales con citas a fuentes confiables. Útil para preparar lecciones que respeten la inspiración Opus Dei del programa.',
    },
    {
      icon: '🧠',
      name: 'TOK',
      example:
        'ChatGPT genera mapas de conexiones entre Áreas de Conocimiento y preguntas de conocimiento («¿Cómo sabemos…?») a partir de un objeto o tema del exhibition, listos para taller socrático.',
    },
  ],
  i: [
    {
      icon: '🎨',
      name: 'ARTE IB',
      example:
        'Canva con IA maqueta un folleto digital de la exhibición con miniaturas, títulos y párrafos del Curatorial Rationale listo para revisión con tus alumnas antes de la entrega final.',
    },
    {
      icon: '📖',
      name: 'ENGLISH IB',
      example:
        'NotebookLM sube la novela en PDF, guía del profesor y apuntes de clase para generar preguntas socráticas por capítulo que alimenten seminarios de Language A antes del IO.',
    },
    {
      icon: '📐',
      name: 'MATH IB',
      example:
        'Gamma arma una presentación de 8 diapositivas sobre distribuciones de probabilidad con gráficos y preguntas de salida alineadas a Math AI HL, ideal para abrir una unidad nueva.',
    },
    {
      icon: '📚',
      name: 'LITERATURA IB',
      example:
        'Brisk Teaching retroalimenta en lote quince párrafos de análisis literario señalando evidencia textual, profundidad interpretativa y estructura PEEL sin repetir el mismo comentario genérico.',
    },
    {
      icon: '🌍',
      name: 'HISTORIA IB',
      example:
        'NotebookLM carga capítulos del libro, esquemas de clase y un documental transcrito para generar una línea de tiempo interactiva con preguntas de análisis causal tipo Paper 2.',
    },
    {
      icon: '⚛️',
      name: 'FÍSICA IB',
      example:
        'Canva diseña infografías de vectores, campos eléctricos o ondas con iconos y glosario lateral para repaso visual antes de una prueba formativa de Física IB.',
    },
    {
      icon: '🧬',
      name: 'BIOLOGÍA IB',
      example:
        'NotebookLM resume tus apuntes de unidad, el libro del tema y dos artículos PDF en preguntas de repaso para el examen de Biología SL sobre genética o ecología.',
    },
    {
      icon: '🇩🇪',
      name: 'ALEMÁN',
      example:
        'Gemini en Google Docs reformula retroalimentación de ensayos en alemán en tono alentador pero preciso, señalando errores de Kasus, Wortstellung y registro académico.',
    },
    {
      icon: '🇫🇷',
      name: 'FRANCÉS',
      example:
        'Gamma prepara diapositivas para modelar lectura de un discurso o editorial francés antes de la práctica de Paper 1, con preguntas guía sobre tono, registro y argumentación.',
    },
    {
      icon: '🇮🇹',
      name: 'ITALIANO',
      example:
        'Brisk Teaching comenta borradores de producción escrita en italiano destacando cohesión, conectores y precisión léxica según los criterios de evaluación del IB.',
    },
    {
      icon: '💼',
      name: 'BUSINESS IB',
      example:
        'Gemini en Sheets analiza datos de un caso de estudio (costos, márgenes, ROI) y explica cada paso en español claro para que tus alumnas redacten el análisis del IA.',
    },
    {
      icon: '🤔',
      name: 'FILOSOFÍA',
      example:
        'NotebookLM sube textos del programa (Platón, Rawls, etc.) y genera preguntas de contraste entre corrientes filosóficas para preparar el ensayo filosófico del DP.',
    },
    {
      icon: '✝️',
      name: 'RELIGIÓN (Inspirada por Opus Dei)',
      example:
        'Canva crea líneas de tiempo visuales de hitos bíblicos o de la historia de la Iglesia con espacio para reflexión personal, alineadas a unidades del programa de Religión.',
    },
    {
      icon: '🧠',
      name: 'TOK',
      example:
        'Gamma presenta un objeto del TOK exhibition con diapositivas que modelan cómo vincularlo a un tema opcional y a preguntas de conocimiento, sin caer en definiciones superficiales.',
    },
  ],
  a: [
    {
      icon: '🎨',
      name: 'ARTE IB',
      example:
        'Napkin AI mapea el proceso creativo de la alumna (investigación → experimentación → obra final) en un flujo visual claro para el Process Portfolio y la entrevista IB.',
    },
    {
      icon: '📖',
      name: 'ENGLISH IB',
      example:
        'ElevenLabs graba un audio modelo de análisis oral de un poema (tono, ritmo, imagen) para que tus alumnas comparen su propia IO con un ejemplo de referencia.',
    },
    {
      icon: '📐',
      name: 'MATH IB',
      example:
        'Khanmigo guía a alumnas en la Exploración IA paso a paso: elección de variables, justificación del método estadístico y redacción del análisis sin entregar la respuesta final.',
    },
    {
      icon: '📚',
      name: 'LITERATURA IB',
      example:
        'SchoolAI configura práctica de Paper 1 con extracto corto: alumnas reciben preguntas guía sin análisis completo y tú ves el historial de chat para evaluar comprensión.',
    },
    {
      icon: '🌍',
      name: 'HISTORIA IB',
      example:
        'SchoolAI crea un debate guiado sobre «¿fue justificada la bomba atómica?» con roles asignados y fuentes cortas precargadas, ideal para practicar argumentación histórica IB.',
    },
    {
      icon: '⚛️',
      name: 'FÍSICA IB',
      example:
        'Copilot Web interpreta tablas de resultados de laboratorio en Excel y sugiere gráficos, tendencias y redacción del párrafo de análisis para el informe de Física IB.',
    },
    {
      icon: '🧬',
      name: 'BIOLOGÍA IB',
      example:
        'Napkin AI diagrama el flujo de síntesis de proteínas (ADN→ARN→proteína) con iconos y flechas para repaso visual antes del examen de Biología IB.',
    },
    {
      icon: '🇩🇪',
      name: 'ALEMÁN',
      example:
        'ElevenLabs produce diálogos modelados en alemán para practicar comprensión auditiva y entonación antes de la evaluación oral del IB.',
    },
    {
      icon: '🇫🇷',
      name: 'FRANCÉS',
      example:
        'Khanmigo practica con alumnas la formulación de tesis literarias en francés que respondan al verso de comando sin caer en resumen de trama.',
    },
    {
      icon: '🇮🇹',
      name: 'ITALIANO',
      example:
        'SchoolAI ofrece un tutor de conversación en italiano con límites claros: solo preguntas guía, sin traducciones completas, con registro visible para el docente.',
    },
    {
      icon: '💼',
      name: 'BUSINESS IB',
      example:
        'Copilot Web organiza notas de investigación del IA en Word: esquema por secciones, citas pendientes y checklist de criterios A–E de Business Management.',
    },
    {
      icon: '🤔',
      name: 'FILOSOFÍA',
      example:
        'Khanmigo entrena a alumnas a formular tesis filosóficas con preguntas socráticas de seguimiento antes de escribir el ensayo del Paper 2.',
    },
    {
      icon: '✝️',
      name: 'RELIGIÓN (Inspirada por Opus Dei)',
      example:
        'ElevenLabs narra reflexiones guiadas sobre virtudes y vocación en tono contemplativo, útil para complementar lecturas del programa inspirado en Opus Dei.',
    },
    {
      icon: '🧠',
      name: 'TOK',
      example:
        'Napkin AI visualiza conexiones entre un tema opcional, tres objetos del exhibition y preguntas de conocimiento, ayudando a alumnas a planear el comentario de 950 palabras.',
    },
  ],
};

export function getAplicacionesIb(level: string): IbSubjectApplication[] {
  return APLICACIONES_IB[level] ?? [];
}
