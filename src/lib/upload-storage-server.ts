import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  STORAGE_BUCKET,
  getUploadDir,
  isSupabaseStorageMode,
  parseUploadUrl,
  sleep,
  storageKeyToFileUrl,
  type StorageFetchResult,
} from '@/lib/upload-storage';

export type { StorageFetchResult };

/** Check whether a storage object exists, with retries for eventual consistency. */
export async function storageObjectExistsWithRetry(
  key: string,
  options?: { maxAttempts?: number; delayMs?: number; userId?: string }
): Promise<StorageFetchResult> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const delayMs = options?.delayMs ?? 500;
  const logUserId = options?.userId;

  if (!isSupabaseStorageMode()) {
    const parsed = parseUploadUrl(storageKeyToFileUrl(key));
    if (!parsed) {
      return { exists: false, attempts: 1, lastError: 'invalid key' };
    }
    const localPath = path.join(getUploadDir(parsed.userId), parsed.filename);
    const exists = fs.existsSync(localPath);
    console.log('Storage fetch', {
      key,
      attempt: 1,
      success: exists,
      mode: 'local',
      userId: logUserId,
    });
    return { exists, attempts: 1, lastError: exists ? undefined : 'not on disk' };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { exists: false, attempts: 0, lastError: 'missing admin client' };
  }

  let lastError: string | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(key);
    const success = !error && !!data;
    console.log('Storage fetch', {
      key,
      bucket: STORAGE_BUCKET,
      attempt,
      success,
      error: error?.message,
      userId: logUserId,
    });
    if (success) {
      return { exists: true, attempts: attempt };
    }
    lastError = error?.message ?? 'download returned no data';
    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  return { exists: false, attempts: maxAttempts, lastError };
}
