import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocalMode, localDb, type EvaluationRow } from '@/lib/local-db';

export type EvaluationWithProfile = EvaluationRow & {
  full_name: string | null;
  email: string | null;
  subject: string | null;
};

export async function GET() {
  if (isLocalMode()) {
    return NextResponse.json({ evaluations: buildLocalEvaluations() });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
  }

  const [{ data: rows }, { data: profiles }] = await Promise.all([
    admin
      .from('evaluations')
      .select('*')
      .order('submitted_at', { ascending: false }),
    admin.from('profiles').select('id, full_name, email, subject'),
  ]);

  const profileById = new Map<string, { full_name: string | null; email: string | null; subject: string | null }>();
  for (const p of profiles ?? []) {
    profileById.set(p.id as string, {
      full_name: (p.full_name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
      subject: (p.subject as string | null) ?? null,
    });
  }

  const evaluations: EvaluationWithProfile[] = (rows ?? []).map((r) => {
    const row = r as EvaluationRow;
    const profile = profileById.get(row.user_id);
    return {
      ...row,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      subject: profile?.subject ?? null,
    };
  });

  return NextResponse.json({ evaluations });
}

function buildLocalEvaluations(): EvaluationWithProfile[] {
  const rows = localDb.listEvaluations();
  return rows.map((row) => {
    const profile = localDb.getProfile(row.user_id);
    return {
      ...row,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      subject: profile?.subject ?? null,
    };
  });
}
