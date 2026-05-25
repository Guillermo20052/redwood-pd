import 'server-only';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages/messages';
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

/** Mandatory Diffit task (Nivel 1 Parte 5) — uses lenient "did you try" grading only. */
export const DIFFIT_TASK_ID = 'lvl-b-p5-task';

export type GradeTaskInput = {
  /** Curriculum itemKey; routes lvl-b-p5-task to the lenient Diffit grader. */
  taskId?: string;
  inputType?: TaskInputType;
  taskPrompt: string;
  taskRubric?: string;
  evidenceText?: string;
  fileUrl?: string;
  /** Multiple files for tasks with maxFiles > 1 (e.g. Diffit). */
  fileUrls?: string[];
  filePath?: string;
  filePaths?: string[];
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
  'Eres un evaluador pedagógico exigente del programa Redwood PD para docentes de bachillerato en México. ' +
  'Aplicas la rúbrica con rigor: buscas especificidad, ejemplos concretos del contexto real de la docente y pensamiento pedagógico auténtico. ' +
  'Califica de forma conservadora (30-40% más exigente que un evaluador permisivo): el Diploma 3 debe sentirse ganado. ' +
  'La docente puede enmarcar su trabajo en IB o en su rol real (preceptoría, formación religiosa, apoyo, etc.) — evalúa la calidad pedagógica en SU contexto, no exijas marco IB si su rol no lo es. ' +
  'Tu puntaje (score) es estricto; tu feedback escrito siempre es cálido, coach y accionable — nunca condescendiente ni punitivo. ' +
  'Responde solo con JSON válido.';

const DIFFIT_LENIENT_SYSTEM_PROMPT =
  'Eres evaluador del programa Redwood PD. Esta entrega es la tarea de exploración con Diffit (Nivel 1 Parte 5): ' +
  'el objetivo es que la docente experimente la herramienta, no que produzca contenido perfeccionado. ' +
  'Aprueba con generosidad cualquier evidencia de intento educativo genuino. ' +
  'Responde solo con JSON válido.';

function isDiffitLenientTask(input: GradeTaskInput): boolean {
  return input.taskId === DIFFIT_TASK_ID;
}

function buildDiffitLenientGradingPrompt(
  input: GradeTaskInput,
  submissionContent: string,
  multiFile = false
): string {
  const inputType = input.inputType ?? 'document';
  const multiFileBlock = multiFile
    ? '\nLa docente envió múltiples archivos. Evalúa la entrega completa: aprueba si al menos UN archivo cumple los criterios de aprobación.\n'
    : '';

  return (
    `Esta es una tarea de exploración con Diffit (Nivel 1 Parte 5). El objetivo es que la docente experimente la herramienta, no que produzca contenido perfeccionado.
${multiFileBlock}
Aprueba (score 70-85) cualquier entrega que muestre:
- Documento(s) generados con Diffit (niveles de lectura, materiales adaptados)
- Material de lectura nivelado (distintos niveles de dificultad para el mismo texto o tema)
- Material educativo de cualquier tipo (lecciones, lecturas, hojas de trabajo, recursos de aula)
- Contenido pedagógico para alumnas (IB o cualquier otro contexto docente)

Reprueba (score < 60) solo si:
- El contenido es completamente ajeno a educación (foto personal, documento de negocios, archivo aleatorio)
- La entrega está vacía, ilegible o dañada
- Claramente fuera de tema sin relación con enseñanza ni con Diffit

Tipo de entrega: ${inputType}

Da feedback normal y cálido — sin elogios excesivos ("¡Excelente trabajo!", "¡Increíble!"), sin mencionar que esta tarea es más permisiva. Trata la entrega con respeto pedagógico estándar, como en cualquier otra tarea del programa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "score": number (0-100, entero),
  "feedback": "string de 1-2 oraciones"
}

Reglas para el feedback:
- Si score >= ${PASS_SCORE_THRESHOLD}: feedback breve y cálido con UNA sugerencia concreta opcional para seguir explorando Diffit. Tono normal de coach, no celebración exagerada. Máximo 2 oraciones. Forma femenina ("docente", "maestra", "alumna"). Sin emoji obligatorio.
- Si score < ${PASS_SCORE_THRESHOLD}: explica con cariño qué falta (contenido vacío o claramente ajeno a educación). Sugiere volver a intentar con material generado en Diffit o un recurso pedagógico. Termina con "Inténtalo otra vez, vas bien." o similar.

LA ENTREGA DE LA DOCENTE:
${submissionContent}`
  );
}

function buildGradingPrompt(
  input: GradeTaskInput,
  submissionContent: string,
  multiFile = false
): string {
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
    `Eres el evaluador del programa de desarrollo profesional "Redwood PD". Las docentes participantes son maestras de bachillerato en México (IB y roles no-IB: preceptoría, formación religiosa, apoyo, materias académicas, etc.), aprendiendo a usar herramientas de IA por primera vez.
${multiFile ? '\nLa docente envió múltiples archivos. Evalúa la tarea considerando todos los archivos juntos como una sola entrega.\n' : ''}
Tu rol: evaluador pedagógico EXIGENTE. Aplicas la rúbrica estrictamente. Califica de forma conservadora (30-40% más exigente que evaluadores permisivos). El Diploma 3 debe sentirse ganado.

CONTEXTO DE LA DOCENTE (adapta tu evaluación):
La docente puede o no trabajar en un rol IB. Adapta tu evaluación a su realidad docente real:
- Si enmarca su trabajo en contexto IB → evalúa calidad pedagógica IB
- Si enmarca su trabajo para preceptoría, espacios formativos, formación religiosa, materias académicas no-IB u otro contexto educativo → evalúa calidad pedagógica para ESE contexto con igual rigor
- Ambos enfoques son válidos. NO penalices a una docente por no enmarcar su trabajo como IB si su rol no lo es
- SÍ penaliza: respuestas genéricas, lenguaje vago, falta de ejemplos concretos, compromiso superficial, patrones de plantilla de IA
- SÍ premia: aplicación específica a sus alumnas/rol real, ejemplos concretos de aula o espacio formativo, razonamiento pedagógico

CONTEXTO DE LA TAREA:
- Herramienta enseñada: ${toolName}
- Objetivo de la tarea: ${taskGoal}
- Consigna: ${consigna}
- Tipo de entrega: ${inputType}
${rubricBlock}${collabBlock}
QUÉ BUSCAS (aplica la rúbrica estrictamente, en el contexto que la docente elija):
- Especificidad a su rol/materia real (no genéricos "los estudiantes" o "el salón")
- Ejemplos concretos que ella usaría con SUS alumnas en su contexto (aula, preceptoría, formación, etc.)
- Evidencia de pensamiento pedagógico, no solo descripción de la herramienta
- Aplicación que demuestra comprensión, no solo resumen del prompt

PENALIZA con puntaje bajo (típicamente 30-55):
- Lenguaje vago ("podría ser útil", "herramienta interesante")
- Respuestas genéricas que servirían para cualquier docente
- Patrones de plantilla de IA (estructura uniforme, frases genéricas)
- Compromiso superficial sin profundidad pedagógica
- Falta de conexión concreta con su práctica docente real
- Exigir marco IB cuando la docente claramente trabaja en otro contexto

PREMIA con puntaje alto (típicamente 75-95):
- Integración específica a su área, rol o materia (IB o no-IB)
- Ejemplos concretos de aula o espacio formativo
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
- Si score >= ${PASS_SCORE_THRESHOLD}: celebra el logro brevemente + UNA idea concreta de cómo llevar lo aprendido a su contexto (aula, preceptoría, formación, etc.). Tono cálido. Máximo 2 oraciones. Usa la forma femenina ("docente", "maestra", "alumna"). No exijas marco IB en el feedback si ella trabajó en otro contexto. Termina con un emoji apropiado (💪, 🌟, ✨, 📚 — uno solo).
- Si score < ${PASS_SCORE_THRESHOLD}: explica con cariño qué falta para fortalecer la entrega, en términos concretos y accionables. NO uses tono punitivo ni crítico — sé coach, no examinadora. Sugiere UNA acción específica para volver a intentar (adaptada a su contexto, no exijas IB). Termina con "Inténtalo otra vez, vas bien." o frase similar.

LA ENTREGA DE LA DOCENTE:
${submissionContent}`
  );
}

