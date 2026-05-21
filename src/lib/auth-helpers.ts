import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocalMode } from '@/lib/local-db';

export async function getCurrentUserRole(
  userId?: string
): Promise<'teacher' | 'admin'> {
  if (!isSupabaseConfigured() || isLocalMode()) return 'teacher';

  let uid = userId;
  if (!uid) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'teacher';
    uid = user.id;
  }

  const admin = createAdminClient();
  if (!admin) return 'teacher';
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();
  return (data?.role as 'teacher' | 'admin') ?? 'teacher';
}

export async function isAdminUser(userId?: string): Promise<boolean> {
  return (await getCurrentUserRole(userId)) === 'admin';
}
