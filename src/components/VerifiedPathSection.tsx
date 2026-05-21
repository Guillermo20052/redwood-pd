'use client';

import { useCallback, useRef } from 'react';
import { getPartsByLevel, verificationConfig } from '@/lib/curriculum-path';
import { getVisibleParts, isPartComplete } from '@/lib/part-progress';
import type { CompletionMap } from '@/lib/verification';
import { PartCard } from './PartCard';

type Props = {
  level: string;
  completions: CompletionMap;
  /** Kept for API compatibility; verifications now refresh completions via the hook. */
  onUpdated?: () => void;
  /** Kept for API compatibility; ignored under the composite-part UI. */
  filterType?: 'video' | 'task';
};

function NextPartTeaser({ partNumber }: { partNumber: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3"
      style={{
        minHeight: 80,
        border: '1px solid rgba(201, 151, 42, 0.3)',
        background: 'var(--gray-50)',
      }}
    >
      <span aria-hidden className="text-xl opacity-60">
        🔒
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)]">
          Próxima parte bloqueada
        </p>
        <p className="mt-0.5 text-sm text-[var(--gray-600)] leading-snug">
          Completa todas las etapas de Parte {partNumber} para desbloquear la siguiente.
        </p>
      </div>
    </div>
  );
}

function LevelCompleteCelebration() {
  return (
    <div
      className="rounded-lg px-5 py-4 text-center"
      style={{
        border: '1px solid #c5e6d0',
        background: 'var(--green-light)',
      }}
    >
      <div className="text-2xl" aria-hidden>
        ✅
      </div>
      <p
        className="mt-1 font-condensed text-lg font-extrabold"
        style={{ color: 'var(--teal)' }}
      >
        ¡Completaste el Nivel!
      </p>
      <p className="mt-1 text-sm text-[var(--gray-700)] leading-relaxed">
        Has terminado las 5 partes verificadas. Tu progreso del nivel está al 100%.
      </p>
    </div>
  );
}

export function VerifiedPathSection({ level, completions }: Props) {
  const parts = getPartsByLevel(level);
  const visibleParts = getVisibleParts(parts, completions);
  const allComplete = parts.length > 0 && parts.every((p) => isPartComplete(p, completions));
  const hasLockedNext = visibleParts.length < parts.length;
  const lastVisible = visibleParts[visibleParts.length - 1];

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setRef = useCallback((partId: string) => {
    return (el: HTMLElement | null) => {
      if (el) cardRefs.current.set(partId, el);
      else cardRefs.current.delete(partId);
    };
  }, []);

  const handlePartComplete = useCallback(
    (partId: string) => {
      const idx = parts.findIndex((p) => p.partId === partId);
      if (idx < 0 || idx >= parts.length - 1) return;
      const nextPart = parts[idx + 1];
      const nextEl = cardRefs.current.get(nextPart.partId);
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [parts]
  );

  return (
    <section>
      <div className="sec-hdr">
        <h2 className="sec-title">Ruta de aprendizaje verificada</h2>
        <span className="sec-pill">
          {parts.length} partes · Tarea {verificationConfig.taskEvidenceMinChars}+ · Reflexión{' '}
          {verificationConfig.reflectionMinChars ?? 80}+ caracteres
        </span>
      </div>

      <p className="text-sm text-[var(--gray-600)] mb-4" style={{ fontSize: 13, lineHeight: 1.55 }}>
        Tu ruta verificada: cada parte combina video, tarea con IA y reflexión. Avanza a tu ritmo —
        cada etapa se desbloquea al completar la anterior.
      </p>

      <div className="space-y-3">
        {visibleParts.map((part) => (
          <PartCard
            key={part.partId}
            ref={setRef(part.partId)}
            part={part}
            completions={completions}
            onPartComplete={handlePartComplete}
          />
        ))}

        {allComplete ? <LevelCompleteCelebration /> : null}

        {!allComplete && hasLockedNext && lastVisible ? (
          <NextPartTeaser partNumber={lastVisible.partNumber} />
        ) : null}
      </div>
    </section>
  );
}
