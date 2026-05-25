export type EducatorPerk = {
  type: string;
  title: string;
  description: string;
  link: string;
  ctaLabel: string;
  /** Short one-liner for part banners */
  shortNote: string;
};

/** Canonical educator perks keyed by display name used in sections-tools.json */
export const EDUCATOR_PERKS: Record<string, EducatorPerk> = {
  ChatGPT: {
    type: 'Edu Free Tier',
    title: 'ChatGPT Edu — versión gratuita para educadores con email institucional',
    description:
      'OpenAI ofrece ChatGPT Edu gratis para escuelas que se inscriban institucionalmente. Verifica con coordinación si Redwood ya tiene acceso o solicita información.',
    link: 'https://openai.com/chatgpt/education/',
    ctaLabel: 'Solicitar acceso',
    shortNote: 'ChatGPT Edu está disponible gratis para escuelas con email institucional',
  },
  Claude: {
    type: 'Edu Tier',
    title: 'Claude for Education',
    description:
      'Anthropic ofrece Claude for Education con descuentos institucionales. Tu cuenta personal gratuita ya incluye uso considerable; pide a coordinación info sobre licencias institucionales.',
    link: 'https://www.anthropic.com/education',
    ctaLabel: 'Solicitar acceso',
    shortNote: 'Claude for Education ofrece descuentos institucionales para docentes',
  },
  Perplexity: {
    type: 'Free Pro',
    title: 'Perplexity Pro para estudiantes y educadores',
    description:
      'Perplexity ofrece Perplexity Pro gratis o con descuento para usuarios con email educativo verificado. Regístrate con tu email del Liceo para acceder.',
    link: 'https://www.perplexity.ai/students',
    ctaLabel: 'Obtener Pro gratis',
    shortNote: 'Perplexity Pro es gratis con email educativo del Liceo',
  },
  MagicSchool: {
    type: 'Completely Free',
    title: 'Gratis para docentes',
    description:
      'MagicSchool es 100% gratuito para docentes individuales. Solo necesitas registrarte con tu email del Liceo. Su misión es ayudar a maestros.',
    link: 'https://www.magicschool.ai/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'MagicSchool es 100% gratuito para docentes',
  },
  Diffit: {
    type: 'Free for Teachers',
    title: 'Gratis para docentes',
    description:
      'Diffit ofrece su plan completo de manera gratuita para docentes. Regístrate con tu email institucional.',
    link: 'https://web.diffit.me/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Diffit es gratuito para docentes con email institucional',
  },
  NotebookLM: {
    type: 'Completely Free',
    title: 'Gratis con cuenta Google',
    description:
      'NotebookLM es completamente gratuito con cualquier cuenta de Google. Si el Liceo usa Google Workspace, úsalo con tu cuenta institucional.',
    link: 'https://notebooklm.google/',
    ctaLabel: 'Abrir NotebookLM',
    shortNote: 'NotebookLM es gratis con tu cuenta de Google',
  },
  Canva: {
    type: 'Premium Free for Educators',
    title: 'Canva for Education — gratis para docentes',
    description:
      'Canva for Education es completamente gratuito para docentes verificados, incluyendo todas las funciones premium e IA (Magic Design, Magic Write, etc.). Solicítalo con tu email del Liceo.',
    link: 'https://www.canva.com/education/',
    ctaLabel: 'Solicitar Canva for Education',
    shortNote: 'Canva for Education es gratis para docentes verificados',
  },
  Gemini: {
    type: 'Workspace Integration',
    title: 'Gemini para Google Workspace for Education',
    description:
      'Si el Liceo usa Google Workspace for Education, Gemini está incluido o disponible con descuento. Verifica con coordinación o usa tu cuenta personal con la versión gratuita.',
    link: 'https://workspace.google.com/industries/education/',
    ctaLabel: 'Ver opciones educativas',
    shortNote: 'Gemini está incluido o con descuento en Google Workspace for Education',
  },
  'Brisk Teaching': {
    type: 'Free Basic + Edu Pricing',
    title: 'Gratis para docentes',
    description:
      'Brisk Teaching ofrece su extensión de Chrome y funciones básicas gratis para docentes. Funciones premium con descuento educativo.',
    link: 'https://www.briskteaching.com/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Brisk Teaching es gratis para docentes en su plan básico',
  },
  Gamma: {
    type: 'Free Tier',
    title: 'Plan gratuito generoso + descuento educativo',
    description:
      'Gamma ofrece un plan gratuito amplio que cubre la mayoría de necesidades docentes. Para uso intensivo, consulta su descuento educativo.',
    link: 'https://gamma.app/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Gamma tiene un plan gratuito generoso para docentes',
  },
  'Napkin AI': {
    type: 'Free Tier',
    title: 'Plan gratuito generoso',
    description:
      'Napkin AI ofrece un plan gratuito amplio para uso académico. Suficiente para la mayoría de las tareas docentes sin necesidad de pagar.',
    link: 'https://www.napkin.ai/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Napkin AI tiene un plan gratuito amplio para uso académico',
  },
  'Copilot Web': {
    type: 'Completely Free',
    title: 'Gratis para usuarios de Microsoft',
    description:
      'Copilot en copilot.microsoft.com es gratis para todos. Si el Liceo usa Microsoft 365 for Education, hay funciones adicionales integradas.',
    link: 'https://copilot.microsoft.com/',
    ctaLabel: 'Abrir Copilot',
    shortNote: 'Copilot Web es gratis para todos los usuarios',
  },
  SchoolAI: {
    type: 'Free for Teachers',
    title: 'Plan docente gratuito',
    description:
      'SchoolAI ofrece un plan gratuito completo para docentes individuales, diseñado específicamente para uso pedagógico con alumnas.',
    link: 'https://schoolai.com/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'SchoolAI tiene un plan gratuito completo para docentes',
  },
  Khanmigo: {
    type: 'Completely Free for Teachers',
    title: 'Gratis para docentes verificados',
    description:
      'Khanmigo es completamente gratis para docentes a través de Khan Academy Teacher. Solo necesitas verificar tu rol de docente.',
    link: 'https://www.khanacademy.org/khan-labs',
    ctaLabel: 'Verificar como docente',
    shortNote: 'Khanmigo es gratis para docentes verificados en Khan Academy',
  },
  ElevenLabs: {
    type: 'Free Tier + Edu Discount',
    title: '10,000 caracteres gratis al mes + descuento educativo',
    description:
      'ElevenLabs ofrece 10,000 caracteres gratis cada mes en su plan free. Para uso más intensivo, contactan ofrecen descuento educativo en planes pagados.',
    link: 'https://elevenlabs.io/pricing',
    ctaLabel: 'Ver plan gratuito',
    shortNote: 'ElevenLabs incluye 10,000 caracteres gratis al mes',
  },
};