function resolveGradingPrompt(
  input: GradeTaskInput,
  submissionContent: string,
  multiFile = false
): { prompt: string; systemPrompt: string } {
  if (isDiffitLenientTask(input)) {
    return {
      prompt: buildDiffitLenientGradingPrompt(input, submissionContent, multiFile),
      systemPrompt: DIFFIT_LENIENT_SYSTEM_PROMPT,
    };
  }
  return {
    prompt: buildGradingPrompt(input, submissionContent, multiFile),
    systemPrompt: SYSTEM_PROMPT,
  };
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

async function loadSubmissionBytesFromUrl(
  fileUrl: string,
  filePath?: string
): Promise<FileBytes> {
  if (filePath && fs.existsSync(filePath)) {
    return {
      base64: readFileBase64(filePath),
      ext: filePath.toLowerCase(),
    };
  }

  if (isSupabaseStorageMode()) {
    const storagePath = fileUrlToStoragePath(fileUrl);
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

  const resolved = fileUrlToPath(fileUrl);
  if (resolved && fs.existsSync(resolved)) {
    return { base64: readFileBase64(resolved), ext: resolved.toLowerCase() };
  }

  throw new Error('No se encontró el archivo subido. Vuelve a subirlo e intenta de nuevo.');
}

function resolveSubmissionFileUrls(input: GradeTaskInput): string[] {
  if (input.fileUrls && input.fileUrls.length > 0) {
    return input.fileUrls;
  }
  if (input.fileUrl) return [input.fileUrl];
  return [];
}

function isPdfBytes(ext: string): boolean {
  return ext.endsWith('.pdf');
}

function buildFileContentBlock(
  file: FileBytes,
  inputType: 'screenshot' | 'document'
): ContentBlockParam {
  const mimeGuess = isPdfBytes(file.ext)
    ? 'application/pdf'
    : file.ext.endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';
  const mediaType = detectMediaType(mimeGuess, inputType);

  if (mediaType === 'application/pdf' || isPdfBytes(file.ext)) {
    return {
      type: 'document' as const,
      source: {
        type: 'base64' as const,
        media_type: 'application/pdf' as const,
        data: file.base64,
      },
    };
  }

  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: (mediaType === 'image/png' ? 'image/png' : 'image/jpeg') as
        | 'image/png'
        | 'image/jpeg',
      data: file.base64,
    },
  };
}

