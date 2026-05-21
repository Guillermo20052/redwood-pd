import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;
      const meta = (user.user_metadata || {}) as Record<string, string | undefined>;
      // Belt-and-suspenders profile creation. Migration 007 installs a trigger
      // that already does this, but the upsert keeps the flow working even on
      // older projects where 007 hasn't been applied yet.
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: meta.full_name ?? '',
          subject: meta.subject ?? meta.subject_area ?? '',
          role: 'teacher',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
