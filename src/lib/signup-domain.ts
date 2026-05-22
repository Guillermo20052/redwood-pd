/** Only new signups at /signup must use this domain. Login is unchanged for existing accounts. */
export const ALLOWED_SIGNUP_DOMAIN = '@liceodemonterrey.edu.mx';

export function isAllowedSignupEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(ALLOWED_SIGNUP_DOMAIN);
}

export const SIGNUP_DOMAIN_ERROR =
  'Este programa es exclusivo para docentes del Liceo de Monterrey. Tu email debe terminar en @liceodemonterrey.edu.mx. Si crees que esto es un error, contacta a la coordinadora.';
