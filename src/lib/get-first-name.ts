const COMPOUND_FIRST = new Set([
  'maría josé',
  'maria jose',
  'ana maría',
  'ana maria',
  'josé maría',
  'jose maria',
  'luís miguel',
  'luis miguel',
  'maría elena',
  'maria elena',
  'juan carlos',
  'maría fernanda',
  'maria fernanda',
]);

function capitalizeWord(word: string): string {
  if (!word) return '';
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function nameFromEmail(email: string): string {
  const local = (email.split('@')[0] ?? '').trim();
  if (!local) return '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
}

function extractFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return capitalizeWord(parts[0]!);

  if (parts.length >= 4) {
    return `${capitalizeWord(parts[0]!)} ${capitalizeWord(parts[1]!)}`;
  }

  if (parts.length === 3) {
    const pair = `${parts[0]!.toLowerCase()} ${parts[1]!.toLowerCase()}`;
    if (COMPOUND_FIRST.has(pair)) {
      return `${capitalizeWord(parts[0]!)} ${capitalizeWord(parts[1]!)}`;
    }
    return capitalizeWord(parts[0]!);
  }

  return capitalizeWord(parts[0]!);
}

/** First given name(s) for dashboard greeting. Falls back to email local-part. */
export function getFirstName(fullName: string, email?: string): string {
  const trimmed = fullName.trim();
  const resolved = trimmed || nameFromEmail(email ?? '');
  const first = extractFirstName(resolved);
  return first || 'Docente';
}
