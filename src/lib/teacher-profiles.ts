/** True when a profile should appear in teacher cohort lists (not admin/coordinator). */
export function isTeacherProfile(role: string | null | undefined): role is 'teacher' {
  return role === 'teacher';
}
