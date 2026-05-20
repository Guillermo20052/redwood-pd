#!/usr/bin/env node
/**
 * One-time extractor: parses Redwood_High_PD_IA_Docentes.html into content/*.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, '..', 'Redwood_High_PD_IA_Docentes.html');
const contentDir = path.join(root, 'content');
const assetsDir = path.join(root, 'public', 'assets');

fs.mkdirSync(contentDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

const html = fs.readFileSync(htmlPath, 'utf8');

// Extract checkHours from script
const hoursMatch = html.match(/const checkHours = \{([\s\S]*?)\};/);
if (!hoursMatch) throw new Error('checkHours not found');
const hoursRaw = hoursMatch[1];
const checkHours = {};
for (const m of hoursRaw.matchAll(/'([^']+)':\s*([\d.]+)/g)) {
  checkHours[m[1]] = parseFloat(m[2]);
}

// Checklist items
const checklist = [];
const checkRe = /<div class="check-item"><input type="checkbox" id="(cb-[^"]+)"[^>]*><label for="\1">([^<]*)<\/label><span class="check-hrs">([^<]*)<\/span><\/div>/g;
const checkRe2 = /<div class="check-item"><input type="checkbox" id="(cb-[^"]+)"[^>]*><label for="\1">([\s\S]*?)<\/label><span class="check-hrs">([^<]*)<\/span><\/div>/g;
const checkReSimple = /id="(cb-[bi][^"]+)"[^>]*><label for="cb-[^"]+">([\s\S]*?)<\/label><span class="check-hrs">([^<]*)<\/span>/g;
let cm;
const seen = new Set();
while ((cm = checkReSimple.exec(html)) !== null) {
  const id = cm[1];
  if (seen.has(id)) continue;
  seen.add(id);
  const level = id.startsWith('cb-b') ? 'b' : id.startsWith('cb-i') ? 'i' : 'a';
  checklist.push({
    id,
    level,
    label: cm[2].replace(/\s+/g, ' ').trim(),
    hours: checkHours[id] ?? (parseFloat(cm[3]) || 0.2),
    group: null,
  });
}

// Video items
const videos = [];
const vidRe = /id="(vc\d+)"[^>]*><label for="vc\d+">Marcar como visto: ([^<]*)<\/label><span class="vhrs">([^<]*)<\/span>/g;
while ((cm = vidRe.exec(html)) !== null) {
  const id = cm[1];
  const titleMatch = html.slice(Math.max(0, cm.index - 800), cm.index).match(/vcrd-title">([^<]+)</);
  const urlMatch = html.slice(Math.max(0, cm.index - 800), cm.index).match(/href="(https:\/\/www\.youtube\.com\/[^"]+)"/);
  videos.push({
    id,
    title: titleMatch ? titleMatch[1].replace(/^🇪🇸\s*/, '').trim() : cm[2].trim(),
    hours: checkHours[id] ?? (parseFloat(cm[3].replace('h', '')) || 0.25),
    url: urlMatch ? urlMatch[1] : null,
    level: inferVideoLevel(id, html),
  });
}

function inferVideoLevel(vcId, src) {
  const num = parseInt(vcId.replace('vc', ''), 10);
  if (num <= 19) return 'b';
  if (num <= 28) return 'i';
  return 'a';
}

// Extract base64 logos
let logoIdx = 0;
const logoRe = /src="(data:image\/png;base64,[^"]+)"/g;
while ((cm = logoRe.exec(html)) !== null) {
  const data = cm[1];
  const b64 = data.split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  const name = logoIdx === 0 ? 'logo-header.png' : `logo-diploma-${logoIdx}.png`;
  fs.writeFileSync(path.join(assetsDir, name), buf);
  logoIdx++;
  if (logoIdx >= 4) break;
}

// Meta
const meta = {
  title: 'Redwood High · Ruta de Desarrollo Profesional con IA',
  school: 'Redwood High School',
  location: 'Monterrey, N.L., México',
  totalGoalHours: 20,
  programMaxHours: 30,
  diplomaTiers: [
    { tier: 1, hours: 20, name: 'Docente IA Consciente' },
    { tier: 2, hours: 24, name: 'Docente IA Innovadora' },
    { tier: 3, hours: 30, name: 'Docente IA Transformadora' },
  ],
  levelLocks: {
    unlockLevel2Hours: 3,
    unlockLevel3Hours: 9,
    level2Prefix: 'cb-b',
    level3Prefixes: ['cb-b', 'cb-i'],
  },
  contentVersion: '2025-2026',
  updatedAt: new Date().toISOString().split('T')[0],
};

