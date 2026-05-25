import { createClient } from '@/lib/supabase/server';
import { loadCompletions } from '@/lib/completions-service';
import { isLocalMode, localDb, type CompletionRow } from '@/lib/local-db';

function deleteLocalCompletions(
  userId: string,
  predicate: (key: string, row: CompletionRow) => boolean
): number {
  const rows = localDb.getCompletions(userId);
  let removed = 0;
  for (const row of rows) {
    if (predicate(row.item_key, row)) {
      if (localDb.deleteCompletion(userId, row.item_key)) removed++;
    }
  }
  return removed;
}

export async function resetLevelAdminSkip(userId: string, level: 'b' | 'i' | 'a') {
  const prefix = `lvl-${level}-`;

  if (isLocalMode()) {
    const removed = deleteLocalCompletions(
      userId,
      (key, row) => key.startsWith(prefix) && row.is_admin_skip === true
    );
    const completions = await loadCompletions(userId);
    return { removed, completions };
  }

  const supabase = await createClient();
  await supabase
    .from('item_completions')
    .delete()
    .eq('user_id', userId)
    .eq('is_admin_skip', true)
    .like('item_key', `${prefix}%`);

  const completions = await loadCompletions(userId);
  return { completions };
}

export async function resetCategoryAdminSkip(userId: string, category: 'extras' | 'collab') {
  const prefix = category === 'extras' ? 'extra-lvl-' : 'collab-lvl-';

  if (isLocalMode()) {
    const removed = deleteLocalCompletions(
      userId,
      (key, row) => key.startsWith(prefix) && row.is_admin_skip === true
    );
    const completions = await loadCompletions(userId);
    return { removed, completions };
  }

  const supabase = await createClient();
  await supabase
    .from('item_completions')
    .delete()
    .eq('user_id', userId)
    .eq('is_admin_skip', true)
    .like('item_key', `${prefix}%`);

  const completions = await loadCompletions(userId);
  return { completions };
}

export async function resetAllAdminProgress(userId: string) {
  if (isLocalMode()) {
    const removed = deleteLocalCompletions(userId, () => true);
    const reflections = localDb.listReflections(userId);
    for (const r of reflections) {
      localDb.deleteReflection(userId, r.id);
    }
    const completions = await loadCompletions(userId);
    return { removed, reflectionsRemoved: reflections.length, completions };
  }

  const supabase = await createClient();
  await supabase.from('item_completions').delete().eq('user_id', userId);
  await supabase.from('reflections').delete().eq('user_id', userId);

  const completions = await loadCompletions(userId);
  return { completions };
}

export async function resetWelcomeFlow(userId: string) {
  const patch = {
    welcome_cynthia_read_at: null,
    welcome_pope_read_at: null,
    welcome_about_read_at: null,
    updated_at: new Date().toISOString(),
  };

  if (isLocalMode()) {
    const existing = localDb.getProfile(userId);
    if (existing) {
      localDb.upsertProfile({ ...existing, ...patch });
    }
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function resetTour(userId: string) {
  const now = new Date().toISOString();

  if (isLocalMode()) {
    const existing = localDb.getProfile(userId);
    if (existing) {
      localDb.upsertProfile({ ...existing, tour_completed_at: null, updated_at: now });
    }
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ tour_completed_at: null, updated_at: now })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
