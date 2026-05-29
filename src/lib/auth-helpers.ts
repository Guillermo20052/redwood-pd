import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocalMode, localDb } from '@/lib/local-db';

const LOCAL_USER = 'local-dev-user';

export async function getCurrentUserRole(
  userId?: string
): Promise<'teacher' | 'admin'> {
  if (isLocalMode()) {
    const uid = userId ?? LOCAL_USER;
    const profile = localDb.getProfile(uid);
    return profile?.role === 'admin' ? 'admin' : 'teacher';
  }
  if (!isSupabaseConfigured()) return 'teacher';

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
