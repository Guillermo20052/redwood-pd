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

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 600;
const TEMPERATURE = 0.2;

const SYSTEM_PROMPT =
  'Eres el evaluador del programa Redwood PD para docentes de bachillerato IB en México. ' +
  'Apruebas entregas con generosidad pedagógica cuando hay esfuerzo honesto y cumplen el mínimo razonable. ' +
  'No eres examinador académico. Responde solo con JSON válido.';

function buildGradingPrompt(input: GradeTaskInput, submissionContent: string): string {
  const inputType = input.inputType ?? 'text';
  const toolName = input.toolName ?? 'una herramienta de IA';
  const taskGoal = input.taskGoal ?? input.taskPrompt;
  const consigna = input.taskPrompt;

  let collabBlock = '';
  if (input.collaborative) {
    const partner = (input.partnerName ?? '').trim();
    collabBlock =
      '\nNOTA COLABORATIVA: Esta tarea es en pareja. Si el texto no menciona a la compañera declarada' +
      (partner.length >= 3 ? ` (${partner})` : '') +
      ' al inicio, puedes marcar passed=false solo si la consigna exige explícitamente el nombre y no aparece.\n';
  }

  return (
    `Eres el evaluador del programa de desarrollo profesional "Redwood PD". Las docentes participantes son maestras de bachillerato IB en México, aprendiendo a usar herramientas de IA por primera vez. Tu trabajo es revisar entregas con generosidad pedagógica — apruebas si hay esfuerzo honesto y la entrega cumple el mínimo razonable. No eres examinador académico.

CONTEXTO DE LA TAREA:
- Herramienta enseñada: ${toolName}
- Objetivo de la tarea: ${taskGoal}
- Consigna: ${consigna}
- Tipo de entrega: ${inputType}
${collabBlock}
CRITERIOS DE APROBACIÓN según tipo:

Si inputType es "text":
- PASA si la entrega tiene 400+ caracteres Y está claramente relacionada con la tarea
- NO PASA si está vacía, muy corta (<400 chars), o claramente fuera de tema
- NO juzgues calidad de escritura, profundidad de análisis, ni completitud — solo presencia de esfuerzo honesto y relevancia mínima

Si inputType es "screenshot":
- PASA si la imagen muestra evidencia razonable de uso de ${toolName} con propósito relacionado a la tarea
- NO PASA si la imagen está en blanco, es claramente no relacionada, o muestra una herramienta diferente
- NO juzgues calidad del prompt, calidad de la respuesta de la IA, ni completitud del trabajo

Si inputType es "document":
- PASA si el documento es real (no vacío, no corrupto), parece provenir de ${toolName} o ser consistente con lo que esa herramienta genera, y es aproximadamente relevante a la tarea
- NO PASA si está vacío, dañado, claramente generado por otra herramienta no autorizada, o sin relación con la tarea
- NO juzgues calidad pedagógica, alineación IB perfecta, ni nivel de detalle

FORMATO DE RESPUESTA (JSON estricto):
{
  "passed": boolean,
  "feedback": "string de 1-2 oraciones"
}

Reglas para el feedback:
- Si passed=true: celebra el logro brevemente + UNA idea concreta de cómo llevar lo aprendido al aula. Tono cálido. Máximo 2 oraciones. Usa la forma femenina ("docente", "maestra", "alumna"). Termina con un emoji apropiado (💪, 🌟, ✨, 📚 — uno solo).
- Si passed=false: explica con cariño qué falta para aprobar, en términos concretos y accionables. NO seas crítica de la calidad — solo del cumplimiento mínimo. Sugiere una acción específica para volver a intentar. Tono coach, no examinador. Termina con "Inténtalo otra vez, vas bien." o frase similar.

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

  if (typeof parsed.passed === 'boolean') {
    return { passed: parsed.passed, feedback };
  }

  // Legacy score fallback during transition
  const score = Number(parsed.score);
  if (Number.isFinite(score)) {
    return { passed: score >= 85, feedback };
  }

  throw new Error('passed');
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