// Level metadata
const levels = [
  {
    slug: 'b',
    id: 'fundamentos',
    name: 'Nivel 1 · Fundamentos',
    color: '#5B8DD9',
    heroClass: 'lh-b',
    tagline: 'Conciencia y primeros pasos con IA en el aula IB',
    sessions: 3,
    checklistHoursTarget: 3,
  },
  {
    slug: 'i',
    id: 'integracion',
    name: 'Nivel 2 · Integración',
    color: '#2AB09A',
    heroClass: 'lh-i',
    tagline: 'Integrar IA en planeación, evaluación y diferenciación',
    sessions: 4,
    checklistHoursTarget: 6,
  },
  {
    slug: 'a',
    id: 'transformacion',
    name: 'Nivel 3 · Transformación',
    color: '#E8455A',
    heroClass: 'lh-a',
    tagline: 'Flujos de trabajo avanzados y liderazgo con IA',
    sessions: 3,
    checklistHoursTarget: 9,
  },
];

// Reflection questions per level
const reflection = {
  levels: [
    {
      level: 1,
      name: 'Nivel 1 · Conciencia',
      questions: [
        '¿Qué cambió en mi práctica docente al usar IA esta semana?',
        '¿Qué creencias sobre la enseñanza cambiaron o se reforzaron?',
        '¿Qué haré diferente en mi próxima clase gracias a lo aprendido?',
      ],
    },
    {
      level: 2,
      name: 'Nivel 2 · Práctica',
      questions: [
        '¿Qué cambió en mi práctica?',
        '¿Qué creencias cambiaron?',
        '¿Qué haré diferente?',
      ],
    },
    {
      level: 3,
      name: 'Nivel 3 · Transformación',
      questions: [
        '¿Qué cambió en mi práctica?',
        '¿Qué creencias cambiaron?',
        '¿Qué le dirías a una colega que está a punto de iniciar el Nivel 1?',
      ],
    },
  ],
};

// Tools (2025-2026 refresh)
const tools = [
  { name: 'ChatGPT', icon: '🤖', desc: 'Planificación, redacción de contenido', url: 'https://chat.openai.com' },
  { name: 'Claude', icon: '💬', desc: 'Rúbricas, retroalimentación, documentos largos', url: 'https://claude.ai' },
  { name: 'Gemini', icon: '🌐', desc: 'Integración Google, investigación', url: 'https://gemini.google.com' },
  { name: 'NotebookLM', icon: '📓', desc: 'Fuentes propias, guías de estudio', url: 'https://notebooklm.google.com' },
  { name: 'MagicSchool.ai', icon: '🏫', desc: 'Herramientas de IA específicas para educación', url: 'https://www.magicschool.ai' },
  { name: 'Diffit.me', icon: '📋', desc: 'Nivelación de texto y diferenciación', url: 'https://www.diffit.me' },
  { name: 'Canva', icon: '🎨', desc: 'Recursos visuales con IA', url: 'https://www.canva.com' },
];

// Fill missing checklist keys from hours map
for (const [id, hours] of Object.entries(checkHours)) {
  if (!id.startsWith('cb-')) continue;
  if (seen.has(id)) continue;
  seen.add(id);
  const level = id.startsWith('cb-b') ? 'b' : id.startsWith('cb-i') ? 'i' : 'a';
  checklist.push({
    id,
    level,
    label: `Tarea ${id}`,
    hours,
    group: null,
  });
}

fs.writeFileSync(path.join(contentDir, 'meta.json'), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(contentDir, 'checklist.json'), JSON.stringify({ items: checklist, hours: checkHours }, null, 2));
fs.writeFileSync(path.join(contentDir, 'videos.json'), JSON.stringify({ items: videos }, null, 2));
fs.writeFileSync(path.join(contentDir, 'levels.json'), JSON.stringify({ levels }, null, 2));
fs.writeFileSync(path.join(contentDir, 'reflection.json'), JSON.stringify(reflection, null, 2));
fs.writeFileSync(path.join(contentDir, 'tools.json'), JSON.stringify({ tools }, null, 2));

// Schema
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Redwood PD Content',
  properties: {
    meta: { type: 'object' },
    checklist: { type: 'object' },
    videos: { type: 'object' },
    levels: { type: 'object' },
    reflection: { type: 'object' },
    tools: { type: 'object' },
  },
};
fs.writeFileSync(path.join(contentDir, 'schema.json'), JSON.stringify(schema, null, 2));