const ALIASES: Record<string, string> = {
  magicschool: 'MagicSchool',
  'magic school': 'MagicSchool',
  'magicschool ai': 'MagicSchool',
  brisk: 'Brisk Teaching',
  copilot: 'Copilot Web',
  'copilot web': 'Copilot Web',
  'napkin ai': 'Napkin AI',
  napkin: 'Napkin AI',
};

function normalizeToolName(name: string): string {
  return name.trim().toLowerCase();
}

export function getEducatorPerk(toolName: string | undefined | null): EducatorPerk | null {
  if (!toolName?.trim()) return null;
  const trimmed = toolName.trim();
  if (EDUCATOR_PERKS[trimmed]) return EDUCATOR_PERKS[trimmed];
  const aliasKey = ALIASES[normalizeToolName(trimmed)];
  if (aliasKey) return EDUCATOR_PERKS[aliasKey] ?? null;
  const lower = normalizeToolName(trimmed);
  for (const [key, perk] of Object.entries(EDUCATOR_PERKS)) {
    if (normalizeToolName(key) === lower || lower.includes(normalizeToolName(key))) {
      return perk;
    }
  }
  return null;
}

export function attachEducatorPerk<T extends { name: string }>(tool: T): T & { educatorPerk?: EducatorPerk } {
  const perk = getEducatorPerk(tool.name);
  return perk ? { ...tool, educatorPerk: perk } : tool;
}
