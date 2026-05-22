import {
  curriculumPath,
  getPreviousItem,
  getPathItem,
  verificationConfig,
  type TaskInputType,
} from './curriculum-path';
import { hoursMap, metaConfig } from './content';
import { meetsDiplomaExtrasRequirement } from './extras-gating';
import type { CompletionRow } from './local-db';

export type CompletionMap = Record<string, CompletionRow>;

/**
 * Verification-domain error that carries the HTTP status the API route should
 * surface. Pre-existing `verifyTask` / `verifyReflection` still throw plain
 * `Error` (which routes default to 400), so this is purely additive.
 */
export class VerificationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'VerificationError';
    this.status = status;
  }
}

export function buildInitialCompletions(existing: CompletionRow[] = []): CompletionMap {
  const map: CompletionMap = {};
  const byKey = Object.fromEntries(existing.map((r) => [r.item_key, r]));

  for (let i = 0; i < curriculumPath.length; i++) {
    const item = curriculumPath[i];
    const prev = i === 0 ? null : curriculumPath[i - 1];
    const existingRow = byKey[item.itemKey];
    if (existingRow?.status === 'verified') {
      map[item.itemKey] = existingRow;
      continue;
    }
    const prevVerified = !prev || byKey[prev.itemKey]?.status === 'verified';
    map[item.itemKey] = {
      item_key: item.itemKey,
      status: prevVerified ? 'available' : 'locked',
    };
  }

  for (const row of existing) {
    if (row.item_key.startsWith('extra-lvl-') || row.item_key.startsWith('collab-lvl-')) {
      map[row.item_key] = row;
    }
  }
  return map;
}

/** Mark an extra task verified (independent of curriculum sequential unlock). */
export function verifyExtraTask(
  completions: CompletionMap,
  itemKey: string,
  evidenceText: string,
  gradeResult: TaskGradeResult,
  meta?: TaskSubmissionMeta
): CompletionMap {
  if (!gradeResult.passed) {
    throw new VerificationError('La tarea aún no cumple los criterios mínimos.', 400);
  }
  const inputType = meta?.inputType ?? 'text';
  const trimmed = evidenceText.trim();
  if (inputType === 'text' && trimmed.length < verificationConfig.taskEvidenceMinChars) {
    throw new VerificationError(
      `La evidencia debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres`,
      400
    );
  }
  if ((inputType === 'screenshot' || inputType === 'document') && !meta?.fileUrl) {
    throw new VerificationError('Debes subir un archivo para esta tarea.', 400);
  }
  const evidenceStored =
    inputType === 'text' ? trimmed : meta?.fileUrl ?? trimmed;

  const next = { ...completions };
  next[itemKey] = {
    item_key: itemKey,
    status: 'verified',
    verified_at: new Date().toISOString(),
    evidence_text: evidenceStored,
    task_input_type: inputType,
    task_file_url: meta?.fileUrl ?? null,
    task_score: 100,
    task_feedback: gradeResult.feedback,
  };
  return next;
}

/** Collaborative task: verified only when reciprocal partner confirmation exists. */
export function verifyCollaborativeTask(
  completions: CompletionMap,
  itemKey: string,
  evidenceText: string,
  gradeResult: TaskGradeResult,
  partner: TaskPartner,
  reciprocalReady: boolean
): CompletionMap {
  if (!gradeResult.passed) {
    throw new VerificationError('La tarea aún no cumple los criterios mínimos.', 400);
  }
  const trimmed = evidenceText.trim();
  if (trimmed.length < verificationConfig.taskEvidenceMinChars) {
    throw new VerificationError(
      `La evidencia debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres`,
      400
    );
  }
  if (partner.name.trim().length < 3) {
    throw new VerificationError('Indica tu compañera antes de enviar.', 400);
  }
  const now = new Date().toISOString();
  const next = { ...completions };
  next[itemKey] = {
    item_key: itemKey,
    status: reciprocalReady ? 'verified' : 'available',
    verified_at: reciprocalReady ? now : undefined,
    evidence_text: trimmed,
    task_input_type: 'text',
    task_score: reciprocalReady ? 100 : undefined,
    task_feedback: gradeResult.feedback,
    partner_user_id: partner.user_id ?? undefined,
    partner_name: partner.name.trim(),
  };
  return next;
}

