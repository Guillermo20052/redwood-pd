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
      'OpenAI ofrece ChatGPT Edu para escuelas, pero tu cuenta personal gratuita ya cubre la mayoría de las tareas docentes. Regístrate gratis en chatgpt.com y empieza a usarlo de inmediato.',
    link: 'https://openai.com/chatgpt/education/',
    ctaLabel: 'Solicitar acceso',
    shortNote: 'ChatGPT Edu está disponible gratis para escuelas con email institucional',
  },
  Claude: {
    type: 'Edu Tier',
    title: 'Claude for Education',
    description:
      'Anthropic ofrece un plan gratuito generoso de Claude que cubre la mayoría de las tareas docentes. Crea una cuenta gratis con tu email y comienza a usarlo.',
    link: 'https://www.anthropic.com/education',
    ctaLabel: 'Solicitar acceso',
    shortNote: 'Claude for Education ofrece descuentos institucionales para docentes',
  },
  Perplexity: {
    type: 'Free Pro',
    title: 'Perplexity Pro para estudiantes y educadores',
    description:
      'Perplexity ofrece Perplexity Pro gratis o con descuento para usuarios con email educativo verificado. Regístrate con tu email del Liceo (@liceodemonterrey.edu.mx) para acceder.',
    link: 'https://www.perplexity.ai/students',
    ctaLabel: 'Obtener Pro gratis',
    shortNote: 'Perplexity Pro es gratis con email educativo del Liceo',
  },
  MagicSchool: {
    type: 'Completely Free',
    title: 'Gratis para docentes',
    description:
      'MagicSchool es 100% gratuito para docentes individuales. Regístrate con tu email del Liceo y obtén acceso completo. Su misión es ayudar a maestros.',
    link: 'https://www.magicschool.ai/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'MagicSchool es 100% gratuito para docentes',
  },
  Diffit: {
    type: 'Free for Teachers',
    title: 'Gratis para docentes',
    description:
      'Diffit ofrece su plan completo de manera gratuita para docentes. Regístrate con tu email institucional y empieza a nivelar lecturas hoy.',
    link: 'https://web.diffit.me/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Diffit es gratuito para docentes con email institucional',
  },
  NotebookLM: {
    type: 'Completely Free',
    title: 'Gratis con cuenta Google',
    description:
      'NotebookLM es completamente gratuito con cualquier cuenta de Google. Úsalo con tu cuenta del Liceo o personal — sin restricciones.',
    link: 'https://notebooklm.google/',
    ctaLabel: 'Abrir NotebookLM',
    shortNote: 'NotebookLM es gratis con tu cuenta de Google',
  },
  Canva: {
    type: 'Premium Free for Educators',
    title: 'Canva for Education — gratis para docentes',
    description:
      'Canva for Education es completamente gratuito para docentes verificados, incluyendo todas las funciones premium e IA (Magic Design, Magic Write, Magic Media). Solicítalo directamente con tu email del Liceo.',
    link: 'https://www.canva.com/education/',
    ctaLabel: 'Solicitar Canva for Education',
    shortNote: 'Canva for Education es gratis para docentes verificados',
  },
  Gemini: {
    type: 'Workspace Integration',
    title: 'Gemini para Google Workspace for Education',
    description:
      'Gemini está disponible gratis con cualquier cuenta de Google. Funciona dentro de Docs, Sheets, Slides y Gmail. Úsalo con tu cuenta del Liceo o personal.',
    link: 'https://workspace.google.com/industries/education/',
    ctaLabel: 'Ver opciones educativas',
    shortNote: 'Gemini está incluido o con descuento en Google Workspace for Education',
  },
  'Brisk Teaching': {
    type: 'Free Basic + Edu Pricing',
    title: 'Gratis para docentes',
    description:
      'Brisk Teaching ofrece su extensión de Chrome gratis para docentes. Instálala y conéctala con tu email institucional. Funciones premium con descuento educativo disponible al registrarte.',
    link: 'https://www.briskteaching.com/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Brisk Teaching es gratis para docentes en su plan básico',
  },
  Gamma: {
    type: 'Free Tier',
    title: 'Plan gratuito generoso + descuento educativo',
    description:
      'Gamma ofrece un plan gratuito generoso que cubre la mayoría de las necesidades docentes. Regístrate gratis y empieza a generar presentaciones.',
    link: 'https://gamma.app/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Gamma tiene un plan gratuito generoso para docentes',
  },
  'Napkin AI': {
    type: 'Free Tier',
    title: 'Plan gratuito generoso',
    description:
      'Napkin AI ofrece un plan gratuito amplio para uso académico. Suficiente para la mayoría de las tareas docentes — regístrate gratis y empieza.',
    link: 'https://www.napkin.ai/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'Napkin AI tiene un plan gratuito amplio para uso académico',
  },
  'Copilot Web': {
    type: 'Completely Free',
    title: 'Gratis para usuarios de Microsoft',
    description:
      'Copilot en copilot.microsoft.com es gratis para todos. Inicia sesión con cualquier cuenta de Microsoft (la del Liceo o personal) y empieza a usarlo.',
    link: 'https://copilot.microsoft.com/',
    ctaLabel: 'Abrir Copilot',
    shortNote: 'Copilot Web es gratis para todos los usuarios',
  },
  SchoolAI: {
    type: 'Free for Teachers',
    title: 'Plan docente gratuito',
    description:
      'SchoolAI ofrece un plan gratuito completo para docentes individuales, diseñado específicamente para uso pedagógico con alumnas. Regístrate con tu email del Liceo.',
    link: 'https://schoolai.com/',
    ctaLabel: 'Crear cuenta gratuita',
    shortNote: 'SchoolAI tiene un plan gratuito completo para docentes',
  },
  Khanmigo: {
    type: 'Completely Free for Teachers',
    title: 'Gratis para docentes verificados',
    description:
      'Khanmigo es completamente gratis para docentes a través de Khan Academy Teacher. Verifica tu rol de docente al registrarte y obtén acceso inmediato.',
    link: 'https://www.khanacademy.org/khan-labs',
    ctaLabel: 'Verificar como docente',
    shortNote: 'Khanmigo es gratis para docentes verificados en Khan Academy',
  },
  ElevenLabs: {
    type: 'Free Tier + Edu Discount',
    title: '10,000 caracteres gratis al mes + descuento educativo',
    description:
      'ElevenLabs ofrece 10,000 caracteres gratis cada mes en su plan free — suficiente para generar audios introductorios y de repaso. Regístrate con tu email del Liceo y empieza.',
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
