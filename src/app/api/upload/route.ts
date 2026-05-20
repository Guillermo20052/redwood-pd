import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUserId } from '@/lib/completions-service';
import { isLocalMode } from '@/lib/local-db';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  buildFileUrl,
  buildStoredFilename,
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

  if (!isLocalMode()) {
    console.warn('Supabase Storage upload not yet implemented — using local disk fallback');
  }

  const userId = session.userId;
  const dir = getUploadDir(userId);
  fs.mkdirSync(dir, { recursive: true });

  const storedName = buildStoredFilename(file.name);
  const dest = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  const fileUrl = buildFileUrl(userId, storedName);

  return NextResponse.json({
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  });
}
