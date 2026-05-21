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
  const { verifyVideo, profile } = useProgressContext();
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState('');

  const isAdmin = profile.role === 'admin';
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

  const handleAdminSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    setSkipError('');
    try {
      const res = await fetch('/api/verify/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey: item.itemKey, watchPct: 1, skipped: true, adminSkip: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error al saltar');
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

      {item.videoDescription?.trim() ? (
        <p
          className="text-[var(--gray-600)] leading-relaxed"
          style={{ fontSize: 14, lineHeight: 1.55 }}
        >
          {item.videoDescription.trim()}
        </p>
      ) : null}

      {allowSkip && !isAdmin && (
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

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleAdminSkip}
            disabled={skipping}
            style={{
              background: 'color-mix(in srgb, var(--gold) 20%, transparent)',
              border: '1.5px solid var(--gold)',
              color: 'var(--gold)',
              fontWeight: 700,
            }}
            className="rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {skipping ? 'Saltando…' : 'Saltar video (admin)'}
          </button>
          <span className="text-[10px] text-[var(--gray-500)]">
            Vista admin — no registra progreso
          </span>
        </div>
      )}

      {skipError && <p className="text-xs text-[var(--red)]">{skipError}</p>}
    </div>
  );
}
