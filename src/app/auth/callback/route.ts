import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;
    if (user) {
      const meta = user.user_metadata || {};
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: meta.full_name || '',
        subject: meta.subject || '',
        role: 'teacher',
        updated_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
