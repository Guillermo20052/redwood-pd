'use client';

import { useCallback, useRef } from 'react';
import { getPartsByLevel, verificationConfig } from '@/lib/curriculum-path';
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

export function VerifiedPathSection({ level, completions }: Props) {
  const parts = getPartsByLevel(level);
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
        {parts.map((part) => (
          <PartCard
            key={part.partId}
            ref={setRef(part.partId)}
            part={part}
            completions={completions}
            onPartComplete={handlePartComplete}
          />
        ))}
      </div>
    </section>
  );
}
