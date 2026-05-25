import { createClient } from '@/lib/supabase/server';
import { isLocalMode, localDb } from '@/lib/local-db';
import { loadProfile } from '@/lib/completions-service';
import {
  buildDiploma3ProgramRequirements,
  type Diploma3ProgramRequirements,
} from '@/lib/diploma3-requirements';

export async function loadDiploma3ProgramRequirements(
  userId: string
): Promise<Diploma3ProgramRequirements> {
  const profile = await loadProfile(userId);

  if (isLocalMode()) {
    const reflections = localDb.listReflections(userId);
    const evaluation = localDb.getEvaluation(userId);
    return buildDiploma3ProgramRequirements({
      eticaReadAt: profile?.etica_read_at ?? null,
      reflections,
      evaluation,
    });
  }

  const supabase = await createClient();
  const [{ data: reflections }, { data: evaluation }] = await Promise.all([
    supabase.from('reflections').select('level').eq('user_id', userId),
    supabase.from('evaluations').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  return buildDiploma3ProgramRequirements({
    eticaReadAt: profile?.etica_read_at ?? null,
    reflections: reflections ?? [],
    evaluation: evaluation ?? null,
  });
}
