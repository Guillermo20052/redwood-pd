import type { SubjectCard } from './level-ancillary';

/** IB-aligned Aplicaciones por Materia — 5 DP subjects × 5 level tools each. */
export const APLICACIONES_IB: Record<string, SubjectCard[]> = {
  b: [
    {
      icon: '🧬',
      name: 'Biología IB',
      applications: [
        {
          title: 'ChatGPT',
          prompt:
            'Genera 10 preguntas de evaluación tipo Paper 1 sobre división celular, alineadas a los criterios A/B/C del IB SL, con verbos de comando IB y un nivel de dificultad creciente.',
        },
        {
          title: 'Claude',
          prompt:
            'Sube el borrador de un informe de laboratorio de fotosíntesis y pide retroalimentación por criterio (diseño, datos, análisis) con comentarios que puedas pegar en ManageBac.',
        },
        {
          title: 'Perplexity',
          prompt:
            'Investiga el estado actual de la edición genética CRISPR en medicina con al menos cinco fuentes académicas citadas para preparar un debate IB sobre ética en biotecnología.',
        },
        {
          title: 'MagicSchool',
          prompt:
            'Usa Assessment Builder para crear una rúbrica MYP/DP de 8 puntos para una indagación sobre ecosistemas locales, con descriptores para niveles 1–4 en Criterio B.',
        },
        {
          title: 'Diffit',
          prompt:
            'Nivela un artículo sobre el ciclo del carbono en tres lecturas (avanzada, intermedia, con apoyo) más preguntas de comprensión para diferenciar en la misma clase.',
        },
      ],
    },
    {
      icon: '📐',
      name: 'Matemáticas IB',
      applications: [
        {
          title: 'ChatGPT',
          prompt:
            'Pide cinco problemas contextualizados de funciones exponenciales (finanzas, crecimiento poblacional) con solución desarrollada y términos de comando tipo «determine» y «justify».',
        },
        {
          title: 'Claude',
          prompt:
            'Pega tres respuestas reales de alumnas a un problema de derivadas y solicita comentarios formativos distintos según el error conceptual (regla, interpretación, notación).',
        },
        {
          title: 'Perplexity',
          prompt:
            'Busca aplicaciones actuales de la teoría de juegos en economía o biología con fuentes verificables para enriquecer una unidad de modelización matemática IB.',
        },
        {
          title: 'MagicSchool',
          prompt:
            'Genera una lista de verificación para la Exploración IA: elección de tema, fuentes, método estadístico y criterios de evaluación interna.',
        },
        {
          title: 'Diffit',
          prompt:
            'Adapta un texto introductorio sobre probabilidad condicional para alumnas que necesitan apoyo léxico sin reducir el rigor de los conceptos matemáticos.',
        },
      ],
    },
    {
      icon: '🌍',
      name: 'Historia IB',
      applications: [
        {
          title: 'ChatGPT',
          prompt:
            'Crea tres preguntas Paper 2 sobre la Revolución Mexicana con énfasis en causas estructurales, perspectivas y uso de evidencia, listas para practicar en clase.',
        },
        {
          title: 'Claude',
          prompt:
            'Sube un ensayo de 800 palabras sobre la Guerra Fría y pide retroalimentación alineada a Criterio D (perspectiva, valor de las fuentes, conclusión).',
        },
        {
          title: 'Perplexity',
          prompt:
            'Localiza fuentes primarias y secundarias recientes sobre derechos humanos en América Latina con citas APA para una unidad de Historia del siglo XX.',
        },
        {
          title: 'MagicSchool',
          prompt:
            'Diseña una rúbrica para análisis de fuentes (OPVL) con descriptores claros para nivel inicial, intermedio y avanzado en Historia IB.',
        },
        {
          title: 'Diffit',
          prompt:
            'Nivela un capítulo breve sobre la independencia de México para lectura en clase con preguntas de comprensión por nivel de lectura.',
        },
      ],
    },
    {
      icon: '📖',
      name: 'Lengua y Literatura IB',
      applications: [
        {
          title: 'ChatGPT',
          prompt:
            'Genera preguntas de análisis literario sobre un poema del corpus (imagen, estructura, tono) preparadas para práctica de Paper 1 con tiempo sugerido.',
        },
        {
          title: 'Claude',
          prompt:
            'Sube un borrador de ensayo comparativo y pide comentarios por criterio C (organización, cohesión, registro) y D (interpretación, evidencia textual).',
        },
        {
          title: 'Perplexity',
          prompt:
            'Investiga el contexto histórico y crítico de la obra en estudio con fuentes académicas en español para enriquecer la Introducción del ensayo IB.',
        },
        {
          title: 'MagicSchool',
          prompt:
            'Crea una rúbrica para producción escrita oral (IO) con descriptores de fluidez, rango de vocabulario y profundidad analítica.',
        },
        {
          title: 'Diffit',
          prompt:
            'Adapta un fragmento narrativo largo en versiones simplificada e intermedia manteniendo metáforas clave para discusión en Literatura IB.',
        },
      ],
    },
    {
      icon: '🎨',
      name: 'Artes Visuales IB',
      applications: [
        {
          title: 'ChatGPT',
          prompt:
            'Redacta preguntas de crítica de obra para el proceso creativo: intención del artista, materialidad, relación con el tema del Curatorial Rationale.',
        },
        {
          title: 'Claude',
          prompt:
            'Pega el borrador del Curatorial Rationale y solicita retroalimentación sobre coherencia entre obras, vocabulario crítico y conexión con artistas de referencia.',
        },
        {
          title: 'Perplexity',
          prompt:
            'Busca referencias de artistas contemporáneos que trabajen con identidad y medio mixto, con fuentes de museos o revistas especializadas citadas.',
        },
        {
          title: 'MagicSchool',
          prompt:
            'Genera una rúbrica para el Comparative Study (CS) con criterios de análisis formal, contextual y calidad de las comparaciones visuales.',
        },
        {
          title: 'Diffit',
          prompt:
            'Nivela un texto crítico sobre arte conceptual para alumnas que preparan la investigación escrita del proceso IB.',
        },
      ],
    },
  ],
  i: [
    {
      icon: '🧬',
      name: 'Biología IB',
      applications: [
        {
          title: 'NotebookLM',
          prompt:
            'Sube tus apuntes de unidad, el libro del tema y dos artículos PDF; genera un resumen con preguntas de repaso para el examen de Biología SL sobre genética.',
        },
        {
          title: 'Canva',
          prompt:
            'Crea una infografía del ciclo de Krebs con iconos, flechas y glosario lateral para repasar antes de una prueba formativa IB.',
        },
        {
          title: 'Gemini',
          prompt:
            'En Google Docs, pide a Gemini que reformule la retroalimentación de un informe de laboratorio en tono alentador pero preciso para tres perfiles de alumna.',
        },
        {
          title: 'Brisk Teaching',
          prompt:
            'Pega diez párrafos de conclusiones de laboratorio y genera comentarios personalizados que citen el error específico y la siguiente acción.',
        },
        {
          title: 'Gamma',
          prompt:
            'Arma una presentación de 8 diapositivas sobre cambio climático y biodiversidad para abrir una indagación, con datos y preguntas provocadoras IB.',
        },
      ],
    },
    {
      icon: '📐',
      name: 'Matemáticas IB',
      applications: [
        {
          title: 'NotebookLM',
          prompt:
            'Carga guías de estudio y ejercicios resueltos de cálculo; pide un podcast de repaso de 5 minutos sobre regla de la cadena para estudio independiente.',
        },
        {
          title: 'Canva',
          prompt:
            'Diseña un póster visual de «errores frecuentes en integrales» con ejemplos corregidos para colgar en el salón de Matemáticas IB.',
        },
        {
          title: 'Gemini',
          prompt:
            'Usa Gemini en Sheets para proponer fórmulas que analicen resultados de una encuesta de proyecto estadístico y explique cada paso en español claro.',
        },
        {
          title: 'Brisk Teaching',
          prompt:
            'Retroalimenta en lote quince soluciones de problemas de vectores señalando si el error es algebraico, de representación o de interpretación física.',
        },
        {
          title: 'Gamma',
          prompt:
            'Prepara diapositivas para explicar distribuciones de probabilidad con gráficos y preguntas de salida alineadas a Math AI HL.',
        },
      ],
    },
    {
      icon: '🌍',
      name: 'Historia IB',
      applications: [
        {
          title: 'NotebookLM',
          prompt:
            'Sube capítulos del libro, esquemas de clase y un documental transcrito; genera una línea de tiempo interactiva con preguntas de análisis causal.',
        },
        {
          title: 'Canva',
          prompt:
            'Crea un mural visual de causas y consecuencias de la Primera Guerra Mundial para estación de repaso antes del Paper 2.',
        },
        {
          title: 'Gemini',
          prompt:
            'Resume y compara dos discursos históricos pegados en un Doc, destacando tono, audiencia y sesgo para análisis de fuentes.',
        },
        {
          title: 'Brisk Teaching',
          prompt:
            'Comenta diez respuestas cortas de análisis OPVL con frases listas para copiar en la rúbrica formativa de Historia IB.',
        },
        {
          title: 'Gamma',
          prompt:
            'Presenta un caso de estudio de derechos civiles con mapas, citas y pregunta final tipo «to what extent» del IB.',
        },
      ],
    },
    {
      icon: '📖',
      name: 'Lengua y Literatura IB',
      applications: [
        {
          title: 'NotebookLM',
          prompt:
            'Sube la novela en PDF, guía del profesor y apuntes de clase; genera preguntas socráticas por capítulo para seminario IB.',
        },
        {
          title: 'Canva',
          prompt:
            'Diseña una línea de tiempo visual de la trama y temas principales de la obra en estudio para alumnas visuales.',
        },
        {
          title: 'Gemini',
          prompt:
            'Mejora borradores de ensayo en Google Docs: cohesión entre párrafos, conectores académicos y precisión del registro formal.',
        },
        {
          title: 'Brisk Teaching',
          prompt:
            'Retroalimenta quince párrafos de análisis literario señalando evidencia textual, profundidad interpretativa y estructura PEEL.',
        },
        {
          title: 'Gamma',
          prompt:
            'Arma una presentación para modelar cómo leer un texto no literario (discurso, editorial) antes de la práctica de Paper 1.',
        },
      ],
    },
    {
      icon: '🎨',
      name: 'Artes Visuales IB',
      applications: [
        {
          title: 'NotebookLM',
          prompt:
            'Sube imágenes de obras de referencia, notas del proceso y criterios IB; genera preguntas para la entrevista del Process Portfolio.',
        },
        {
          title: 'Canva',
          prompt:
            'Maqueta un folleto digital del exhibition con miniaturas, títulos y párrafos del Curatorial Rationale listo para revisión con alumnas.',
        },
        {
          title: 'Gemini',
          prompt:
            'Redacta correos a familias explicando el proyecto de exhibición IB, fechas de entrega y criterios de evaluación en tono claro y profesional.',
        },
        {
          title: 'Brisk Teaching',
          prompt:
            'Comenta borradores del Comparative Study destacando calidad de las comparaciones formales y contextual entre artistas.',
        },
        {
          title: 'Gamma',
          prompt:
            'Crea una presentación de artistas de referencia con obras, técnicas y preguntas de análisis para taller de crítica en clase.',
        },
      ],
    },
  ],
  a: [
    {
      icon: '🧬',
      name: 'Biología IB',
      applications: [
        {
          title: 'Napkin AI',
          prompt:
            'Diagrama el flujo de síntesis de proteínas (ADN→ARN→proteína) con iconos y flechas para repaso visual antes del examen de Biología IB.',
        },
        {
          title: 'Copilot Web',
          prompt:
            'Pega una tabla de resultados de laboratorio en Excel y pide a Copilot gráficos sugeridos, tendencias y redacción de párrafo de análisis para el informe IB.',
        },
        {
          title: 'SchoolAI',
          prompt:
            'Configura un space donde alumnas practiquen preguntas de definición de NdC sobre biotecnología con respuestas limitadas y monitoreo del docente.',
        },
        {
          title: 'Khanmigo',
          prompt:
            'Modela una sesión de tutoría socrática sobre equilibrio ácido-base para que alumnas practiquen sin recibir la respuesta final de inmediato.',
        },
        {
          title: 'ElevenLabs',
          prompt:
            'Genera un audio de 2 min que explique la selección natural con analogía clara para alumnas que aprenden mejor por oído.',
        },
      ],
    },
    {
      icon: '📐',
      name: 'Matemáticas IB',
      applications: [
        {
          title: 'Napkin AI',
          prompt:
            'Crea un mapa conceptual que conecte derivadas, integrales y aplicaciones en física para repaso integral de Math AA HL.',
        },
        {
          title: 'Copilot Web',
          prompt:
            'Usa Copilot para interpretar una hoja de cálculo de datos de encuesta del proyecto IA y redactar el párrafo de «analysis» del reporte.',
        },
        {
          title: 'SchoolAI',
          prompt:
            'Diseña un tutor de repaso de probabilidad con límites: solo preguntas guía, sin soluciones completas, registro visible para el docente.',
        },
        {
          title: 'Khanmigo',
          prompt:
            'Prepara alumnas para la Exploración con Khanmigo practicando elección de variables y justificación del método estadístico paso a paso.',
        },
        {
          title: 'ElevenLabs',
          prompt:
            "Produce un podcast breve que explique la regla de L'Hôpital con ejemplos narrados para estudio independiente.",
        },
      ],
    },
    {
      icon: '🌍',
      name: 'Historia IB',
      applications: [
        {
          title: 'Napkin AI',
          prompt:
            'Visualiza causas y efectos de la Guerra Fría en un diagrama de cadena para discusión comparada con conflictos actuales.',
        },
        {
          title: 'Copilot Web',
          prompt:
            'Organiza notas de investigación del Extended Essay en Word: esquema por secciones, citas pendientes y checklist de criterios IB.',
        },
        {
          title: 'SchoolAI',
          prompt:
            'Crea un debate guiado sobre «¿fue justificada la bomba atómica?» con roles asignados y fuentes cortas precargadas en el space.',
        },
        {
          title: 'Khanmigo',
          prompt:
            'Entrena alumnas a formular tesis «to what extent» con preguntas de seguimiento antes de escribir el ensayo de Historia IB.',
        },
        {
          title: 'ElevenLabs',
          prompt:
            'Narra un audio-tour de 3 min sobre un sitio histórico local como modelo para el proyecto de investigación histórica.',
        },
      ],
    },
    {
      icon: '📖',
      name: 'Lengua y Literatura IB',
      applications: [
        {
          title: 'Napkin AI',
          prompt:
            'Diagrama la estructura narrativa de la obra (nudo, clímax, resolución) y temas paralelos para planear el ensayo comparativo IB.',
        },
        {
          title: 'Copilot Web',
          prompt:
            'Revisa en Word el borrador del IO: tiempo de palabras, conectores académicos y balance entre obra y texto no literario.',
        },
        {
          title: 'SchoolAI',
          prompt:
            'Configura práctica de Paper 1 con extracto corto: alumnas reciben preguntas guía sin análisis completo, tú ves el historial de chat.',
        },
        {
          title: 'Khanmigo',
          prompt:
            'Practica con alumnas la formulación de tesis literarias que respondan al verso de comando sin caer en resumen plot.',
        },
        {
          title: 'ElevenLabs',
          prompt:
            'Graba un audio modelo de análisis oral de un poema (tono, ritmo, imagen) para que alumnas comparen con su propia IO.',
        },
      ],
    },
    {
      icon: '🎨',
      name: 'Artes Visuales IB',
      applications: [
        {
          title: 'Napkin AI',
          prompt:
            'Mapea el proceso creativo de la alumna (investigación→experimentación→obra final) en un flujo visual para el Process Portfolio.',
        },
        {
          title: 'Copilot Web',
          prompt:
            'Redacta el informe trimestral al departamento de artes sobre avances del programa IB con datos de entregas y ejemplos de obras.',
        },
        {
          title: 'SchoolAI',
          prompt:
            'Crea un space de crítica entre pares donde alumnas describen la obra de una compañera con preguntas obligatorias de formal y conceptual.',
        },
        {
          title: 'Khanmigo',
          prompt:
            'Guía a alumnas para redactar el Comparative Study comparando dos artistas con vocabulario crítico preciso (materialidad, composición, contexto).',
        },
        {
          title: 'ElevenLabs',
          prompt:
            'Produce la narración del audio-guía de la exhibición para visitantes, alineada al Curatorial Rationale IB.',
        },
      ],
    },
  ],
};

export function getAplicacionesIb(level: string): SubjectCard[] {
  return APLICACIONES_IB[level] ?? [];
}
