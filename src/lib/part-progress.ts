import type { PartGroup } from './curriculum-path';
import type { CompletionMap } from './verification';

/** True when video, task, and reflection stages are all verified. */
export function isPartComplete(part: PartGroup, completions: CompletionMap): boolean {
  const keys = [
    part.stages.video?.itemKey,
    part.stages.task?.itemKey,
    part.stages.reflection?.itemKey,
  ].filter((k): k is string => Boolean(k));
  if (keys.length < 3) return false;
  return keys.every((k) => completions[k]?.status === 'verified');
}

/** Parts visible under progressive reveal: Part 1 always; Part N only if Part N-1 is complete. */
export function getVisibleParts(parts: PartGroup[], completions: CompletionMap): PartGroup[] {
  return parts.filter((part, idx) => {
    if (idx === 0) return true;
    return isPartComplete(parts[idx - 1]!, completions);
  });
}
