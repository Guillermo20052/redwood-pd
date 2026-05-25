import 'server-only';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import type { TaskInputType } from './curriculum-path';
import { createAdminClient } from './supabase/admin';
import {
  SUPABASE_BUCKET,
  detectMediaType,
  fileUrlToPath,
  fileUrlToStoragePath,
  isSupabaseStorageMode,
  readFileBase64,
} from './upload-storage';

export type TaskGradeResult = {
  passed: boolean;
  feedback: string;
  characterCount?: number;
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
  toolName?: string;
  taskGoal?: string;
};

export const TEXT_GRADE_MIN_CHARS = 400;

/** Minimum score (0–100) to pass a task submission. Unchanged — only grader strictness increases. */
export const PASS_SCORE_THRESHOLD = 60;

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 600;
const TEMPERATURE = 0.2;

const SYSTEM_PROMPT =
  'Eres un evaluador pedagógico exigente del programa Redwood PD para docentes de bachillerato IB en México. ' +
  'Aplicas la rúbrica con rigor, como lo haría una educadora IB senior — buscas especificidad, ejemplos concretos del aula y pensamiento pedagógico real. ' +
  'Califica de forma conservadora (30-40% más exigente que un evaluador permisivo): el Diploma 3 debe sentirse ganado. ' +
  'Tu puntaje (score) es estricto; tu feedback escrito siempre es cálido, coach y accionable — nunca condescendiente ni punitivo. ' +
  'Responde solo con JSON válido.';

function buildGradingPrompt(input: GradeTaskInput, submissionContent: string): string {
  const inputType = input.inputType ?? 'text';
  const toolName = input.toolName ?? 'una herramienta de IA';
  const taskGoal = input.taskGoal ?? input.taskPrompt;
  const consigna = input.taskPrompt;
  const rubricBlock = input.taskRubric?.trim()
    ? `\nRÚBRICA DE LA TAREA:\n${input.taskRubric.trim()}\n`
    : '';

  let collabBlock = '';
  if (input.collaborative) {
    const partner = (input.partnerName ?? '').trim();
    collabBlock =
      '\nNOTA COLABORATIVA: Esta tarea es en pareja. Si la consigna exige mencionar a la compañera al inicio' +
      (partner.length >= 3 ? ` (${partner})` : '') +
      ' y no aparece, reduce el puntaje. La colaboración debe ser evidente en el contenido, no solo nominal.\n';
  }

  return (
    `Eres el evaluador del programa de desarrollo profesional "Redwood PD". Las docentes participantes son maestras de bachillerato IB en México, aprendiendo a usar herramientas de IA por primera vez.

Tu rol: evaluador pedagógico EXIGENTE. Aplicas la rúbrica estrictamente — como lo haría una educadora IB senior. Califica de forma conservadora (30-40% más exigente que evaluadores permisivos). El Diploma 3 debe sentirse ganado.

CONTEXTO DE LA TAREA:
- Herramienta enseñada: ${toolName}
- Objetivo de la tarea: ${taskGoal}
- Consigna: ${consigna}
- Tipo de entrega: ${inputType}
${rubricBlock}${collabBlock}
QUÉ BUSCAS (aplica la rúbrica estrictamente):
- Especificidad a la materia real de la docente (no genéricos "los estudiantes" o "el salón")
- Ejemplos concretos que ella usaría con SUS alumnas
- Evidencia de pensamiento pedagógico, no solo descripción de la herramienta
- Aplicación que demuestra comprensión, no solo resumen del prompt

PENALIZA con puntaje bajo (típicamente 30-55):
- Lenguaje vago ("podría ser útil", "herramienta interesante")
- Respuestas genéricas que servirían para cualquier docente
- Patrones de plantilla de IA (estructura uniforme, frases genéricas)
- Compromiso superficial sin profundidad pedagógica
- Falta de conexión concreta con la práctica docente

PREMIA con puntaje alto (típicamente 75-95):
- Integración específica a su área/materia
- Ejemplos concretos de aula
- Razonamiento pedagógico
- Pensamiento original que va más allá del prompt mínimo

CRITERIOS MÍNIMOS según tipo de entrega:

Si inputType es "text":
- Rechaza (score < ${PASS_SCORE_THRESHOLD}) si está vacía, muy corta (<400 chars), claramente fuera de tema, o genérica/superficial
- Aprueba (score >= ${PASS_SCORE_THRESHOLD}) solo si hay esfuerzo real, relevancia clara Y al menos un elemento concreto de aplicación pedagógica
- Trabajo excelente con integración específica: 85-95+. Trabajo sólido pero mejorable: 65-74. Genérico o apresurado: 30-55

Si inputType es "screenshot":
- Rechaza si la imagen está en blanco, no relacionada, o muestra otra herramienta
- Aprueba solo si hay evidencia clara de uso de ${toolName} con propósito pedagógico relacionado a la tarea — no basta una captura mínima sin contexto
- Sé exigente: capturas genéricas o sin relación con la consigna puntúan bajo

Si inputType es "document":
- Rechaza si está vacío, dañado, de otra herramienta no autorizada, o sin relación con la tarea
- Aprueba solo si el documento demuestra trabajo real aplicado a la consigna con relevancia pedagógica
- Documentos genéricos o claramente rellenados puntúan bajo

FORMATO DE RESPUESTA (JSON estricto):
{
  "score": number (0-100, entero),
  "feedback": "string de 1-2 oraciones"
}

Reglas para el feedback (tono SIEMPRE cálido y coach — independiente del puntaje):
- Si score >= ${PASS_SCORE_THRESHOLD}: celebra el logro brevemente + UNA idea concreta de cómo llevar lo aprendido al aula. Tono cálido. Máximo 2 oraciones. Usa la forma femenina ("docente", "maestra", "alumna"). Termina con un emoji apropiado (💪, 🌟, ✨, 📚 — uno solo).
- Si score < ${PASS_SCORE_THRESHOLD}: explica con cariño qué falta para fortalecer la entrega, en términos concretos y accionables. NO uses tono punitivo ni crítico — sé coach, no examinadora. Sugiere UNA acción específica para volver a intentar. Termina con "Inténtalo otra vez, vas bien." o frase similar.

LA ENTREGA DE LA DOCENTE:
${submissionContent}`
  );
}

