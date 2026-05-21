import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUserId } from '@/lib/completions-service';
import { isLocalMode } from '@/lib/local-db';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  SUPABASE_BUCKET,
  buildFileUrl,
  buildStoredFilename,
  getUploadDir,
  isSupabaseStorageMode,
} from '@/lib/upload-storage';

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'El archivo es demasiado grande (máx. 10MB)' },
      { status: 400 }
    );
  }

  const mimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }

  const userId = session.userId;
  const storedName = buildStoredFilename(file.name);

  // Supabase Storage path is preferred when env vars are present. We use the
  // service-role client to upload so we don't have to fight RLS during the
  // server-to-storage hop — the route already gated by getSessionUserId() and
  // we always namespace the path under `<userId>/`, so the RLS policy on
  // storage.objects still protects reads downstream.
  if (!isLocalMode() && isSupabaseStorageMode()) {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servidor mal configurado: falta SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const objectPath = `${userId}/${storedName}`;
    const { error } = await admin.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: false,
      });
    if (error) {
      // The most common cause is the bucket not existing yet.
      const msg = error.message?.toLowerCase().includes('not found')
        ? `No se encontró el bucket "${SUPABASE_BUCKET}" en Storage. Ejecuta scripts/setup-supabase.mjs.`
        : `No se pudo subir el archivo: ${error.message}`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({
      fileUrl: buildFileUrl(userId, storedName),
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    });
  }

  // Local mode (no Supabase) — write to .data/uploads/<userId>/
  const dir = getUploadDir(userId);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  return NextResponse.json({
    fileUrl: buildFileUrl(userId, storedName),
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  });
}
