/** Same PDF as the Prakash Nair resource card in level workspace (Modalidades tab). */
export const PRAKASH_NAIR_SPACES_PDF_URL =
  'https://aprenderapensar.net/wp-content/uploads/2016/11/Dise%C3%B1odeespacioseducativos.pdf';

export function teacherFirstName(fullName: string, email?: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  if (first) return first;
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
  }
  return 'Docente';
}
