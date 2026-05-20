import fs from 'fs';
import path from 'path';

export const UPLOAD_ROOT = path.join(process.cwd(), '.data', 'uploads');

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);

export function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 120) || 'archivo';
}

export function getUploadDir(userId: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(UPLOAD_ROOT, safeUser);
}

export function buildStoredFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  return `${Date.now()}-${sanitized}`;
}

export function buildFileUrl(userId: string, storedName: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `/api/uploads/${safeUser}/${storedName}`;
}

/**
 * Resolve a public file URL to an on-disk path. Returns null if the URL is
 * malformed or escapes the user's upload directory.
 */
export function fileUrlToPath(fileUrl: string): string | null {
  const match = fileUrl.match(/^\/api\/uploads\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const [, userId, filename] = match;
  if (filename.includes('..')) return null;
  const dir = getUploadDir(userId);
  const full = path.join(dir, filename);
  const resolved = path.resolve(full);
  const resolvedDir = path.resolve(dir);
  if (!resolved.startsWith(resolvedDir + path.sep) && resolved !== resolvedDir) {
    return null;
  }
  return resolved;
}

export function readFileBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

export function detectMediaType(
  mimeType: string,
  inputType: 'screenshot' | 'document'
): 'image/png' | 'image/jpeg' | 'application/pdf' {
  if (inputType === 'document') return 'application/pdf';
  if (mimeType === 'image/png') return 'image/png';
  return 'image/jpeg';
}
