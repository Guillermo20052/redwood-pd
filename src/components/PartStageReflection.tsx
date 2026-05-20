'use client';

import { useState } from 'react';
import { useProgressContext } from './Providers';
import { verificationConfig, type PathItem } from '@/lib/curriculum-path';

type Props = {
  item: PathItem;
  onVerified: () => void;
};

export function PartStageReflection({ item, onVerified }: Props) {
  const { verifyReflection } = useProgressContext();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const min = verificationConfig.reflectionMinChars ?? 80;
  const len = text.trim().length;
  const meets = len >= min;

  const submit = async () => {
    if (submitting || !meets) return;
    setSubmitting(true);
    setError('');
    try {
      await verifyReflection(item.itemKey, text);
      onVerified();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="stage-label">Etapa 3 de 3 · Reflexión</p>

      {item.reflectionPrompt && (
        <div className="stage-prompt-card stage-prompt-card--lavender">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C5CBF] mb-1">
            Pregunta de reflexión
          </p>
          <p className="whitespace-pre-wrap">{item.reflectionPrompt}</p>
        </div>
      )}

      <div>
        <textarea
          className="rw-textarea"
          placeholder={`Escribe 2–3 oraciones (mín. ${min} caracteres)…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          disabled={submitting}
        />
        <p className={`char-counter ${meets ? '' : 'warn'}`}>
          {len} / {min} caracteres
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={!meets || submitting}
        >
          {submitting ? 'Enviando…' : 'Enviar reflexión'}
        </button>
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      </div>
    </div>
  );
}
