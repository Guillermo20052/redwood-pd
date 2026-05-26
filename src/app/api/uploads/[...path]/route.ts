import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUserId } from '@/lib/completions-service';
import { isAdminUser } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  STORAGE_BUCKET,
  UPLOAD_ROOT,
  isSupabaseStorageMode,
  safeUserId,
} from '@/lib/upload-storage';
import { isLocalMode } from '@/lib/local-db';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
};

const SIGNED_URL_TTL_SECONDS = 60;

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  if (!segments?.length || segments.length < 2) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  const [userId, ...rest] = segments;
  const filename = rest.join('/');
  if (filename.includes('..')) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  // ── Supabase Storage mode ────────────────────────────────────────────────
  if (!isLocalMode() && isSupabaseStorageMode()) {
    const session = await getSessionUserId();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const isOwner = safeUserId(session.userId) === userId;
    const isAdmin = await isAdminUser(session.userId);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servidor mal configurado' },
        { status: 500 }
      );
    }
    const objectPath = `${userId}/${filename}`;
    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || 'No se encontró el archivo' },
        { status: 404 }
      );
    }
    // 302 redirect — the browser fetches the file directly from Storage with
    // the short-lived signed URL, so no bytes flow through this route.
    return NextResponse.redirect(data.signedUrl, 302);
  }

  // ── Local mode ───────────────────────────────────────────────────────────
  const safeUser = safeUserId(userId);
  const dir = path.join(UPLOAD_ROOT, safeUser);
  const full = path.join(dir, filename);
  const resolved = path.resolve(full);
  const resolvedDir = path.resolve(dir);
  if (!resolved.startsWith(resolvedDir + path.sep)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
  const body = fs.readFileSync(resolved);

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