export function sumVerifiedHours(completions: CompletionMap): number {
  let total = 0;
  for (const item of curriculumPath) {
    const row = completions[item.itemKey];
    if (row?.status === 'verified') {
      total += hoursMap[item.itemKey] ?? item.hours;
    }
  }
  return Math.round(total * 10) / 10;
}

export function getLevelHoursVerified(completions: CompletionMap, level: 'b' | 'i' | 'a'): number {
  let total = 0;
  for (const item of curriculumPath) {
    if (item.level !== level) continue;
    if (completions[item.itemKey]?.status === 'verified') {
      total += hoursMap[item.itemKey] ?? item.hours;
    }
  }
  return Math.round(total * 10) / 10;
}

export function canVerifyItem(completions: CompletionMap, itemKey: string): { ok: boolean; reason?: string } {
  const item = getPathItem(itemKey);
  if (!item) return { ok: false, reason: 'Item no encontrado' };
  const row = completions[itemKey];
  if (row?.status === 'verified') return { ok: false, reason: 'Ya verificado' };
  if (row?.status === 'locked') return { ok: false, reason: 'Completa el paso anterior primero' };
  const prev = getPreviousItem(itemKey);
  if (prev && completions[prev.itemKey]?.status !== 'verified') {
    return { ok: false, reason: 'Completa el paso anterior primero' };
  }
  return { ok: true };
}

export function verifyVideo(
  completions: CompletionMap,
  itemKey: string,
  watchPct: number,
  skipped: boolean = false
): CompletionMap {
  const check = canVerifyItem(completions, itemKey);
  if (!check.ok) throw new VerificationError(check.reason ?? 'No verificable', 400);
  const item = getPathItem(itemKey);
  if (item?.type !== 'video') throw new VerificationError('No es un video', 400);

  // Skip is only legal on Level 1.
  if (skipped && item.level !== 'b') {
    throw new VerificationError('No puedes saltar este video en este nivel.', 403);
  }

  // Non-skip path requires the watch threshold to be met.
  if (!skipped && watchPct < verificationConfig.videoWatchThreshold) {
    const pct = Math.round(verificationConfig.videoWatchThreshold * 100);
    throw new VerificationError(`Debes ver al menos el ${pct}% del video.`, 400);
  }

  const next = { ...completions };
  next[itemKey] = {
    item_key: itemKey,
    status: 'verified',
    verified_at: new Date().toISOString(),
    video_watch_pct: skipped ? 1 : watchPct,
  };
  return unlockNext(buildInitialCompletions(Object.values(next)));
}

export type TaskGradeResult = {
  passed: boolean;
  feedback: string;
};

/**
 * Partner pairing declared by the teacher on a collaborative task. `user_id`
 * is null when the partner isn't an in-system docente (free-text fallback).
 */
export type TaskPartner = {
  user_id: string | null;
  name: string;
};

export type TaskSubmissionMeta = {
  inputType?: TaskInputType;
  fileUrl?: string | null;
};

/**
 * Verify a task submission.
 *
 * - `gradeResult` is the AI pass/fail outcome. When omitted, falls back to the
 *   legacy length-only behavior for backward compatibility with any internal
 *   caller; the API route always supplies it.
 * - If `gradeResult.passed`, the item is marked verified and task_score 100 +
 *   feedback are persisted on the completion row.
 * - If `!gradeResult.passed`, this function does NOT mutate state. The caller
 *   (API route) should return the failure to the UI without saving.
 * - `partner` is persisted on the completion row when the item is
 *   collaborative. Overwrites any previous value on re-submission.
 */
