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

/** Name of the Supabase Storage bucket where teacher submissions live. */
export const SUPABASE_BUCKET = 'uploads';

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
 * Parse a `/api/uploads/<userId>/<filename>` URL into its parts. Returns null
 * when the URL is malformed, has the wrong number of segments, or contains
 * a path-traversal sequence.
 */
export function parseUploadUrl(
  fileUrl: string
): { userId: string; filename: string } | null {
  const match = fileUrl.match(/^\/api\/uploads\/([^/]+)\/([^/]+(?:\/[^/]+)*)$/);
  if (!match) return null;
  const [, userId, filename] = match;
  if (filename.includes('..')) return null;
  return { userId, filename };
}

/**
 * Storage object path inside the "uploads" bucket. Convention is
 * `<userId>/<filename>` so RLS policies on storage.objects can compare the
 * first folder segment with auth.uid().
 */
export function fileUrlToStoragePath(fileUrl: string): string | null {
  const parsed = parseUploadUrl(fileUrl);
  if (!parsed) return null;
  return `${parsed.userId}/${parsed.filename}`;
}

/**
 * Resolve a public file URL to an on-disk path. Returns null if the URL is
 * malformed or escapes the user's upload directory. Only meaningful in local
 * mode — in Supabase mode the file lives in Storage, not on disk.
 */
export function fileUrlToPath(fileUrl: string): string | null {
  const parsed = parseUploadUrl(fileUrl);
  if (!parsed) return null;
  const dir = getUploadDir(parsed.userId);
  const full = path.join(dir, parsed.filename);
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

/** Returns true when Supabase env vars are present (production storage mode). */
export function isSupabaseStorageMode(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
