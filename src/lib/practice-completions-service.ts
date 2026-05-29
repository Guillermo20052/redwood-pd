import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { isLocalMode, localDb, type PracticeCompletionRow } from '@/lib/local-db';

export type PracticeCompletionMap = Record<string, PracticeCompletionRow>;

export async function loadPracticeCompletions(userId: string): Promise<PracticeCompletionMap> {
  if (isLocalMode()) {
    return localDb.getPracticeCompletions(userId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('practice_completions')
    .select('task_id, score, feedback, file_url, created_at, updated_at')
    .eq('user_id', userId);

  const map: PracticeCompletionMap = {};
  for (const row of data ?? []) {
    map[row.task_id] = {
      task_id: row.task_id,
      score: row.score,
      feedback: row.feedback,
      file_url: row.file_url ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  return map;
}

export async function savePracticeCompletion(
  userId: string,
  row: PracticeCompletionRow
): Promise<void> {
  if (isLocalMode()) {
    localDb.setPracticeCompletion(userId, row);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('practice_completions').upsert({
    user_id: userId,
    task_id: row.task_id,
    score: row.score,
    feedback: row.feedback,
    file_url: row.file_url ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || 'No se pudo guardar la práctica.');
  }
}