export function verifyTask(
  completions: CompletionMap,
  itemKey: string,
  evidenceText: string,
  gradeResult?: TaskGradeResult,
  partner?: TaskPartner | null,
  meta?: TaskSubmissionMeta
): CompletionMap {
  const check = canVerifyItem(completions, itemKey);
  if (!check.ok) throw new VerificationError(check.reason ?? 'No verificable', 400);
  const item = getPathItem(itemKey);
  if (item?.type !== 'task') throw new VerificationError('No es una tarea', 400);
  const inputType = meta?.inputType ?? item.inputType ?? 'text';
  const trimmed = evidenceText.trim();
  if (inputType === 'text' && trimmed.length < verificationConfig.taskEvidenceMinChars) {
    throw new VerificationError(
      `La evidencia debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres`,
      400
    );
  }
  if ((inputType === 'screenshot' || inputType === 'document') && !meta?.fileUrl) {
    throw new VerificationError('Debes subir un archivo para esta tarea.', 400);
  }
  if (gradeResult && !gradeResult.passed) {
    throw new VerificationError('La tarea aún no cumple los criterios mínimos.', 400);
  }
  const next = { ...completions };
  const partnerFields =
    item.collaborative && partner && partner.name.trim().length >= 3
      ? {
          partner_user_id: partner.user_id ?? undefined,
          partner_name: partner.name.trim(),
        }
      : {};
  const evidenceStored =
    inputType === 'text'
      ? trimmed
      : meta?.fileUrl ?? trimmed;

  next[itemKey] = {
    item_key: itemKey,
    status: 'verified',
    verified_at: new Date().toISOString(),
    evidence_text: evidenceStored,
    task_input_type: inputType,
    task_file_url: meta?.fileUrl ?? null,
    ...(gradeResult
      ? { task_score: gradeResult.passed ? 100 : 0, task_feedback: gradeResult.feedback }
      : {}),
    ...partnerFields,
  };
  return unlockNext(buildInitialCompletions(Object.values(next)));
}

export function verifyReflection(
  completions: CompletionMap,
  itemKey: string,
  reflectionText: string
): CompletionMap {
  const check = canVerifyItem(completions, itemKey);
  if (!check.ok) throw new Error(check.reason);
  const item = getPathItem(itemKey);
  if (item?.type !== 'reflection') throw new Error('No es una reflexión');
  const trimmed = reflectionText.trim();
  const minChars = verificationConfig.reflectionMinChars ?? 80;
  if (trimmed.length < minChars) {
    throw new Error(`La reflexión debe tener al menos ${minChars} caracteres`);
  }
  const next = { ...completions };
  next[itemKey] = {
    item_key: itemKey,
    status: 'verified',
    verified_at: new Date().toISOString(),
    evidence_text: trimmed,
  };
  return unlockNext(buildInitialCompletions(Object.values(next)));
}

function unlockNext(completions: CompletionMap): CompletionMap {
  return buildInitialCompletions(Object.values(completions));
}

export function getCurrentLevelSlug(completions: CompletionMap): string {
  const b = getLevelHoursVerified(completions, 'b');
  const i = getLevelHoursVerified(completions, 'i');
  const locks = metaConfig.levelLocks;
  if (b + i >= locks.unlockLevel3Hours) return 'a';
  if (b >= locks.unlockLevel2Hours) return 'i';
  return 'b';
}

export function getDiplomaTier(
  totalHours: number,
  completions: CompletionMap = {}
): 0 | 1 | 2 | 3 {
  if (totalHours >= 30 && meetsDiplomaExtrasRequirement(completions)) return 3;
  if (totalHours >= 24 && meetsDiplomaExtrasRequirement(completions)) return 2;
  if (totalHours >= 20 && meetsDiplomaExtrasRequirement(completions)) return 1;
  return 0;
}

export function isLevelUnlocked(
  completions: CompletionMap,
  level: 'i' | 'a',
  isAdmin = false
): boolean {
  if (isAdmin) return true;
  const b = getLevelHoursVerified(completions, 'b');
  const i = getLevelHoursVerified(completions, 'i');
  const locks = metaConfig.levelLocks;
  if (level === 'i') return b >= locks.unlockLevel2Hours;
  return b >= locks.unlockLevel2Hours && b + i >= locks.unlockLevel3Hours;
}
