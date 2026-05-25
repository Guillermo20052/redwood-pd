import { NextResponse } from 'next/server';
import { requireAdminDemoSession } from '@/lib/admin-demo-auth';
import { resetCategoryAdminSkip } from '@/lib/admin-demo-reset';

const ALLOWED_CATEGORIES = new Set(['extras', 'collab']);

export async function POST(request: Request) {
  const auth = await requireAdminDemoSession();
  if ('error' in auth) return auth.error;

  let body: { category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const category = body.category;
  if (typeof category !== 'string' || !ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: 'category debe ser uno de: extras, collab' },
      { status: 400 }
    );
  }

  try {
    const result = await resetCategoryAdminSkip(
      auth.session.userId,
      category as 'extras' | 'collab'
    );
    return NextResponse.json({ ok: true, category, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
