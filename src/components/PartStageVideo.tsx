'use client';

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useProgressContext } from './Providers';
import type { PathItem } from '@/lib/curriculum-path';

type Props = {
  item: PathItem;
  level: 'b' | 'i' | 'a';
  onVerified: () => void;
};

export function PartStageVideo({ item, level, onVerified }: Props) {
  const { verifyVideo } = useProgressContext();
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState('');

  const allowSkip = level === 'b';

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    setSkipError('');
    try {
      await verifyVideo(item.itemKey, 1, true);
      onVerified();
    } catch (e) {
      setSkipError((e as Error).message);
      setSkipping(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="stage-label">Etapa 1 de 3 · Video</p>

      <div className="video-frame">
        <VideoPlayer
          itemKey={item.itemKey}
          youtubeUrl={item.youtubeUrl}
          level={level}
          onVerified={onVerified}
        />
      </div>

      {allowSkip && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping}
            className="btn-outline disabled:opacity-50"
          >
            {skipping ? 'Saltando…' : 'Saltar video'}
          </button>
          <span className="text-[10px] text-[var(--gray-500)]">
            Solo disponible en Nivel 1
          </span>
        </div>
      )}

      {skipError && <p className="text-xs text-[var(--red)]">{skipError}</p>}
    </div>
  );
}
