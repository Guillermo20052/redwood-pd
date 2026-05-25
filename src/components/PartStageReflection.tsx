'use client';

import { useEffect, useState } from 'react';
import { AdminResetButton } from './AdminResetButton';
import { useProgressContext } from './Providers';
import { verificationConfig, type PathItem } from '@/lib/curriculum-path';

type Props = {
  item: PathItem;
  onVerified: () => void;
};

function ReflectionFeedbackCard({ feedback }: { feedback: string }) {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{
        borderColor: 'rgba(200, 151, 42, 0.45)',
        background: 'linear-gradient(180deg, var(--gold-light), #fff)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] mb-2">
        Mensaje de tu coach IA
      </p>
      <p className="text-sm italic leading-relaxed text-[var(--gray-800)]">{feedback}</p>
    </div>
  );
}

export function PartStageReflection({ item, onVerified }: Props) {
  const { verifyReflection, adminSkipItem, profile, completions } = useProgressContext();
  const row = completions[item.itemKey];
  const alreadyVerified = row?.status === 'verified';

  const [text, setText] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adminSkipping, setAdminSkipping] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = profile.role === 'admin';

  useEffect(() => {
    if (row?.evidence_text && row.evidence_text !== '[admin skip]') {
      setText(row.evidence_text);
    }
    if (row?.reflection_ai_feedback) {
      setAiFeedback(row.reflection_ai_feedback);
    }
  }, [row?.evidence_text, row?.reflection_ai_feedback]);

  const min = verificationConfig.reflectionMinChars ?? 80;
  const len = text.trim().length;
  const meets = len >= min;

  const submit = async () => {
    if (submitting || !meets || alreadyVerified) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await verifyReflection(item.itemKey, text);
      if (data?.reflection_ai_feedback && typeof data.reflection_ai_feedback === 'string') {
        setAiFeedback(data.reflection_ai_feedback);
      }
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
      await adminSkipItem(item.itemKey, 'reflection');
      onVerified();
    } catch (e) {
      setError((e as Error).message);
      setAdminSkipping(false);
    }
  };

  if (alreadyVerified) {
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
        {text && text !== '[admin skip]' && (
          <p className="text-sm text-[var(--gray-800)] whitespace-pre-wrap leading-relaxed">{text}</p>
        )}
        {aiFeedback && <ReflectionFeedbackCard feedback={aiFeedback} />}
        {isAdmin && <AdminResetButton itemKey={item.itemKey} onReset={onVerified} />}
      </div>
    );
  }

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

      {aiFeedback && <ReflectionFeedbackCard feedback={aiFeedback} />}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void submit()}
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
            onClick={() => void handleAdminSkip()}
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
            Vista admin — avance guardado (no cuenta en cohorte)
          </span>
        </div>
      )}
    </div>
  );
}
