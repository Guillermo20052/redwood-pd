import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { EvaluationInput } from './local-db';
import { EVAL_Q9_OPTIONS, Q12_LABEL } from './evaluation';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.3;

export type EvaluationGradeResult = {
  score: number;
  feedback: string;
};

const SYSTEM_PROMPT =
  'Eres una coach pedagógica del programa Redwood PD para docentes de bachillerato IB en México. ' +
  'Calificas evaluaciones finales del programa con tono cálido y generoso. ' +
  'Responde solo con JSON válido.';

function formatEvaluationForPrompt(input: EvaluationInput): string {
  const q9Labels = input.q9_selections
    .map((k) => EVAL_Q9_OPTIONS.find((o) => o === k) ?? k)
    .join(', ');
  return `
Pregunta 1 (valor del programa 1-5): ${input.q1_value}
Pregunta 2 (AI-ready 1-5): ${input.q2_value}
Pregunta 3 (probabilidad de seguir usando IA 1-5): ${input.q3_value}
Nivel 1 más útil: ${input.q4_text}
Nivel 2 más útil: ${input.q5_text}
Nivel 3 (opcional): ${input.q6_text ?? '(no completó Nivel 3)'}
Duración del programa (1=muy larga, 5=muy corta, 3=adecuada): ${input.q7_value}
Calificación general del programa (0%=ineficiente, 100%=logró plenamente su propósito de hacerme más consciente del uso de IA como docente): ${input.q8_value}%
Partes que funcionaron mejor: ${q9Labels}
Implementación próximas 4 semanas: ${input.q10_text}
Sugerencias de mejora: ${input.q11_text ?? '(ninguna)'}
¿Recomendaría el programa?: ${Q12_LABEL[input.q12_value]}
`.trim();
}

function extractGradeJson(raw: string): EvaluationGradeResult {
  let text = raw.trim();
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  else {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) text = text.slice(start, end + 1);
  }
  const parsed = JSON.parse(text) as { score?: unknown; feedback?: unknown };
  const score = Math.round(Number(parsed.score));
  const feedback = String(parsed.feedback ?? '').trim();
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('score');
  if (!feedback) throw new Error('feedback');
  return { score, feedback };
}

/** Grade final program evaluation 0–100 with coaching tone (generous for genuine effort). */
export async function gradeEvaluation(input: EvaluationInput): Promise<EvaluationGradeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada.');
  }

  const userPrompt = `Evalúa esta evaluación final del programa Redwood PD.

CRITERIOS (en orden de importancia):
1. Completitud: ¿respondió todas las preguntas con sustancia?
2. Profundidad reflexiva: ¿hay ejemplos concretos de aula, no solo opiniones vagas?
3. Honestidad: ¿menciona retos, dudas o límites además de lo positivo?
4. NO penalices gramática, ortografía ni estilo literario.

RANGO DE PUNTAJE (sé generosa con esfuerzo genuino):
- 85-95: reflexión honesta con ejemplos concretos de su práctica IB
- 70-84: respuestas completas y útiles aunque breves
- 60-69: esfuerzo visible pero muy superficial en varias respuestas
- Menos de 60: SOLO si respuestas vacías, broma, copy-paste sin sentido o una sola palabra repetida

La mayoría de docentes que completaron el formulario con buena fe deben recibir 70-95.

FORMATO JSON:
{
  "score": number (0-100 entero),
  "feedback": "1-2 oraciones en español celebrando lo más fuerte de su reflexión y un tip breve. Tono coach cálido, forma femenina."
}

EVALUACIÓN DE LA DOCENTE:
${formatEvaluationForPrompt(input)}`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No se pudo procesar la evaluación.');
  }

  try {
    return extractGradeJson(textBlock.text);
  } catch {
    throw new Error('No se pudo procesar la evaluación.');
  }
}
