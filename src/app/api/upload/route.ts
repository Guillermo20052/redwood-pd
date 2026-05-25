import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUserId } from '@/lib/completions-service';
import { isLocalMode } from '@/lib/local-db';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  STORAGE_BUCKET,
  buildStorageKey,
  isSupabaseStorageMode,
  storageKeyFilename,
  storageKeyToFileUrl,
  getUploadDir,
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
  const key = buildStorageKey(userId, file.name);
  const storedName = storageKeyFilename(key);

  console.log('Upload start', {
    userId,
    filename: file.name,
    size: file.size,
    key,
  });

  // Supabase Storage path is preferred when env vars are present. We use the
  // service-role client to upload so we don't have to fight RLS during the
  // server-to-storage hop — the route already gated by getSessionUserId() and
  // we always namespace the path under `<safeUserId>/`, so the RLS policy on
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
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(key, buffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: false,
      });
    if (error) {
      const msg = error.message?.toLowerCase().includes('not found')
        ? `No se encontró el bucket "${STORAGE_BUCKET}" en Storage. Ejecuta scripts/setup-supabase.mjs.`
        : `No se pudo subir el archivo: ${error.message}`;
      console.error('Upload failed', { userId, key, bucket: STORAGE_BUCKET, error: error.message });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    console.log('Upload complete', { userId, key, bucket: STORAGE_BUCKET });

    return NextResponse.json({
      ok: true,
      key,
      fileUrl: storageKeyToFileUrl(key),
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    });
  }

  // Local mode (no Supabase) — write to .data/uploads/<safeUserId>/
  const dir = getUploadDir(userId);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  console.log('Upload complete', { userId, key, bucket: 'local', path: dest });

  return NextResponse.json({
    ok: true,
    key,
    fileUrl: storageKeyToFileUrl(key),
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  });
}
