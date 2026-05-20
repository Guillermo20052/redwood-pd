import pathData from '../../content/curriculum-path.json';
import meta from '../../content/meta.json';

export type PathStage = 'video' | 'task' | 'reflection';

export type PathItem = {
  order: number;
  itemKey: string;
  /**
   * Mirror of `stage`; kept narrow for back-compat with `verifyTask`/`verifyVideo`
   * which narrow on `type === 'task'` / `type === 'video'`.
   */
  type: PathStage;
  level: string;
  hours: number;
  label: string;
  youtubeUrl?: string | null;
  // --- Additive fields introduced with the 15-part curriculum. Optional so older
  // consumers keep compiling; new UI may rely on them.
  stage?: PathStage;
  partId?: string;
  partNumber?: number;
  partTitle?: string;
  primaryTools?: string[];
  collaborative?: boolean;
  taskPrompt?: string;
  taskRubric?: string;
  reflectionPrompt?: string;
};

export const curriculumPath = pathData.path as PathItem[];

export type VerificationConfig = {
  videoWatchThreshold: number;
  taskEvidenceMinChars: number;
  sequentialPath: boolean;
  reflectionMinChars?: number;
};

export const verificationConfig = meta.verification as VerificationConfig;

export function getPathItem(itemKey: string) {
  return curriculumPath.find((p) => p.itemKey === itemKey);
}

export function getPreviousItem(itemKey: string): PathItem | null {
  const idx = curriculumPath.findIndex((p) => p.itemKey === itemKey);
  if (idx <= 0) return null;
  return curriculumPath[idx - 1];
}

export function getPathByLevel(level: string) {
  return curriculumPath.filter((p) => p.level === level);
}

export type PartStages = {
  video?: PathItem;
  task?: PathItem;
  reflection?: PathItem;
};

export type PartGroup = {
  partId: string;
  partNumber: number;
  partTitle: string;
  primaryTools: string[];
  collaborative: boolean;
  level: string;
  /** Sum of hours across the three stages. */
  totalHours: number;
  /** Convenience alias kept for older callers. */
  hours: number;
  /** Ordered array of the underlying path items in this part. */
  items: PathItem[];
  /** Direct accessors for each stage's path item. */
  stages: PartStages;
};

/** Group items by partId, preserving the original curriculum order. */
export function getPartsByLevel(level: string): PartGroup[] {
  const items = getPathByLevel(level);
  const order: string[] = [];
  const groups = new Map<string, PathItem[]>();
  for (const item of items) {
    const id = item.partId ?? item.itemKey;
    if (!groups.has(id)) {
      groups.set(id, []);
      order.push(id);
    }
    groups.get(id)!.push(item);
  }
  return order.map((partId) => {
    const partItems = groups.get(partId)!;
    const head = partItems[0];
    const stages: PartStages = {};
    for (const it of partItems) {
      const key = (it.stage ?? it.type) as keyof PartStages;
      if (key === 'video' || key === 'task' || key === 'reflection') {
        stages[key] = it;
      }
    }
    const totalHours = partItems.reduce((sum, i) => sum + i.hours, 0);
    return {
      partId,
      partNumber: head.partNumber ?? 0,
      partTitle: head.partTitle ?? head.label,
      primaryTools: head.primaryTools ?? [],
      collaborative: head.collaborative ?? false,
      level: head.level,
      totalHours,
      hours: totalHours,
      items: partItems,
      stages,
    };
  });
}
