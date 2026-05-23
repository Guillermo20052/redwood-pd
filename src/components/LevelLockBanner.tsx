'use client';

import { getLevelHours, isLevelUnlocked } from '@/lib/progress';
import type { CompletionMap } from '@/lib/verification';
import { metaConfig } from '@/lib/content';

export function LevelLockBanner({
  level,
  checked,
}: {
  level: 'i' | 'a';
  checked: CompletionMap;
}) {
  if (isLevelUnlocked(checked, level)) return null;

  const l1 = getLevelHours(checked, 'b');
  const l2 = getLevelHours(checked, 'i');
  const target = level === 'i' ? metaConfig.levelLocks.unlockLevel2Hours : metaConfig.levelLocks.unlockLevel3Hours;
  const current = level === 'i' ? l1 : l1 + l2;
  const pct = Math.min(100, (current / target) * 100);

  return (
    <div className="lock-banner text-center text-white mb-8">
      <h3 className="font-condensed text-xl font-extrabold mb-2">🔒 Nivel bloqueado</h3>
      <p className="text-sm text-white/70 mb-4">
        {level === 'i'
          ? `Completa ${metaConfig.levelLocks.unlockLevel2Hours}h del Nivel 1 para desbloquear.`
          : `Completa ${metaConfig.levelLocks.unlockLevel3Hours}h acumuladas en Niveles 1 y 2.`}
      </p>
      <div className="inline-flex items-center gap-3 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold">
        <div className="w-40 h-2 rounded bg-white/20 overflow-hidden">
          <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        {current.toFixed(1)} / {target}h
      </div>
    </div>
  );
}
