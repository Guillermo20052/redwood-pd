/**
 * Parse/store task_file_url values. Single URL stored as plain string;
 * multiple URLs stored as JSON array string (no migration needed).
 */
export function parseTaskFileUrls(raw: string | null | undefined): string[] {
  if (raw == null) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
      }
    } catch {
      /* fall through to single URL */
    }
  }
  return [trimmed];
}

export function serializeTaskFileUrls(urls: string[]): string | null {
  const clean = urls.filter((u) => typeof u === 'string' && u.trim().length > 0);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

export function hasTaskFileUrl(raw: string | null | undefined): boolean {
  return parseTaskFileUrls(raw).length > 0;
}
