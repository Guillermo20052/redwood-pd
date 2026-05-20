import ancillaryData from './level-ancillary.generated.json';

export type ModalityCard = {
  name: string;
  how: string;
  example: string;
};

export type IbCard = {
  title: string;
  items: string[];
};

export type SubjectApplication = {
  title: string;
  prompt: string;
};

export type SubjectCard = {
  icon: string;
  name: string;
  applications: SubjectApplication[];
  highlight?: boolean;
};

export type SkillItem = {
  name: string;
  how: string;
  atlClass: string;
  atlLabel: string;
};

export type SkillBlock = {
  label: string;
  items: SkillItem[];
};

export type LevelSkills = {
  introTag: string;
  intro: string;
  blocks: SkillBlock[];
};

export type LevelAncillary = {
  modalities: ModalityCard[];
  ib: IbCard[];
  subjects: SubjectCard[];
  skills: LevelSkills;
};

const MOD_PILL: Record<string, string> = {
  b: '5 Modalidades · Nivel 1',
  i: '7 Modalidades · Nivel 2',
  a: '8 Modalidades · Nivel 3',
};

const SUBJ_PILL: Record<string, string> = {
  b: 'Nivel 1 · Todas las Materias',
  i: 'Nivel 2 · Integración',
  a: 'Nivel 3 · Transformación',
};

export function getLevelAncillary(level: string): LevelAncillary {
  const data = (ancillaryData as Record<string, LevelAncillary>)[level];
  if (!data) {
    return { modalities: [], ib: [], subjects: [], skills: { introTag: '', intro: '', blocks: [] } };
  }
  return data;
}

export function getModalitiesPill(level: string): string {
  return MOD_PILL[level] ?? 'Modalidades Prakash Nair';
}

export function getSubjectsPill(level: string): string {
  return SUBJ_PILL[level] ?? 'Aplicaciones por Materia';
}