function extractPassFailJson(raw: string): { passed: boolean; feedback: string } {
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
    passed?: unknown;
    feedback?: unknown;
    score?: unknown;
  };
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('shape');
  }

  const feedback = String(parsed.feedback ?? '').trim();
  if (!feedback) {
    throw new Error('feedback');
  }

  const score = Number(parsed.score);
  if (Number.isFinite(score)) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    return { passed: clamped >= PASS_SCORE_THRESHOLD, feedback };
  }

  if (typeof parsed.passed === 'boolean') {
    return { passed: parsed.passed, feedback };
  }

  throw new Error('score');
}

type FileBytes = {
  base64: string;
  /** Best-effort source extension (".png" / ".pdf" / ".jpg") for media-type guessing. */
  ext: string;
};

async function loadSubmissionBytes(input: GradeTaskInput): Promise<FileBytes> {
  // Prefer an explicit on-disk path when the caller has one (local mode flow).
  if (input.filePath && fs.existsSync(input.filePath)) {
    return {
      base64: readFileBase64(input.filePath),
      ext: input.filePath.toLowerCase(),
    };
  }

  if (input.fileUrl) {
    // Supabase Storage mode: download the object with the service-role client
    // so we don't need a user session here.
    if (isSupabaseStorageMode()) {
      const storagePath = fileUrlToStoragePath(input.fileUrl);
      if (storagePath) {
        const admin = createAdminClient();
        if (!admin) {
          throw new Error('Servidor mal configurado: falta SUPABASE_SERVICE_ROLE_KEY.');
        }
        const { data, error } = await admin.storage
          .from(SUPABASE_BUCKET)
          .download(storagePath);
        if (error || !data) {
          throw new Error(
            'No se encontró el archivo subido. Vuelve a subirlo e intenta de nuevo.'
          );
        }
        const arrayBuf = await data.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString('base64');
        return { base64, ext: storagePath.toLowerCase() };
      }
    }

    // Local mode fallback: resolve to a file on disk.
    const resolved = fileUrlToPath(input.fileUrl);
    if (resolved && fs.existsSync(resolved)) {
      return { base64: readFileBase64(resolved), ext: resolved.toLowerCase() };
    }
  }

  throw new Error('No se encontró el archivo subido. Vuelve a subirlo e intenta de nuevo.');
}

