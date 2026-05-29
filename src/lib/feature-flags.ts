import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocalMode, localDb } from '@/lib/local-db';

export const PRACTICA_FLAG_KEY = 'practica_enabled';

function parseBooleanFlag(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'true' || v === '1';
  }
  return false;
}

export async function isPracticaEnabled(): Promise<boolean> {
  if (isLocalMode()) {
    return localDb.getFeatureFlag(PRACTICA_FLAG_KEY);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('feature_flags')
    .select('value')
    .eq('key', PRACTICA_FLAG_KEY)
    .maybeSingle();

  if (!data) return false;
  return parseBooleanFlag(data.value);
}

export async function setPracticaEnabled(enabled: boolean): Promise<void> {
  if (isLocalMode()) {
    localDb.setFeatureFlag(PRACTICA_FLAG_KEY, enabled);
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error('Servidor mal configurado: falta SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { error } = await admin.from('feature_flags').upsert({
    key: PRACTICA_FLAG_KEY,
    value: enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar la configuración.');
  }
}
