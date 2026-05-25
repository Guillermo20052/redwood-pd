import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { DiplomaTier } from './diplomas';

export type DiplomaAwardDates = Partial<Record<DiplomaTier, Date>>;

/** Read awarded_at from diploma_events via RLS (client-side). Does not use /api/diplomas. */
export async function fetchDiplomaAwardDates(): Promise<DiplomaAwardDates> {
  if (!isSupabaseConfigured()) return {};

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('diploma_events')
      .select('tier, awarded_at')
      .eq('user_id', user.id);

    if (error || !data) return {};

    const out: DiplomaAwardDates = {};
    for (const row of data) {
      const tier = row.tier as DiplomaTier;
      if (tier === 1 || tier === 2 || tier === 3) {
        out[tier] = new Date(row.awarded_at);
      }
    }
    return out;
  } catch {
    return {};
  }
}