function shortCircuitTooShort(charCount: number): TaskGradeResult {
  return {
    passed: false,
    feedback: `Necesitas al menos ${TEXT_GRADE_MIN_CHARS} caracteres para mostrar tu reflexión. Llevas ${charCount}. Agrega más detalle sobre lo que aprendiste o probaste con la herramienta. Inténtalo otra vez, vas bien.`,
    characterCount: charCount,
  };
}

async function callClaude(
  input: GradeTaskInput,
  userContent: Anthropic.MessageCreateParams['messages'][0]['content']
): Promise<TaskGradeResult> {
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
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No se pudo procesar la respuesta del evaluador. Intenta de nuevo.');
  }

  try {
    const parsed = extractPassFailJson(textBlock.text);
    return { passed: parsed.passed, feedback: parsed.feedback };
  } catch {
    throw new Error('No se pudo procesar la respuesta del evaluador. Intenta de nuevo.');
  }
}

async function gradeTextSubmission(input: GradeTaskInput): Promise<TaskGradeResult> {
  const evidence = (input.evidenceText ?? '').trim();
  const charCount = evidence.length;

  if (charCount < TEXT_GRADE_MIN_CHARS) {
    return shortCircuitTooShort(charCount);
  }

  const prompt = buildGradingPrompt(
    { ...input, inputType: 'text' },
    `"""\n${evidence}\n"""\n\n(Conteo de caracteres: ${charCount})`
  );

  return callClaude(input, prompt);
}

async function gradeFileSubmission(input: GradeTaskInput): Promise<TaskGradeResult> {
  const inputType = input.inputType;
  if (inputType !== 'screenshot' && inputType !== 'document') {
    throw new Error('Tipo de entrada de archivo inválido');
  }

  const { base64, ext } = await loadSubmissionBytes(input);
  const mimeGuess = ext.endsWith('.pdf')
    ? 'application/pdf'
    : ext.endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';
  const mediaType = detectMediaType(mimeGuess, inputType);
  const textPrompt = buildGradingPrompt(input, '[Archivo adjunto en este mensaje]');

  const userContent =
    inputType === 'document'
      ? [
          { type: 'text' as const, text: textPrompt },
          {
            type: 'document' as const,
            source: {
              type: 'base64' as const,
              media_type: 'application/pdf' as const,
              data: base64,
            },
          },
        ]
      : [
          { type: 'text' as const, text: textPrompt },
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: (mediaType === 'image/png' ? 'image/png' : 'image/jpeg') as
                | 'image/png'
                | 'image/jpeg',
              data: base64,
            },
          },
        ];

  return callClaude(input, userContent);
}

/** Grade a task submission (text, screenshot, or document). */
export async function gradeTaskSubmission(input: GradeTaskInput): Promise<TaskGradeResult> {
  const inputType = input.inputType ?? 'text';
  if (inputType === 'screenshot' || inputType === 'document') {
    return gradeFileSubmission(input);
  }
  return gradeTextSubmission(input);
}

/** @deprecated Use gradeTaskSubmission — kept for existing imports. */
export const gradeTask = gradeTaskSubmission;

const REFLECTION_FEEDBACK_SYSTEM =
  'Eres una coach pedagógica de IA para docentes IB del Liceo Redwood. ' +
  'Genera retroalimentación breve (2-3 oraciones, máximo 250 caracteres) sobre la reflexión de esta docente. ' +
  'Tono cálido, en español, tuteando. Refiérete a algo específico que ella escribió. ' +
  'Sugiere UNA dirección concreta que podría explorar. Nunca seas crítica.';

export async function generateReflectionFeedback(
  reflectionPrompt: string,
  reflectionText: string
): Promise<string> {
  const client = new Anthropic();
  const userPrompt =
    `Pregunta de reflexión:\n${reflectionPrompt.trim() || '(sin prompt)'}\n\n` +
    `Respuesta de la docente:\n${reflectionText.trim()}\n\n` +
    'Escribe solo el texto de retroalimentación (sin JSON, sin comillas).';

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    temperature: 0.4,
    system: REFLECTION_FEEDBACK_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === 'text');
  const text = block && block.type === 'text' ? block.text.trim() : '';
  return text.slice(0, 250);
}
