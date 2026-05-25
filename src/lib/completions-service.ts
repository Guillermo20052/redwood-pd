import { createClient } from '@/lib/supabase/server';
import { localDb, isLocalMode, type CompletionRow } from '@/lib/local-db';
import { buildInitialCompletions, type CompletionMap } from '@/lib/verification';

const LOCAL_USER = 'local-dev-user';

export async function getSessionUserId(): Promise<{ userId: string; email: string } | null> {
  if (isLocalMode()) {
    return { userId: LOCAL_USER, email: 'local@redwood.dev' };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id, email: user.email || '' };
}

export async function loadCompletions(userId: string): Promise<CompletionMap> {
  if (isLocalMode()) {
    const rows = localDb.getCompletions(userId);
    return buildInitialCompletions(rows);
  }
  const supabase = await createClient();
  const { data } = await supabase.from('item_completions').select('*').eq('user_id', userId);
  const rows: CompletionRow[] = (data || []).map((r) => ({
    item_key: r.item_key,
    status: r.status,
    verified_at: r.verified_at,
    evidence_text: r.evidence_text,
    video_watch_pct: r.video_watch_pct,
    // task_score / task_feedback are populated by migration 004; older schemas
    // simply return undefined here, which is fine.
    task_score: typeof r.task_score === 'number' ? r.task_score : undefined,
    task_feedback: typeof r.task_feedback === 'string' ? r.task_feedback : undefined,
    // partner_user_id / partner_name are populated by migration 006; older
    // schemas simply return undefined here.
    partner_user_id: typeof r.partner_user_id === 'string' ? r.partner_user_id : undefined,
    partner_name: typeof r.partner_name === 'string' ? r.partner_name : undefined,
    task_input_type:
      r.task_input_type === 'text' ||
      r.task_input_type === 'screenshot' ||
      r.task_input_type === 'document'
        ? r.task_input_type
        : undefined,
    task_file_url: typeof r.task_file_url === 'string' ? r.task_file_url : undefined,
    is_admin_skip: r.is_admin_skip === true,
    reflection_ai_feedback:
      typeof r.reflection_ai_feedback === 'string' ? r.reflection_ai_feedback : undefined,
  }));
  return buildInitialCompletions(rows);
}

export async function deleteCompletion(userId: string, itemKey: string) {
  if (isLocalMode()) {
    localDb.deleteCompletion(userId, itemKey);
    return;
  }
  const supabase = await createClient();
  await supabase.from('item_completions').delete().eq('user_id', userId).eq('item_key', itemKey);
}

export async function saveCompletions(userId: string, completions: CompletionMap) {
  const rows = Object.values(completions);
  if (isLocalMode()) {
    for (const row of rows) {
      localDb.setCompletion(userId, row);
    }
    return;
  }
  const supabase = await createClient();
  const now = new Date().toISOString();
  const fullPayload = rows.map((r) => ({
    user_id: userId,
    item_key: r.item_key,
    status: r.status,
    verified_at: r.verified_at || null,
    evidence_text: r.evidence_text || null,
    video_watch_pct: r.video_watch_pct || null,
    task_score: typeof r.task_score === 'number' ? r.task_score : null,
    task_feedback: r.task_feedback || null,
    partner_user_id: r.partner_user_id || null,
    partner_name: r.partner_name || null,
    task_input_type: r.task_input_type || null,
    task_file_url: r.task_file_url || null,
    is_admin_skip: r.is_admin_skip === true,
    reflection_ai_feedback: r.reflection_ai_feedback || null,
    updated_at: now,
  }));

  const { error } = await supabase.from('item_completions').upsert(fullPayload);
  if (!error) return;

  // Graceful degradation: if migration 004 / 006 hasn't been applied yet, the
  // added columns won't exist and PostgREST returns PGRST204 ("column ... not
  // found in schema cache"). Strip the unknown columns and retry so progress
  // saves still succeed in pre-migration deployments.
  if (isMissingPartnerColumnError(error)) {
    const partnerStripped = fullPayload.map((p) => {
      const {
        partner_user_id: _pu,
        partner_name: _pn,
        is_admin_skip: _as,
        reflection_ai_feedback: _rf,
        ...rest
      } = p;
      void _pu;
      void _pn;
      void _as;
      void _rf;
      return rest;
    });
    const retry = await supabase.from('item_completions').upsert(partnerStripped);
    if (!retry.error) return;
    if (isMissingColumnError(retry.error)) {
      const legacyPayload = partnerStripped.map((p) => {
        const { task_score: _ts, task_feedback: _tf, ...rest } = p;
        void _ts;
        void _tf;
        return rest;
      });
      await supabase.from('item_completions').upsert(legacyPayload);
      return;
    }
    throw retry.error;
  }
  if (isMissingColumnError(error)) {
    const legacyPayload = fullPayload.map((p) => {
      const {
        task_score: _ts,
        task_feedback: _tf,
        partner_user_id: _pu,
        partner_name: _pn,
        is_admin_skip: _as,
        reflection_ai_feedback: _rf,
        ...rest
      } = p;
      void _ts;
      void _tf;
      void _pu;
      void _pn;
      void _as;
      void _rf;
      return rest;
    });
    await supabase.from('item_completions').upsert(legacyPayload);
    return;
  }
  throw error;
}

function isMissingPartnerColumnError(error: { code?: string; message?: string }): boolean {
  if (error.code !== 'PGRST204') return false;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('partner_user_id') ||
    msg.includes('partner_name') ||
    msg.includes('is_admin_skip') ||
    msg.includes('reflection_ai_feedback')
  );
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  if (error.code === 'PGRST204') return true;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('task_score') ||
    msg.includes('task_feedback') ||
    msg.includes('partner_user_id') ||
    msg.includes('partner_name') ||
    msg.includes('task_input_type') ||
    msg.includes('task_file_url') ||
    msg.includes('is_admin_skip') ||
    msg.includes('reflection_ai_feedback') ||
    (msg.includes('column') && msg.includes('not found')) ||
    (msg.includes('column') && msg.includes('does not exist'))
  );
}

export async function loadProfile(userId: string) {
  if (isLocalMode()) {
    return (
      localDb.getProfile(userId) || {
        id: userId,
        email: 'local@redwood.dev',
        full_name: '',
        subject: '',
        role: 'teacher' as const,
      }
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function saveProfile(
  userId: string,
  patch: { full_name?: string; subject?: string; start_date?: string }
) {
  if (isLocalMode()) {
    const existing = localDb.getProfile(userId) || { id: userId, email: 'local@redwood.dev', role: 'teacher' as const };
    localDb.upsertProfile({ ...existing, ...patch });
    return;
  }
  const supabase = await createClient();
  await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId);
}
