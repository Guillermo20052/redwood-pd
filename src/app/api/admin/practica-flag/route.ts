import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/completions-service';
import { isAdminUser } from '@/lib/auth-helpers';
import { isPracticaEnabled, setPracticaEnabled } from '@/lib/feature-flags';
import { isLocalMode } from '@/lib/local-db';

async function canManagePracticaFlag(userId: string): Promise<boolean> {
  if (isLocalMode()) return true;
  return isAdminUser(userId);
}

export async function GET() {
  const session = await getSessionUserId();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!(await canManagePracticaFlag(session.userId))) {
    return NextResponse.json({ error: 'Solo administración' }, { status: 403 });
  }

  const enabled = await isPracticaEnabled();
  return NextResponse.json({ enabled });
}

export async function POST(req: Request) {
  const session = await getSessionUserId();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!(await canManagePracticaFlag(session.userId))) {
    return NextResponse.json({ error: 'Solo administración' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const enabled =
    typeof body.enabled === 'boolean' ? body.enabled : !(await isPracticaEnabled());

  try {
    await setPracticaEnabled(enabled);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enabled });
}
