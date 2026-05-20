import meta from '../../content/meta.json';
import checklistData from '../../content/checklist.json';
import videosData from '../../content/videos.json';
import levelsData from '../../content/levels.json';
import reflectionData from '../../content/reflection.json';
import toolsData from '../../content/tools.json';
import sectionsToolsData from '../../content/sections-tools.json';
import sessionsB from '../../content/sessions-b.json';
import sessionsI from '../../content/sessions-i.json';
import sessionsA from '../../content/sessions-a.json';

export type ChecklistItem = {
  id: string;
  level: string;
  label: string;
  hours: number;
  group: string | null;
};

export type LevelMeta = {
  slug: string;
  id: string;
  name: string;
  color: string;
  heroClass: string;
  tagline: string;
  sessions: number;
  checklistHoursTarget: number;
  // Additive fields introduced with the 15-part curriculum.
  partCount?: number;
  totalHours?: number;
  hoursPerPart?: number;
};

export type VideoItem = {
  id: string;
  title: string;
  hours: number;
  url: string;
  level: string;
  // Additive fields.
  itemKey?: string;
  partNumber?: number;
  partTitle?: string;
  durationMinutes?: number;
  youtubeUrl?: string;
};

export type ReflectionPart = {
  partId: string;
  partTitle: string;
  prompt: string;
};

export type ReflectionLevelConfig = {
  level: number;
  name: string;
  questions: string[];
  // Additive fields.
  slug?: string;
  parts?: ReflectionPart[];
};

export const metaConfig = meta;
export const levels = levelsData.levels as LevelMeta[];
export const reflectionConfig = reflectionData as { levels: ReflectionLevelConfig[] };
export const tools = toolsData.tools;

export type SectionTool = {
  name: string;
  icon: string;
  desc: string;
  url: string;
};

/** Level-scoped tool grid from sections-tools.json (falls back to global tools). */
export function getToolsByLevel(level: string): SectionTool[] {
  const scoped = (sectionsToolsData as Record<string, SectionTool[]>)[level];
  return scoped?.length ? scoped : (toolsData.tools as SectionTool[]);
}

const hoursMap = checklistData.hours as Record<string, number>;

/** All trackable item keys with hours */
export function getAllHourItems(): { id: string; hours: number; kind: 'checklist' | 'video' }[] {
  const checklist = (checklistData.items as ChecklistItem[]).map((i) => ({
    id: i.id,
    hours: i.hours,
    kind: 'checklist' as const,
  }));
  const videos = (videosData.items as VideoItem[]).map((v) => ({
    id: v.id,
    hours: v.hours,
    kind: 'video' as const,
  }));
  const fromHours = Object.entries(hoursMap)
    .filter(([id]) => !checklist.some((c) => c.id === id) && !videos.some((v) => v.id === id))
    .map(([id, hours]) => ({
      id,
      hours,
      kind: id.includes('video') || id.startsWith('vc') ? ('video' as const) : ('checklist' as const),
    }));
  return [...checklist, ...videos, ...fromHours];
}

export function getChecklistByLevel(level: string) {
  return (checklistData.items as ChecklistItem[]).filter((i) => i.level === level);
}

export function getVideosByLevel(level: string) {
  return (videosData.items as VideoItem[]).filter((v) => v.level === level);
}

export type SessionDay = {
  name: string;
  theme: string;
  objective?: string;
  practiceTask?: string;
  transferTask?: string;
};

export type SessionWeek = {
  id: string;
  label: string;
  title?: string;
  objective?: string;
  days: SessionDay[];
};

const sessionsByLevel: Record<string, { weeks: SessionWeek[] }> = {
  b: sessionsB as { weeks: SessionWeek[] },
  i: sessionsI as { weeks: SessionWeek[] },
  a: sessionsA as { weeks: SessionWeek[] },
};

export function getSessionsByLevel(level: string) {
  return sessionsByLevel[level] || { weeks: [] };
}

export { checklistData, videosData, hoursMap };
