'use client';

import { useEffect, useRef, useState } from 'react';
import { useProgressContext } from './Providers';
import { verificationConfig, type PathItem, type TaskInputType } from '@/lib/curriculum-path';
import { PartnerPicker, type PartnerTeacher, type PartnerValue } from './PartnerPicker';
import { FileUpload } from './FileUpload';

type Props = {
  item: PathItem;
  collaborative?: boolean;
  onVerified: () => void;
};

type GradeResult = {
  passed: boolean;
  feedback: string;
};

type ApiTeacher = {
  user_id?: string;
  id?: string;
  full_name?: string;
  subject?: string;
};

function promptParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.includes('\n\n')) {
    return trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }
  if (trimmed.length > 280) {
    const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [trimmed];
    const chunks: string[] = [];
    let buf = '';
    for (const s of sentences) {
      if (buf.length + s.length > 220 && buf) {
        chunks.push(buf.trim());
        buf = s;
      } else {
        buf += s;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
    return chunks.length ? chunks : [trimmed];
  }
  return [trimmed];
}

export function PartStageTask({ item, collaborative, onVerified }: Props) {
  const { verifyTask, completions, profile } = useProgressContext();
  const isAdmin = profile.role === 'admin';
  const inputType: TaskInputType = item.inputType ?? 'text';
  const isFileTask = inputType === 'screenshot' || inputType === 'document';

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminSkipping, setAdminSkipping] = useState(false);
  const [lastResult, setLastResult] = useState<GradeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allTeachers, setAllTeachers] = useState<PartnerTeacher[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('local-dev-user');
  const [partner, setPartner] = useState<PartnerValue | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const row = completions[item.itemKey];
  const alreadyVerified = row?.status === 'verified';

  useEffect(() => {
    if (row?.task_feedback) {
      setLastResult({
        passed: row.status === 'verified' || row.task_score === 100,
        feedback: row.task_feedback,
      });
    }
  }, [row?.task_score, row?.task_feedback, row?.status]);

  const min = verificationConfig.taskEvidenceMinChars;
  const len = text.trim().length;
  const meetsLength = len >= min;
  const partnerOk =
    !collaborative || (partner !== null && partner.name.trim().length >= 3);
  const fileOk = isFileTask && selectedFile !== null;
  const meets = isFileTask ? fileOk && partnerOk : meetsLength && partnerOk;

  const acceptMime =
    inputType === 'document'
      ? 'application/pdf'
      : 'image/png,image/jpeg,image/jpg';

  useEffect(() => {
    if (!collaborative) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/community/teachers');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const mapped: PartnerTeacher[] = (data.teachers || []).map((t: ApiTeacher) => ({
          user_id: t.user_id ?? t.id ?? '',
          full_name: t.full_name ?? 'Docente',
          subject: t.subject,
        }));
        setAllTeachers(mapped.filter((t) => t.user_id));
        if (typeof data.currentUserId === 'string' && data.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }
      } catch {
        /* manual entry still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collaborative]);

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo subir el archivo');
    }
    if (typeof data.fileUrl !== 'string') {
      throw new Error('Respuesta de subida inválida');
    }
    return data.fileUrl;
  };

  const submit = async () => {
    if (submitting || !meets) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      let fileUrl: string | undefined;
      if (isFileTask && selectedFile) {
        fileUrl = await uploadFile(selectedFile);
      }

      const data = await verifyTask(
        item.itemKey,
        {
          evidenceText: isFileTask ? '' : text,
          fileUrl,
          inputType,
        },
        collaborative && partner ? partner : null
      );

      const passed = data?.passed === true || data?.ok === true;
      const feedback = typeof data?.feedback === 'string' ? data.feedback : '';

      if (feedback || data?.passed != null || data?.ok != null) {
        setLastResult({ passed, feedback });
      }

      if (passed) {
        setTimeout(() => onVerified(), 1200);
      }
    } catch (e) {
      setErrorMessage((e as Error).message || 'No se pudo enviar la tarea.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSkip = async () => {
    if (adminSkipping) return;
    setAdminSkipping(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/verify/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey: item.itemKey, adminSkip: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error al saltar');
      onVerified();
    } catch (e) {
      setErrorMessage((e as Error).message);
      setAdminSkipping(false);
    }
  };

  const retry = () => {
    setLastResult(null);
    setErrorMessage(null);
    if (!isFileTask) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  };

  const passed = lastResult?.passed === true || alreadyVerified;
  const failed = lastResult && !lastResult.passed && !alreadyVerified;
  const promptParts = item.taskPrompt ? promptParagraphs(item.taskPrompt) : [];

  return (
    <div className="space-y-3">
      <p className="stage-label">Etapa 2 de 3 · Tarea con IA</p>

      {collaborative && (
        <PartnerPicker
          onSelect={setPartner}
          currentValue={partner}
          allTeachers={allTeachers}
          currentUserId={currentUserId}
          partNumber={item.partNumber ?? 0}
          partTitle={item.partTitle ?? item.label}
          disabled={submitting || passed}
        />
      )}

      {promptParts.length > 0 && (
        <div className="stage-prompt-card stage-prompt-card--gold">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] mb-2">
            Consigna
          </p>
          <div className="space-y-2 text-sm leading-relaxed text-[var(--gray-800)]">
            {promptParts.map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      {isFileTask ? (
        <FileUpload
          accept={acceptMime}
          kind={inputType === 'document' ? 'pdf' : 'image'}
          disabled={submitting || passed}
          onFileSelected={setSelectedFile}
          onFileCleared={() => setSelectedFile(null)}
        />
      ) : (
        <div>
          <textarea
            ref={textareaRef}
            className="rw-textarea"
            placeholder={`Describe qué hiciste, qué aprendiste y cómo lo aplicarás (mín. ${min} caracteres)…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            disabled={submitting || passed}
          />
          <p className={`char-counter ${meetsLength ? '' : 'warn'}`}>
            {len} / {min} caracteres
          </p>
        </div>
      )}

      {collaborative && !partnerOk && (
        <p className="char-counter warn text-left">
          Selecciona o escribe el nombre de tu compañera antes de enviar.
        </p>
      )}

      <button
        type="button"
        className="btn-primary"
        onClick={submit}
        disabled={!meets || submitting || passed}
      >
        {submitting
          ? isFileTask
            ? 'Subiendo y evaluando…'
            : 'Evaluando con IA…'
          : passed
            ? 'Aprobada'
            : 'Enviar para evaluación'}
      </button>

      {lastResult && (
        <div
          className={`score-panel ${passed ? 'score-panel--pass' : ''}`}
          style={
            !passed
              ? {
                  background: 'var(--gold-light)',
                  border: '1px solid var(--gold)',
                }
              : undefined
          }
        >
          <p
            className={`text-lg font-bold mb-2 ${
              passed ? 'text-[var(--green)]' : 'text-[var(--gold)]'
            }`}
          >
            {passed ? '¡Listo!' : 'Casi'}
          </p>
          {lastResult.feedback && (
            <p className="text-base leading-relaxed text-[var(--gray-800)] whitespace-pre-wrap">
              {lastResult.feedback}
            </p>
          )}
          {passed && !alreadyVerified && (
            <p className="mt-3 text-sm font-semibold text-[var(--teal)]">
              Continuar a Reflexión →
            </p>
          )}
          {failed && (
            <button type="button" className="btn-outline mt-4" onClick={retry}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div
          className="score-panel"
          style={{
            background: 'var(--gold-light)',
            border: '1px solid var(--gold)',
          }}
        >
          <p className="text-sm font-semibold text-[var(--gray-800)]">{errorMessage}</p>
          <button
            type="button"
            className="btn-outline mt-2"
            onClick={submit}
            disabled={submitting || !meets}
          >
            Reintentar
          </button>
        </div>
      )}

      {isAdmin && !passed && (
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
            {adminSkipping ? 'Saltando…' : 'Saltar tarea (admin)'}
          </button>
          <span className="text-[10px] text-[var(--gray-500)]">
            Vista admin — no registra progreso ni llama al evaluador
          </span>
        </div>
      )}
    </div>
  );
}
