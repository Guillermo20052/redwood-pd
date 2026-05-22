'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExtraTask } from '@/lib/extra-tasks';
import { verificationConfig } from '@/lib/curriculum-path';
import { useProgressContext } from './Providers';
import { FileUpload } from './FileUpload';

type Props = {
  task: ExtraTask;
  isAdmin?: boolean;
  onClose: () => void;
  onVerified: () => void;
};

type GradeResult = {
  passed: boolean;
  feedback: string;
};

export function ExtraTaskModal({ task, isAdmin = false, onClose, onVerified }: Props) {
  const { verifyTask, completions, markAdminSkipped } = useProgressContext();
  const inputType = task.inputType;
  const isFileTask = inputType === 'screenshot' || inputType === 'document';

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const [lastResult, setLastResult] = useState<GradeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminSkipping, setAdminSkipping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const row = completions[task.id];
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
  const fileOk = isFileTask && selectedFile !== null;
  const meets = isFileTask ? fileOk : meetsLength;

  const acceptMime =
    inputType === 'document' ? 'application/pdf' : 'image/png,image/jpeg,image/jpg';

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'No se pudo subir el archivo');
    if (typeof data.fileUrl !== 'string') throw new Error('Respuesta de subida inválida');
    return data.fileUrl;
  };

  const submit = async () => {
    if (submitting || !meets || alreadyVerified) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      let fileUrl: string | undefined;
      if (isFileTask && selectedFile) {
        fileUrl = await uploadFile(selectedFile);
      }
      const data = await verifyTask(task.id, {
        evidenceText: isFileTask ? '' : text,
        fileUrl,
        inputType,
      });
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
        body: JSON.stringify({ itemKey: task.id, adminSkip: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error al marcar vista previa');
      markAdminSkipped(task.id);
      onVerified();
    } catch (e) {
      setErrorMessage((e as Error).message);
      setAdminSkipping(false);
    }
  };

  const passed = lastResult?.passed === true || alreadyVerified;
  const failed = lastResult && !lastResult.passed && !alreadyVerified;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-start justify-between gap-3 px-5 py-4 border-b"
          style={{ background: 'white' }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
              TAREA LEVEL UP · OPCIONAL · {task.tool}
            </p>
            <h3 className="font-condensed text-lg font-extrabold text-[var(--navy)] mt-1">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--gray-500)] hover:text-[var(--gray-800)] text-xl leading-none p-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm leading-relaxed text-[var(--gray-800)] whitespace-pre-wrap">
            {task.description}
          </p>

          <div>
            <button
              type="button"
              className="text-xs font-bold text-[var(--gold)]"
              onClick={() => setShowRubric((v) => !v)}
            >
              {showRubric ? '▾ Ocultar rúbrica' : '▸ Ver rúbrica de evaluación'}
            </button>
            {showRubric && (
              <p className="mt-2 text-xs text-[var(--gray-600)] rounded-lg border border-[var(--gray-200)] bg-[var(--gray-50)] p-3">
                {task.rubric}
              </p>
            )}
          </div>

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
                placeholder={`Describe tu trabajo (mín. ${min} caracteres)…`}
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

          {!isAdmin ? (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={submit}
              disabled={!meets || submitting || passed}
            >
              {submitting
                ? isFileTask
                  ? 'Subiendo y evaluando…'
                  : 'Evaluando con IA…'
                : passed
                  ? 'Completada'
                  : 'Enviar para evaluación'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={handleAdminSkip}
                disabled={adminSkipping || passed}
                style={{
                  background: 'color-mix(in srgb, var(--gold) 25%, var(--navy))',
                  border: '1.5px solid var(--gold)',
                }}
              >
                {adminSkipping ? 'Marcando…' : 'Marcar vista previa (admin)'}
              </button>
              <p className="text-[10px] text-center text-[var(--gray-500)]">
                No guarda en la base de datos · solo para explorar el flujo
              </p>
            </div>
          )}

          {lastResult && (
            <div
              className={`score-panel ${passed ? 'score-panel--pass' : ''}`}
              style={
                !passed
                  ? { background: 'var(--gold-light)', border: '1px solid var(--gold)' }
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
              {failed && (
                <button type="button" className="btn-outline mt-4" onClick={() => setLastResult(null)}>
                  Reintentar
                </button>
              )}
            </div>
          )}

          {errorMessage && (
            <div
              className="score-panel"
              style={{ background: 'var(--gold-light)', border: '1px solid var(--gold)' }}
            >
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
