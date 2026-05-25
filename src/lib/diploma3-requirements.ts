import type { EvaluationRow } from './local-db';
import { EVAL_TEXT_MIN_CHARS, validateEvaluation } from './evaluation';
import { isMandatoryPartsComplete } from './extras-gating';
import {
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
  meetsDiploma1ExtrasRequirement,
  meetsDiploma3ExtrasRequirement,
} from './extras-gating';
import type { CompletionMap } from './verification';

/** Session reflections saved on /reflexion — level is 1 (Nivel 1), 2, or 3. */
export type Diploma3ProgramRequirements = {
  eticaRead: boolean;
  reflectionL1: boolean;
  reflectionL2: boolean;
  reflectionL3: boolean;
  evaluationComplete: boolean;
};

export const EMPTY_DIPLOMA3_PROGRAM_REQUIREMENTS: Diploma3ProgramRequirements = {
  eticaRead: false,
  reflectionL1: false,
  reflectionL2: false,
  reflectionL3: false,
  evaluationComplete: false,
};

export function levelsWithReflections(
  reflections: Array<{ level: number }>
): { l1: boolean; l2: boolean; l3: boolean } {
  const levels = new Set(reflections.map((r) => r.level));
  return {
    l1: levels.has(1),
    l2: levels.has(2),
    l3: levels.has(3),
  };
}

/** All evaluation questions answered — including optional q6 and q11 on the form. */
export function isEvaluationCompleteForDiploma3(
  evaluation: EvaluationRow | null | undefined
): boolean {
  if (!evaluation) return false;
  const result = validateEvaluation(evaluation);
  if (!result.ok) return false;
  const q6 = (evaluation.q6_text ?? '').trim();
  const q11 = (evaluation.q11_text ?? '').trim();
  return q6.length >= EVAL_TEXT_MIN_CHARS && q11.length >= EVAL_TEXT_MIN_CHARS;
}

export function meetsDiploma3ProgramRequirements(
  req: Diploma3ProgramRequirements | null | undefined
): boolean {
  if (!req) return false;
  return (
    req.eticaRead &&
    req.reflectionL1 &&
    req.reflectionL2 &&
    req.reflectionL3 &&
    req.evaluationComplete
  );
}

/** Hours, mandatory parts, and Level Up tasks for Diploma 3 (excludes ética/reflexiones/eval). */
export function meetsDiploma3CoreRequirements(
  totalHours: number,
  completions: CompletionMap
): boolean {
  if (totalHours < 30) return false;
  if (!meetsDiploma1ExtrasRequirement(completions)) return false;
  if (!meetsDiploma3ExtrasRequirement(completions)) return false;
  if (!isMandatoryPartsComplete('b', completions)) return false;
  if (!isMandatoryPartsComplete('i', completions)) return false;
  if (!isMandatoryPartsComplete('a', completions)) return false;
  return true;
}

export function buildDiploma3ProgramRequirements(input: {
  eticaReadAt: string | null | undefined;
  reflections: Array<{ level: number }>;
  evaluation: EvaluationRow | null | undefined;
}): Diploma3ProgramRequirements {
  const reflectionLevels = levelsWithReflections(input.reflections);
  return {
    eticaRead: typeof input.eticaReadAt === 'string' && input.eticaReadAt.length > 0,
    reflectionL1: reflectionLevels.l1,
    reflectionL2: reflectionLevels.l2,
    reflectionL3: reflectionLevels.l3,
    evaluationComplete: isEvaluationCompleteForDiploma3(input.evaluation),
  };
}

export function getDiploma3MissingReason(
  totalHours: number,
  completions: CompletionMap,
  program: Diploma3ProgramRequirements
): string | null {
  if (totalHours < 30) return null;
  if (!meetsDiploma3CoreRequirements(totalHours, completions)) return null;
  if (!program.eticaRead) {
    return 'Falta leer la política de ética en /etica para el Diploma de Oro.';
  }
  if (!program.reflectionL1 || !program.reflectionL2 || !program.reflectionL3) {
    return 'Falta al menos una reflexión de sesión por nivel en /reflexion para el Diploma de Oro.';
  }
  if (!program.evaluationComplete) {
    return 'Falta completar la evaluación final en /evaluacion para el Diploma de Oro.';
  }
  return null;
}
