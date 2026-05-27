'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function storageKeyToFileUrl(key: string): string {
  return `/api/uploads/${key}`;
}

export const MAX_TEACHER_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadStage = 'idle' | 'preparing' | 'uploading' | 'ready' | 'error';

export type UploadedFileRef = {
  key: string;
  fileUrl: string;
};

function isLocalModeClient(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeMime(file: File): string {
  const t = (file.type || '').toLowerCase();
  if (t === 'image/jpg') return 'image/jpeg';
  return t;
}

export function mapSignedUrlRequestError(
  res: Response | null,
  data: { error?: string } | null
): string {
  if (!res) {
    return 'Error de conexión. Verifica tu internet.';
  }
  const msg = data?.error ?? '';
  if (res.status === 400 && msg.includes('demasiado grande')) {
    return 'El archivo es demasiado grande (máximo 10 MB). Comprime el PDF e intenta de nuevo.';
  }
  if (res.status === 400 && msg.includes('Tipo de archivo')) {
    return 'Tipo de archivo no permitido. Sube PDF, PNG o JPG.';
  }
  if (!res.ok) {
    return msg || 'Error de conexión. Verifica tu internet.';
  }
  return 'Error de conexión. Verifica tu internet.';
}

async function uploadViaMultipart(file: File): Promise<UploadedFileRef> {
  const form = new FormData();
  form.append('file', file);
  let res: Response;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: form });
  } catch {
    throw new Error('Error de conexión. Verifica tu internet.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo subir el archivo. Verifica tu conexión e intenta de nuevo.');
  }
  if (typeof data.key !== 'string') {
    throw new Error('Respuesta de subida inválida');
  }
  const fileUrl =
    typeof data.fileUrl === 'string' ? data.fileUrl : storageKeyToFileUrl(data.key);
  return { key: data.key, fileUrl };
}

async function requestSignedUpload(file: File): Promise<{
  key: string;
  token: string;
}> {
  const contentType = normalizeMime(file);
  let res: Response;
  try {
    res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType,
        fileSize: file.size,
      }),
    });
  } catch {
    throw new Error('Error de conexión. Verifica tu internet.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mapSignedUrlRequestError(res, data));
  }
  if (typeof data.key !== 'string' || typeof data.token !== 'string') {
    throw new Error('Respuesta de subida inválida');
  }
  return { key: data.key, token: data.token };
}

async function uploadViaSignedUrl(
  file: File,
  onStage?: (stage: UploadStage, progressPercent?: number) => void
): Promise<UploadedFileRef> {
  onStage?.('preparing');
  const { key, token } = await requestSignedUpload(file);
  onStage?.('uploading', 0);

  const supabase = createClient();
  const { error } = await supabase.storage
    .from('uploads')
    .uploadToSignedUrl(key, token, file, {
      contentType: normalizeMime(file) || undefined,
    });

  if (error) {
    throw new Error(
      'No se pudo subir el archivo. Verifica tu conexión e intenta de nuevo.'
    );
  }

  onStage?.('ready', 100);
  return { key, fileUrl: storageKeyToFileUrl(key) };
}

/**
 * Upload a teacher submission file. In production (Supabase configured) the file
 * goes browser → Storage via a signed URL; locally it falls back to multipart POST.
 */
export async function uploadTeacherSubmissionFile(
  file: File,
  onStage?: (stage: UploadStage, progressPercent?: number) => void
): Promise<UploadedFileRef> {
  if (file.size > MAX_TEACHER_UPLOAD_BYTES) {
    throw new Error(
      'El archivo es demasiado grande (máximo 10 MB). Comprime el PDF e intenta de nuevo.'
    );
  }

  if (isSupabaseConfigured() && !isLocalModeClient()) {
    return uploadViaSignedUrl(file, onStage);
  }

  onStage?.('uploading');
  const result = await uploadViaMultipart(file);
  onStage?.('ready');
  return result;
}

export const VERIFY_TASK_USER_MESSAGE =
  'No pudimos procesar tu tarea. Por favor intenta de nuevo.';