// Build curriculum path: videos by level order, then checklist by id number
const curriculumPath = [];
let order = 0;
for (const lvl of ['b', 'i', 'a']) {
  const lvlVideos = videos.filter((v) => v.level === lvl).sort((a, b) => a.id.localeCompare(b.id));
  for (const v of lvlVideos) {
    curriculumPath.push({ order: order++, itemKey: v.id, type: 'video', level: lvl, hours: v.hours, label: v.title, youtubeUrl: v.url });
  }
  const lvlCheck = checklist.filter((c) => c.level === lvl).sort((a, b) => {
    const na = parseInt(a.id.replace(/\D/g, ''), 10);
    const nb = parseInt(b.id.replace(/\D/g, ''), 10);
    return na - nb;
  });
  for (const c of lvlCheck) {
    curriculumPath.push({ order: order++, itemKey: c.id, type: 'task', level: lvl, hours: c.hours, label: c.label });
  }
}

meta.verification = {
  videoWatchThreshold: 0.8,
  taskEvidenceMinChars: 120,
  sequentialPath: true,
};

fs.writeFileSync(path.join(contentDir, 'curriculum-path.json'), JSON.stringify({ path: curriculumPath }, null, 2));
fs.writeFileSync(path.join(contentDir, 'meta.json'), JSON.stringify(meta, null, 2));

// Extract tools grid HTML snippet per level from HTML (simplified: use tools.json for all)
const toolsHtml = { b: tools, i: tools, a: tools };
fs.writeFileSync(path.join(contentDir, 'sections-tools.json'), JSON.stringify(toolsHtml, null, 2));

function extractSessions(secId) {
  const start = html.indexOf(`id="${secId}"`);
  if (start < 0) return { weeks: [] };
  let end = html.length;
  for (const m of ['id="vid-', 'id="tools-', 'id="mod-', 'id="ib-', 'id="chk-']) {
    const i = html.indexOf(m, start + 20);
    if (i > start && i < end) end = i;
  }
  const sec = html.slice(start, end);
  const weeks = [];
  const weekParts = sec.split(/<motion_div id="wk-/).length > 1
    ? sec.split(/<motion_div id="wk-/)
    : sec.split(/<div id="wk-/);
  const parts = weekParts.length > 1 ? weekParts.slice(1) : sec.split(/<div id="wk-[^"]+" class="wk-content"/).slice(1);
  parts.forEach((part, wkIdx) => {
    const titleMatch = part.match(/font-size:13px;font-weight:700">([^<]+)</);
    const objMatch = part.match(/font-size:11px;color:var\(--gray-500\)[^>]*>([^<]+)</);
    const days = [];
    for (const chunk of part.split('<div class="day-card"').slice(1)) {
      const name = (chunk.match(/day-name">([^<]+)/) || [])[1]?.trim() || 'Momento';
      const theme = (chunk.match(/day-theme">([^<]+)/) || [])[1]?.trim() || '';
      const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const objective = strip((chunk.match(/Objetivo del d[\u00ed]a<\/div><div class="task-txt">([\s\S]*?)<\/motion_div>/) || chunk.match(/Objetivo del d[\u00ed]a<\/div><div class="task-txt">([\s\S]*?)<\/div>/) || [])[1]);
      const practiceTask = strip((chunk.match(/Tarea de pr[\u00e1]ctica<\/div><div class="task-txt">([\s\S]*?)<\/div>/) || [])[1]);
      const transferTask = strip((chunk.match(/Transferencia al aula<\/div><div class="task-txt">([\s\S]*?)<\/div>/) || [])[1]);
      if (name || theme) days.push({ name, theme, objective, practiceTask, transferTask });
    }
    weeks.push({
      id: `s${wkIdx + 1}`,
      label: `Sesión ${wkIdx + 1}`,
      title: titleMatch ? titleMatch[1].trim() : '',
      objective: objMatch ? objMatch[1].trim() : '',
      days,
    });
  });
  return { weeks };
}

const sessions = {
  b: extractSessions('wk-b'),
  i: extractSessions('wk-i'),
  a: extractSessions('wk-a'),
};
for (const lvl of ['b', 'i', 'a']) {
  fs.writeFileSync(path.join(contentDir, `sessions-${lvl}.json`), JSON.stringify(sessions[lvl], null, 2));
}

console.log(`Extracted: ${checklist.length} checklist, ${videos.length} videos, ${curriculumPath.length} path items, ${logoIdx} logos`);
console.log(`Sessions: b=${sessions.b.weeks.length}w, i=${sessions.i.weeks.length}w, a=${sessions.a.weeks.length}w`);
console.log(`Written to ${contentDir}`);
