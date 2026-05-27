/**
 * Shared upload file-type rules (client + server). No Node-only imports.
 */

export const ALLOWED_UPLOAD_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg']);

/** MIME types accepted outright (includes empty / octet-stream for extension fallback). */
export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'application/vnd.pdf',
  'application/x-bzpdf',
  'text/pdf',
  'text/x-pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/x-png',
  'application/octet-stream',
  '',
]);

/** @deprecated Use ALLOWED_UPLOAD_MIME_TYPES — kept for upload-storage imports. */
export const ALLOWED_MIME_TYPES = ALLOWED_UPLOAD_MIME_TYPES;

export type UploadFileKind = 'pdf' | 'image';

export type UploadFileValidation =
  | { ok: true; storageExt: string; contentType: string }
  | { ok: false; reason: string };

export function fileExtension(filename: string): string {
  const base = filename.trim().toLowerCase();
  const dot = base.lastIndexOf('.');
  if (dot < 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1);
}

export function storageExtensionFromFilename(filename: string): string | null {
  const ext = fileExtension(filename);
  if (ext === 'jpeg') return 'jpg';
  if (ALLOWED_UPLOAD_EXTENSIONS.has(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  return null;
}

export function isPdfMime(mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  if (!m) return false;
  return (
    m === 'application/pdf' ||
    m === 'application/x-pdf' ||
    m === 'application/acrobat' ||
    m === 'application/vnd.pdf' ||
    m === 'application/x-bzpdf' ||
    m === 'text/pdf' ||
    m === 'text/x-pdf' ||
    m.includes('pdf')
  );
}

export function isImageMime(mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  if (!m) return false;
  return (
    m === 'image/png' ||
    m === 'image/jpeg' ||
    m === 'image/jpg' ||
    m === 'image/x-png' ||
    m.startsWith('image/')
  );
}

export function isImageExtension(ext: string): boolean {
  return ext === 'png' || ext === 'jpg' || ext === 'jpeg';
}

export function isPdfExtension(ext: string): boolean {
  return ext === 'pdf';
}

export function uploadFileTypeErrorMessage(filename: string, mimeType: string): string {
  const mime = mimeType?.trim() || 'desconocido';
  return `Tipo de archivo no permitido. Sube PDF, PNG o JPG (recibido: ${filename || 'sin nombre'}, tipo: ${mime})`;
}

/** Canonical Content-Type for Storage / signed upload (prefer extension when MIME is vague). */
export function normalizeUploadContentType(filename: string, mimeType: string): string {
  const ext = fileExtension(filename);
  const mime = (mimeType ?? '').toLowerCase();

  if (ext === 'pdf' || isPdfMime(mime)) return 'application/pdf';
  if (ext === 'png' || mime === 'image/png' || mime === 'image/x-png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg' || mime === 'image/jpeg' || mime === 'image/jpg') {
    return 'image/jpeg';
  }

  if (mime === 'image/jpg') return 'image/jpeg';
  if (isPdfMime(mime)) return 'application/pdf';
  if (isImageMime(mime)) {
    if (mime.includes('png')) return 'image/png';
    return 'image/jpeg';
  }

  return mime || 'application/octet-stream';
}

/** Storage object extension for keys (pdf | png | jpg). */
export function storageExtensionForUpload(filename: string, mimeType: string): string | null {
  const fromName = storageExtensionFromFilename(filename);
  if (fromName) return fromName;

  const normalized = normalizeUploadContentType(filename, mimeType);
  if (normalized === 'application/pdf') return 'pdf';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/jpeg') return 'jpg';
  return null;
}

function mimeTypeAllowed(mimeType: string): boolean {
  const mime = (mimeType ?? '').toLowerCase();
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(mime)) return false;
  if (mime === '' || mime === 'application/octet-stream') return false;
  return isPdfMime(mime) || isImageMime(mime);
}

/**
 * Accept if extension OR MIME matches allowed types (.pdf, .png, .jpg, .jpeg).
 * `kind` is informational only (UI labels) — all file-upload tasks accept PDF and images.
 */
export function validateUploadFile(
  filename: string,
  mimeType: string,
  _options?: { kind?: UploadFileKind }
): UploadFileValidation {
  const ext = fileExtension(filename);
  const mime = (mimeType ?? '').toLowerCase();
  const extOk = ALLOWED_UPLOAD_EXTENSIONS.has(ext);
  const mimeOk = mimeTypeAllowed(mime);

  if (!extOk && !mimeOk) {
    return { ok: false, reason: uploadFileTypeErrorMessage(filename, mimeType) };
  }

  const storageExt = storageExtensionForUpload(filename, mimeType);
  if (!storageExt) {
    return { ok: false, reason: uploadFileTypeErrorMessage(filename, mimeType) };
  }

  return {
    ok: true,
    storageExt,
    contentType: normalizeUploadContentType(filename, mimeType),
  };
}
