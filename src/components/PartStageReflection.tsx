'use client';

import { useState } from 'react';
import { useProgressContext } from './Providers';
import { verificationConfig, type PathItem } from '@/lib/curriculum-path';

type Props = {
  item: PathItem;
  onVerified: () => void;
};

export function PartStageReflection({ item, onVerified }: Props) {
  const { verifyReflection, markAdminSkipped, profile } = useProgressContext();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adminSkipping, setAdminSkipping] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = profile.role === 'admin';

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

  const handleAdminSkip = async () => {
    if (adminSkipping) return;
    setAdminSkipping(true);
    setError('');
    try {
      const res = await fetch('/api/verify/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey: item.itemKey, adminSkip: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error al saltar');
      // Advance stage via local state — no DB record written
      markAdminSkipped(item.itemKey);
      onVerified();
    } catch (e) {
      setError((e as Error).message);
      setAdminSkipping(false);
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

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--gray-200)]">
          <button
            type="button"
            onClick={handleAdminSkip}
            disabled={adminSkipping}
            style={{
              background: 'color-mix(in srgb, var(--gold) 20%, transparent)',
              border: '1.5px solid var(--gold)',
              color: 'var(--gold)',
              fontWeight: 700,
            }}
            className="rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {adminSkipping ? 'Saltando…' : 'Saltar reflexión (admin)'}
          </button>
          <span className="text-[10px] text-[var(--gray-500)]">
            Vista admin — no registra progreso
          </span>
        </div>
      )}
    </div>
  );
}
