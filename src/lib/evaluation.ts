import type { EvaluationInput, EvaluationQ12 } from './local-db';

/**
 * Shared validation rules for the program-final evaluation form.
 * Used both client-side (EvaluationForm) and server-side (API route) so the
 * two never drift.
 */

export const EVAL_TEXT_MIN_CHARS = 80;

export const EVAL_Q9_OPTIONS = [
  'Los videos',
  'Las tareas con IA',
  'Las reflexiones',
  'Las tareas colaborativas',
  'El chat de la comunidad',
  'Los diplomas',
  'Las rúbricas IB',
] as const;

export type EvalQ9Option = (typeof EVAL_Q9_OPTIONS)[number];

const Q9_SET = new Set<string>(EVAL_Q9_OPTIONS);
const Q12_VALUES = new Set<EvaluationQ12>(['yes', 'yes-with-reservations', 'no']);
const SCALE_KEYS = ['q1_value', 'q2_value', 'q3_value', 'q7_value'] as const;
const Q8_MIN = 0;
const Q8_MAX = 100;
const Q8_STEP = 5;
const REQUIRED_LONG_TEXT_KEYS = ['q4_text', 'q5_text', 'q10_text'] as const;

export type EvaluationValidationResult =
  | { ok: true; value: EvaluationInput }
  | { ok: false; errors: Record<string, string> };

function isScale(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
}

function isProgramRating(n: unknown): n is number {
  return (
    typeof n === 'number' &&
    Number.isInteger(n) &&
    n >= Q8_MIN &&
    n <= Q8_MAX &&
    n % Q8_STEP === 0
  );
}

/** Returns either a normalized payload or per-field error messages in Spanish. */
export function validateEvaluation(input: unknown): EvaluationValidationResult {
  const errors: Record<string, string> = {};
  const raw = (input ?? {}) as Record<string, unknown>;

  for (const key of SCALE_KEYS) {
    if (!isScale(raw[key])) errors[key] = 'Selecciona un valor del 1 al 5.';
  }

  if (!isProgramRating(raw.q8_value)) {
    errors.q8_value = 'Selecciona un valor del 0 al 100%.';
  }

  for (const key of REQUIRED_LONG_TEXT_KEYS) {
    const v = typeof raw[key] === 'string' ? (raw[key] as string).trim() : '';
    if (v.length < EVAL_TEXT_MIN_CHARS) {
      errors[key] = `Escribe al menos ${EVAL_TEXT_MIN_CHARS} caracteres.`;
    }
  }

  const q9Raw = raw.q9_selections;
  let q9: string[] = [];
  if (Array.isArray(q9Raw)) {
    q9 = q9Raw.filter((s): s is string => typeof s === 'string' && Q9_SET.has(s));
  } else if (q9Raw !== undefined && q9Raw !== null) {
    errors.q9_selections = 'Selecciona al menos una opción.';
  }
  if (q9.length === 0 && !errors.q9_selections) {
    errors.q9_selections = 'Selecciona al menos una opción.';
  }

  const q12 = raw.q12_value;
  if (typeof q12 !== 'string' || !Q12_VALUES.has(q12 as EvaluationQ12)) {
    errors.q12_value = 'Selecciona una opción.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const optional = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const value: EvaluationInput = {
    q1_value: raw.q1_value as number,
    q2_value: raw.q2_value as number,
    q3_value: raw.q3_value as number,
    q4_text: (raw.q4_text as string).trim(),
    q5_text: (raw.q5_text as string).trim(),
    q6_text: optional(raw.q6_text),
    q7_value: raw.q7_value as number,
    q8_value: raw.q8_value as number,
    q9_selections: Array.from(new Set(q9)),
    q10_text: (raw.q10_text as string).trim(),
    q11_text: optional(raw.q11_text),
    q12_value: raw.q12_value as EvaluationQ12,
  };

  return { ok: true, value };
}

/**
 * Q12 enum → Spanish label map. Used by both the form and the admin viewer.
 */
export const Q12_LABEL: Record<EvaluationQ12, string> = {
  yes: 'Sí, sin duda',
  'yes-with-reservations': 'Sí, con reservas',
  no: 'No',
};

export { Q8_MIN, Q8_MAX, Q8_STEP };
