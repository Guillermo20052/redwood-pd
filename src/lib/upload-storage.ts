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
export const STORAGE_BUCKET = 'uploads';

/** @deprecated Use STORAGE_BUCKET */
export const SUPABASE_BUCKET = STORAGE_BUCKET;

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'pdf']);

export function safeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function extensionFromOriginalName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/^\./, '');
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  return 'bin';
}

/** Extension for a signed-upload key from MIME type (never uses original filename). */
export function extensionFromContentType(contentType: string): string | null {
  const t = contentType.toLowerCase();
  if (t === 'application/pdf') return 'pdf';
  if (t === 'image/png') return 'png';
  if (t === 'image/jpeg' || t === 'image/jpg') return 'jpg';
  return null;
}

/**
 * Canonical storage object key: `<safeUserId>/<timestamp>-<random8>.<ext>`.
 * Never embeds the original filename in the path.
 */
export function buildStorageKey(userId: string, originalName: string): string {
  const safeUser = safeUserId(userId);
  const ext = extensionFromOriginalName(originalName);
  return `${safeUser}/${Date.now()}-${randomString(8)}.${ext}`;
}

export function storageKeyToFileUrl(key: string): string {
  return `/api/uploads/${key}`;
}

export function fileUrlToStorageKey(fileUrl: string): string | null {
  if (!fileUrl.startsWith('/api/uploads/')) return null;
  const key = fileUrl.slice('/api/uploads/'.length);
  if (!key || key.includes('..')) return null;
  return key;
}

export function storageKeyBelongsToUser(key: string, userId: string): boolean {
  const safeUser = safeUserId(userId);
  return key === safeUser || key.startsWith(`${safeUser}/`);
}

export function storageKeyFilename(key: string): string {
  const slash = key.indexOf('/');
  return slash >= 0 ? key.slice(slash + 1) : key;
}

export function getUploadDir(userId: string): string {
  return path.join(UPLOAD_ROOT, safeUserId(userId));
}

/** @deprecated Use buildStorageKey */
export function buildStoredFilename(originalName: string): string {
  const ext = extensionFromOriginalName(originalName);
  return `${Date.now()}-${randomString(8)}.${ext}`;
}

/** @deprecated Use storageKeyToFileUrl */
export function buildFileUrl(userId: string, storedName: string): string {
  return storageKeyToFileUrl(`${safeUserId(userId)}/${storedName}`);
}

/**
 * Parse a `/api/uploads/<userId>/<filename>` URL into its parts. Returns null
 * when the URL is malformed, has the wrong number of segments, or contains
 * a path-traversal sequence.
 */
export function parseUploadUrl(
  fileUrl: string
): { userId: string; filename: string } | null {
  const key = fileUrlToStorageKey(fileUrl);
  if (!key) return null;
  const slash = key.indexOf('/');
  if (slash <= 0) return null;
  return { userId: key.slice(0, slash), filename: key.slice(slash + 1) };
}

/** Storage object path inside the bucket — same as the canonical key. */
export function fileUrlToStoragePath(fileUrl: string): string | null {
  return fileUrlToStorageKey(fileUrl);
}

/**
 * Resolve a public file URL to an on-disk path. Returns null if the URL is
 * malformed or escapes the user's upload directory. Only meaningful in local
 * mode — in Supabase mode the file lives in Storage, not on disk.
 */
export function fileUrlToPath(fileUrl: string): string | null {
  const key = fileUrlToStorageKey(fileUrl);
  if (!key) return null;
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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type StorageFetchResult = {
  exists: boolean;
  attempts: number;
  lastError?: string;
};
