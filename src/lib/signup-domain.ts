/** Only new signups at /signup must use this domain. Login is unchanged for existing accounts. */
export const ALLOWED_SIGNUP_DOMAIN = '@liceodemonterrey.edu.mx';

export function isAllowedSignupEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(ALLOWED_SIGNUP_DOMAIN);
}

export const SIGNUP_DOMAIN_ERROR =
  'La Ruta de Desarrollo Profesional del Liceo de Monterrey Redwood es exclusiva para docentes del colegio. Tu email debe terminar en @liceodemonterrey.edu.mx. Si crees que esto es un error, contacta a la coordinadora.';
