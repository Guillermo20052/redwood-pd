'use client';

import { createClient } from '@/lib/supabase/client';
import {
  normalizeUploadContentType,
  validateUploadFile,
  type UploadFileKind,
} from '@/lib/upload-file-validation';

function storageKeyToFileUrl(key: string): string {
  return `/api/uploads/${key}`;
}

export const MAX_TEACHER_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadStage = 'idle' | 'preparing' | 'uploading' | 'ready' | 'error';

export type UploadedFileRef = {
  key: string;
  fileUrl: string;
};

export {
  uploadFileTypeErrorMessage,
  validateUploadFile,
  type UploadFileKind,
} from '@/lib/upload-file-validation';

const TECHNICAL_UPLOAD_ERROR =
  'Error técnico subiendo el archivo. Por favor recarga la página e intenta de nuevo.';

/** Server responses that must never be shown verbatim to teachers. */
function sanitizeUserFacingUploadError(msg: string | undefined): string {
  if (!msg?.trim()) return TECHNICAL_UPLOAD_ERROR;
  const lower = msg.toLowerCase();
  if (
    lower.includes('signed url') ||
    lower.includes('json +') ||
    lower.includes('service_role') ||
    lower.includes('subida directa') ||
    lower.includes('multipart')
  ) {
    return TECHNICAL_UPLOAD_ERROR;
  }
  return msg;
}

class SignedUploadRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly apiError?: string
  ) {
    super(message);
    this.name = 'SignedUploadRequestError';
  }
}

/** True when the server has no Supabase Storage — local dev may use multipart instead. */
function isLocalOnlySignedUrlFailure(err: unknown): boolean {
  if (!(err instanceof SignedUploadRequestError)) return false;
  const msg = (err.apiError ?? '').toLowerCase();
  return err.status === 500 && msg.includes('supabase storage no está configurado');
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
    return msg;
  }
  if (!res.ok) {
    return sanitizeUserFacingUploadError(msg) || 'Error de conexión. Verifica tu internet.';
  }
  return 'Error de conexión. Verifica tu internet.';
}

function assertFileAllowed(file: File, kind?: UploadFileKind): void {
  const check = validateUploadFile(file.name, file.type, kind ? { kind } : undefined);
  if (!check.ok) {
    throw new Error(check.reason);
  }
}

function contentTypeForUpload(file: File, kind?: UploadFileKind): string {
  assertFileAllowed(file, kind);
  return normalizeUploadContentType(file.name, file.type);
}

async function uploadViaMultipart(
  file: File,
  onStage?: (stage: UploadStage, progressPercent?: number) => void,
  kind?: UploadFileKind
): Promise<UploadedFileRef> {
  assertFileAllowed(file, kind);
  onStage?.('uploading', 0);
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
    throw new Error(
      sanitizeUserFacingUploadError(data?.error) ||
        'No se pudo subir el archivo. Verifica tu conexión e intenta de nuevo.'
    );
  }
  if (typeof data.key !== 'string') {
    throw new Error('Respuesta de subida inválida');
  }
  const fileUrl =
    typeof data.fileUrl === 'string' ? data.fileUrl : storageKeyToFileUrl(data.key);
  onStage?.('ready', 100);
  return { key: data.key, fileUrl };
}

async function requestSignedUpload(
  file: File,
  kind?: UploadFileKind
): Promise<{
  key: string;
  token: string;
}> {
  const contentType = contentTypeForUpload(file, kind);
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
    throw new SignedUploadRequestError(
      mapSignedUrlRequestError(res, data),
      res.status,
      typeof data?.error === 'string' ? data.error : undefined
    );
  }
  if (typeof data.key !== 'string' || typeof data.token !== 'string') {
    throw new Error('Respuesta de subida inválida');
  }
  return { key: data.key, token: data.token };
}

async function uploadViaSignedUrl(
  file: File,
  onStage?: (stage: UploadStage, progressPercent?: number) => void,
  kind?: UploadFileKind
): Promise<UploadedFileRef> {
  onStage?.('preparing');
  const contentType = contentTypeForUpload(file, kind);
  const { key, token } = await requestSignedUpload(file, kind);
  onStage?.('uploading', 0);

  let supabase;
  try {
    supabase = createClient();
  } catch {
    throw new Error(TECHNICAL_UPLOAD_ERROR);
  }

  const { error } = await supabase.storage
    .from('uploads')
    .uploadToSignedUrl(key, token, file, {
      contentType,
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
 * Upload a teacher submission file.
 *
 * Production: always JSON signed URL first (browser → Supabase), never multipart.
 * Local dev without Supabase: signed-url prep fails → multipart fallback to disk.
 */
export async function uploadTeacherSubmissionFile(
  file: File,
  onStage?: (stage: UploadStage, progressPercent?: number) => void,
  options?: { kind?: UploadFileKind }
): Promise<UploadedFileRef> {
  if (file.size > MAX_TEACHER_UPLOAD_BYTES) {
    throw new Error(
      'El archivo es demasiado grande (máximo 10 MB). Comprime el PDF e intenta de nuevo.'
    );
  }

  const kind = options?.kind;
  assertFileAllowed(file, kind);

  try {
    return await uploadViaSignedUrl(file, onStage, kind);
  } catch (err) {
    if (isLocalOnlySignedUrlFailure(err)) {
      return uploadViaMultipart(file, onStage, kind);
    }
    throw err;
  }
}

export const VERIFY_TASK_USER_MESSAGE =
  'No pudimos procesar tu tarea. Por favor intenta de nuevo.';
