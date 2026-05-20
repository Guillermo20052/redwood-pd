import 'server-only';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import type { TaskInputType } from './curriculum-path';
import { detectMediaType, fileUrlToPath, readFileBase64 } from './upload-storage';

export type GradeResult = {
  score: number;
  feedback: string;
  passed: boolean;
};

export type GradeTaskInput = {
  inputType?: TaskInputType;
  taskPrompt: string;
  taskRubric?: string;
  evidenceText?: string;
  fileUrl?: string;
  filePath?: string;
  partTitle: string;
  level: string;
  collaborative?: boolean;
  partnerName?: string;
  /** Placeholder until per-task tool wiring (next prompt). */
  toolName?: string;
  taskGoal?: string;
};

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 600;
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

function buildTextUserPrompt(input: GradeTaskInput): string {
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
    `RÚBRICA DE EVALUACIÓN:\n${input.taskRubric ?? '(sin rúbrica)'}\n\n` +
    `EVIDENCIA ENTREGADA POR LA DOCENTE:\n"""\n${input.evidenceText ?? ''}\n"""\n\n` +
    `Responde EXCLUSIVAMENTE con un objeto JSON válido en este formato exacto, sin texto adicional:\n` +
    `{\n  "score": <número entero del 0 al 100>,\n  "feedback": "<2 o 3 oraciones en español>"\n}`
  );
}

function buildFileGradingPrompt(input: GradeTaskInput): string {
  const tool = input.toolName ?? 'una herramienta de IA';
  const goal = input.taskGoal ?? input.taskPrompt;
  return (
    `Esta es una entrega de una docente que aprende a usar ${tool} para ${goal}. ` +
    `Revisa el archivo adjunto y determina si muestra evidencia razonable de haber usado la herramienta ` +
    `para el propósito descrito.\n\n` +
    `CONSIGNA DE LA TAREA:\n${input.taskPrompt}\n\n` +
    `Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional:\n` +
    `{\n  "passed": <true o false>,\n  "feedback": "<2 o 3 oraciones en español>"\n}`
  );
}

function extractJson(raw: string): { score: number; feedback: string } {
  let text = raw.trim();

  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  } else {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
  }

  const parsed = JSON.parse(text) as {
    score?: unknown;
    feedback?: unknown;
    passed?: unknown;
  };
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('shape');
  }

  const feedback = String(parsed.feedback ?? '').trim();
  if (!feedback) {
    throw new Error('feedback');
  }

  if (typeof parsed.passed === 'boolean') {
    return { score: parsed.passed ? 100 : 0, feedback };
  }

  const score = Number(parsed.score);
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error('score');
  }
  return { score, feedback };
}

function resolveFilePath(input: GradeTaskInput): string {
  if (input.filePath && fs.existsSync(input.filePath)) {
    return input.filePath;
  }
  if (input.fileUrl) {
    const resolved = fileUrlToPath(input.fileUrl);
    if (resolved && fs.existsSync(resolved)) return resolved;
  }
  throw new Error('No se encontró el archivo subido. Vuelve a subirlo e intenta de nuevo.');
}

async function gradeTextSubmission(input: GradeTaskInput): Promise<GradeResult> {
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
    messages: [{ role: 'user', content: buildTextUserPrompt(input) }],
  });

  return parseMessageResponse(message);
}

async function gradeFileSubmission(input: GradeTaskInput): Promise<GradeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada. Agrega la clave en .env.local.');
  }

  const inputType = input.inputType;
  if (inputType !== 'screenshot' && inputType !== 'document') {
    throw new Error('Tipo de entrada de archivo inválido');
  }

  const filePath = resolveFilePath(input);
  const base64 = readFileBase64(filePath);
  const ext = filePath.toLowerCase();
  const mimeGuess = ext.endsWith('.pdf')
    ? 'application/pdf'
    : ext.endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';
  const mediaType = detectMediaType(mimeGuess, inputType);

  const client = new Anthropic({ apiKey });
  const textPrompt = buildFileGradingPrompt(input);

  const message =
    inputType === 'document'
      ? await client.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: textPrompt },
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64,
                  },
                },
              ],
            },
          ],
        })
      : await client.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: textPrompt },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType === 'image/png' ? 'image/png' : 'image/jpeg',
                    data: base64,
                  },
                },
              ],
            },
          ],
        });

  return parseMessageResponse(message);
}

function parseMessageResponse(message: Anthropic.Message): GradeResult {
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

/** Grade a task submission (text, screenshot, or document). */
export async function gradeTaskSubmission(input: GradeTaskInput): Promise<GradeResult> {
  const inputType = input.inputType ?? 'text';
  if (inputType === 'screenshot' || inputType === 'document') {
    return gradeFileSubmission(input);
  }
  return gradeTextSubmission(input);
}

/** @deprecated Use gradeTaskSubmission — kept for existing imports. */
export const gradeTask = gradeTaskSubmission;

export const TASK_PASSING_SCORE = PASSING_SCORE;
