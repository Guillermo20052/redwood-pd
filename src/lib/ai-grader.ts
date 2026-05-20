import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

export type GradeResult = {
  score: number;
  feedback: string;
  passed: boolean;
};

export type GradeTaskInput = {
  taskPrompt: string;
  taskRubric: string;
  evidenceText: string;
  partTitle: string;
  level: string;
  collaborative?: boolean;
  /**
   * Name of the partner the teacher declared in the UI before submitting.
   * Only meaningful when `collaborative` is true. When present, the grader is
   * told the exact expected name so it can verify it appears at the start of
   * the evidence text.
   */
  partnerName?: string;
};

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.2;
const PASSING_SCORE = 85;

const SYSTEM_PROMPT =
  'Eres un evaluador pedagógico experto del Liceo Redwood en Monterrey. ' +
  'Evalúas tareas de un programa de desarrollo profesional para docentes sobre el uso de IA en sus clases. ' +
  'Tu trabajo es leer la evidencia que entrega una docente y calificarla del 1 al 100 según la rúbrica provista. ' +
  'Después de la calificación, escribes 2 o 3 oraciones de retroalimentación constructiva, en español, ' +
  'dirigidas directamente a la docente con tono cálido pero honesto. No inventas elogios. ' +
  'Si el trabajo es flojo, lo dices con respeto. Si es excelente, lo afirmas. ' +
  'La docente puede reintentar sin límite, así que tu retroalimentación debe ayudarla a mejorar concretamente.';

function buildUserPrompt(input: GradeTaskInput): string {
  const declaredPartner = (input.partnerName ?? '').trim();
  let collabLine = '';
  if (input.collaborative) {
    collabLine =
      'TAREA COLABORATIVA: sí — la docente debió emparejarse con otra docente y debe incluir su nombre al inicio del texto.\n';
    if (declaredPartner.length >= 3) {
      collabLine +=
        `COMPAÑERA DECLARADA: ${declaredPartner} — verifica que este nombre aparezca al inicio del texto entregado.\n`;
    } else {
      collabLine +=
        'COMPAÑERA DECLARADA: (no declarada) — esta tarea es colaborativa pero la docente no declaró compañera. Penaliza fuerte.\n';
    }
    collabLine += '\n';
  }

  return (
    `NIVEL: ${input.level}\n` +
    `PARTE: ${input.partTitle}\n` +
    `${collabLine}` +
    `CONSIGNA DE LA TAREA:\n${input.taskPrompt}\n\n` +
    `RÚBRICA DE EVALUACIÓN:\n${input.taskRubric}\n\n` +
    `EVIDENCIA ENTREGADA POR LA DOCENTE:\n"""\n${input.evidenceText}\n"""\n\n` +
    `Responde EXCLUSIVAMENTE con un objeto JSON válido en este formato exacto, sin texto adicional:\n` +
    `{\n  "score": <número entero del 0 al 100>,\n  "feedback": "<2 o 3 oraciones en español>"\n}`
  );
}

function extractJson(raw: string): { score: number; feedback: string } {
  let text = raw.trim();

  // Strip Markdown code fences if present (```json ... ``` or ``` ... ```).
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  } else {
    // Fall back: find the first {...} block in the response.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
  }

  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('shape');
  }
  const score = Number(parsed.score);
  const feedback = String(parsed.feedback ?? '').trim();
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error('score');
  }
  if (!feedback) {
    throw new Error('feedback');
  }
  return { score, feedback };
}

export async function gradeTask(input: GradeTaskInput): Promise<GradeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada. Agrega la clave en .env.local.');
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(input),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No se pudo procesar la respuesta del evaluador. Intenta de nuevo.');
  }

  let parsed: { score: number; feedback: string };
  try {
    parsed = extractJson(textBlock.text);
  } catch {
    throw new Error('No se pudo procesar la respuesta del evaluador. Intenta de nuevo.');
  }

  return {
    score: parsed.score,
    feedback: parsed.feedback,
    passed: parsed.score >= PASSING_SCORE,
  };
}

export const TASK_PASSING_SCORE = PASSING_SCORE;
