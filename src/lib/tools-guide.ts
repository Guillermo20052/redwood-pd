import toolsGuideData from '@/content/tools-guide.json';

export type ToolLevel = 'b' | 'i' | 'a';

export type ToolGuideEntry = {
  name: string;
  vendor: string;
  level: ToolLevel;
  icon: string;
  bestFor: string[];
  notIdealFor: string[];
  fileTypes: string;
  example: string;
  alternativeWhen: string;
};

export const TOOLS_GUIDE: ToolGuideEntry[] = toolsGuideData as ToolGuideEntry[];

export const TOOL_LEVEL_FILTERS = [
  { id: 'all' as const, label: 'Todas' },
  { id: 'b' as const, label: 'Nivel 1' },
  { id: 'i' as const, label: 'Nivel 2' },
  { id: 'a' as const, label: 'Nivel 3' },
];
