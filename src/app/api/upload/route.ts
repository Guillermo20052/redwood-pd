import { randomBytes } from 'crypto';
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
  extensionFromContentType,
  isSupabaseStorageMode,
  safeUserId,
  storageKeyFilename,
  storageKeyToFileUrl,
  getUploadDir,
} from '@/lib/upload-storage';

type SignedUploadBody = {
  filename?: string;
  contentType?: string;
  fileSize?: number;
};

function buildStorageKeyFromContentType(userId: string, contentType: string): string {
  const ext = extensionFromContentType(contentType) ?? 'bin';
  const safeUser = safeUserId(userId);
  return `${safeUser}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
}

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const contentTypeHeader = request.headers.get('content-type') ?? '';
  const isMultipart = contentTypeHeader.includes('multipart/form-data');

  if (isMultipart) {
    if (!isLocalMode()) {
      return NextResponse.json(
        { error: 'Usa la subida directa (JSON + signed URL) en producción.' },
        { status: 400 }
      );
    }
    return handleLocalMultipartUpload(request, session.userId);
  }

  return handleSignedUploadUrl(request, session.userId);
}

async function handleSignedUploadUrl(request: Request, userId: string) {
  let body: SignedUploadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const filename = typeof body.filename === 'string' ? body.filename : '';
  const contentType = (body.contentType ?? '').toLowerCase();
  const fileSize = typeof body.fileSize === 'number' ? body.fileSize : NaN;

  if (!contentType || !Number.isFinite(fileSize) || fileSize < 0) {
    return NextResponse.json({ error: 'Parámetros de subida inválidos' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }

  if (fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'El archivo es demasiado grande (máximo 10 MB)' },
      { status: 400 }
    );
  }

  const key = buildStorageKeyFromContentType(userId, contentType);

  console.log('Signed upload requested', {
    userId,
    filename,
    contentType,
    fileSize,
    key,
  });

  if (!isSupabaseStorageMode()) {
    return NextResponse.json(
      { error: 'Supabase Storage no está configurado en este entorno.' },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error('Signed upload failed', {
      userId,
      error: 'missing SUPABASE_SERVICE_ROLE_KEY',
    });
    return NextResponse.json(
      { error: 'Servidor mal configurado: falta SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(key);

  if (error || !data) {
    console.error('Signed upload failed', { userId, error: error?.message });
    return NextResponse.json(
      { error: 'No se pudo preparar la subida. Intenta de nuevo.' },
      { status: 500 }
    );
  }

  console.log('Signed upload issued', { userId, key });

  return NextResponse.json({
    ok: true,
    key,
    signedUrl: data.signedUrl,
    token: data.token,
    fileUrl: storageKeyToFileUrl(key),
  });
}

async function handleLocalMultipartUpload(request: Request, userId: string) {
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

  const mimeType = (file.type || '').toLowerCase();
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'El archivo es demasiado grande (máximo 10 MB)' },
      { status: 400 }
    );
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }

  const key = buildStorageKeyFromContentType(userId, mimeType);
  const storedName = storageKeyFilename(key);
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
