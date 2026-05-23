'use client';

import { useState } from 'react';
import type { CollaborativeTask } from '@/lib/collaborative-tasks';
import { isMandatoryPartsComplete } from '@/lib/extras-gating';
import type { CompletionMap } from '@/lib/verification';
import { verificationConfig } from '@/lib/curriculum-path';
import { FileUpload } from './FileUpload';

const MIN_CHARS = verificationConfig.taskEvidenceMinChars;

type Props = {
  task: CollaborativeTask;
  completions: CompletionMap;
  isAdmin?: boolean;
  onUpdated: () => void;
};

export function CollaborativeTaskCard({
  task,
  completions,
  isAdmin = false,
  onUpdated,
}: Props) {
  const row = completions[task.id];
  const verified = row?.status === 'verified';
  const partsComplete = isMandatoryPartsComplete(task.level, completions);
  const locked = !isAdmin && !partsComplete;
  const isFileTask = task.inputType === 'document' || task.inputType === 'screenshot';

  const [partnerName, setPartnerName] = useState('');
  const [evidence, setEvidence] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const partnerOk = partnerName.trim().length >= 3;
  const textOk = evidence.trim().length >= MIN_CHARS;
  const fileOk = isFileTask && selectedFile !== null;
  const contentOk = isFileTask ? fileOk : textOk;
  const canSubmit = !locked && !verified && partnerOk && contentOk && !submitting;

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
    if (!canSubmit) return;
    setError(null);
    setFeedback(null);
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (isFileTask && selectedFile) {
        fileUrl = await uploadFile(selectedFile);
      }
      const res = await fetch('/api/verify/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemKey: task.id,
          evidenceText: isFileTask ? evidence.trim() : evidence.trim(),
          fileUrl,
          inputType: task.inputType,
          partner: { user_id: null, name: partnerName.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar.');
        return;
      }
      if (data.passed === false) {
        setFeedback(data.feedback);
        return;
      }
      setFeedback(data.feedback || '¡Tarea colaborativa verificada!');
      setEvidence('');
      setPartnerName('');
      setSelectedFile(null);
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (locked) {
    return (
      <div
        className="flex items-center gap-3 rounded-lg px-4 py-4"
        style={{
          minHeight: 88,
          border: '1px solid rgba(201, 151, 42, 0.35)',
          background: 'var(--gray-50)',
        }}
      >
        <span aria-hidden className="text-xl opacity-60">
          🔒
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)]">
            TAREA COLABORATIVA · {task.levelLabel}
          </p>
          <p className="mt-0.5 text-sm text-[var(--gray-600)] leading-snug">
            Completa las 5 partes para desbloquear la Tarea Colaborativa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={`collab-task-card rounded-xl border-2 p-5 space-y-3 ${verified ? 'collab-task-card--verified' : ''}`}
      style={{
        borderColor: verified ? 'var(--teal)' : 'var(--gold)',
        background: verified
          ? 'color-mix(in srgb, var(--teal) 8%, white)'
          : 'color-mix(in srgb, var(--gold) 8%, white)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          TAREA COLABORATIVA · {task.levelLabel}
        </span>
        {verified && (
          <span className="text-xs font-semibold text-[var(--green)]">
            ✓ Verificada · +{task.verifiedHours}h
          </span>
        )}
      </div>

      <h3 className="font-condensed text-xl font-extrabold text-[var(--navy)]">{task.title}</h3>
      <p className="text-sm text-[var(--gray-700)] leading-relaxed">{task.description}</p>
      <p className="text-xs text-[var(--gray-500)]">
        ~{task.estimatedMinutes} min · {task.verifiedHours}h verificadas al aprobar
      </p>

      {!verified && (
        <>
          <div>
            <label className="block text-xs font-bold text-[var(--gray-700)] mb-1">
              Nombre de tu compañera{task.allowMultiplePartners ? 's' : ''} (requerido)
            </label>
            <input
              type="text"
              className="rw-input w-full"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder={
                task.allowMultiplePartners
                  ? 'Ej. María López, Ana Ruiz, Carmen Díaz'
                  : 'Nombre completo de la docente con quien trabajaste'
              }
              disabled={submitting}
            />
            {task.allowMultiplePartners && (
              <p className="text-[10px] text-[var(--gray-500)] mt-1">
                Puedes listar varias compañeras separadas por comas.
              </p>
            )}
          </div>

          {isFileTask ? (
            <div className="space-y-2">
              <FileUpload
                accept={
                  task.inputType === 'document'
                    ? 'application/pdf'
                    : 'image/png,image/jpeg,image/jpg'
                }
                kind={task.inputType === 'document' ? 'pdf' : 'image'}
                disabled={submitting}
                onFileSelected={setSelectedFile}
                onFileCleared={() => setSelectedFile(null)}
              />
              <textarea
                className="rw-textarea min-h-[80px] w-full"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Notas opcionales sobre la sesión conjunta…"
                disabled={submitting}
              />
            </div>
          ) : (
            <>
              <textarea
                className="rw-textarea min-h-[140px] w-full"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Reflexión conjunta (mínimo 400 caracteres)…"
                disabled={submitting}
              />
              <div className="text-xs text-[var(--gray-500)]">
                {evidence.trim().length} / {MIN_CHARS} caracteres mín.
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
          {feedback && (
            <p
              className={`text-xs ${feedback.includes('verificada') ? 'text-[var(--teal)]' : 'text-[var(--gray-700)]'}`}
            >
              {feedback}
            </p>
          )}

          <button
            type="button"
            className="btn-primary text-sm"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {submitting ? 'Evaluando con IA…' : 'Enviar tarea colaborativa'}
          </button>
        </>
      )}

      {verified && row?.task_feedback && (
        <p className="text-sm text-[var(--gray-700)]">{row.task_feedback}</p>
      )}
      {verified && row?.partner_name && (
        <p className="text-xs text-[var(--gray-600)]">
          Compañera{task.allowMultiplePartners ? 's' : ''}: {row.partner_name}
        </p>
      )}
    </article>
  );
}