function shortCircuitTooShort(charCount: number): TaskGradeResult {
  return {
    passed: false,
    feedback: `Necesitas al menos ${TEXT_GRADE_MIN_CHARS} caracteres para mostrar tu reflexión. Llevas ${charCount}. Agrega más detalle sobre lo que aprendiste o probaste con la herramienta. Inténtalo otra vez, vas bien.`,
    characterCount: charCount,
  };
}

async function callClaude(
  userContent: Anthropic.MessageCreateParams['messages'][0]['content'],
  systemPrompt: string
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
    system: systemPrompt,
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

  const { prompt, systemPrompt } = resolveGradingPrompt(
    { ...input, inputType: 'text' },
    `"""\n${evidence}\n"""\n\n(Conteo de caracteres: ${charCount})`
  );

  return callClaude(prompt, systemPrompt);
}

async function gradeFileSubmission(input: GradeTaskInput): Promise<TaskGradeResult> {
  const inputType = input.inputType;
  if (inputType !== 'screenshot' && inputType !== 'document') {
    throw new Error('Tipo de entrada de archivo inválido');
  }

  const urls = resolveSubmissionFileUrls(input);
  if (urls.length === 0) {
    throw new Error('No se encontró el archivo subido. Vuelve a subirlo e intenta de nuevo.');
  }

  const paths = input.filePaths ?? (input.filePath ? [input.filePath] : []);
  const files = await Promise.all(
    urls.map((url, i) => loadSubmissionBytesFromUrl(url, paths[i]))
  );

  const multiFile = files.length > 1;
  const submissionLabel = multiFile
    ? `[${files.length} archivos adjuntos — evalúalos juntos como una sola entrega]`
    : '[Archivo adjunto en este mensaje]';
  const { prompt: textPrompt, systemPrompt } = resolveGradingPrompt(
    input,
    submissionLabel,
    multiFile
  );

  const userContent: ContentBlockParam[] = [
    { type: 'text', text: textPrompt },
    ...files.map((file) => buildFileContentBlock(file, inputType)),
  ];

  return callClaude(userContent, systemPrompt);
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
