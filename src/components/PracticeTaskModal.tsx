'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { PracticeCompletionRow } from '@/lib/local-db';
import type { PracticeTask, PracticeToolMeta } from '@/lib/practice-tasks';
import { FileUpload } from './FileUpload';
import {
  uploadTeacherSubmissionFile,
  type UploadStage,
  type UploadedFileRef,
} from '@/lib/teacher-file-upload';

type Props = {
  task: PracticeTask;
  toolMeta: PracticeToolMeta;
  completion?: PracticeCompletionRow;
  onClose: () => void;
  onCompleted: (taskId: string, row: PracticeCompletionRow) => void;
};

type GradeResult = {
  passed: boolean;
  score: number;
  feedback: string;
};

export function PracticeTaskModal({
  task,
  toolMeta,
  completion,
  onClose,
  onCompleted,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedRef, setUploadedRef] = useState<UploadedFileRef | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<GradeResult | null>(
    completion
      ? { passed: true, score: completion.score, feedback: completion.feedback }
      : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (completion) {
      setLastResult({
        passed: true,
        score: completion.score,
        feedback: completion.feedback,
      });
    }
  }, [completion]);

  const fileReady = uploadStage === 'ready' && uploadedRef !== null;
  const canSubmit = fileReady && !submitting;

  const startFileUpload = async (file: File) => {
    setUploading(true);
    setErrorMessage(null);
    setUploadedRef(null);
    setUploadStage('preparing');
    try {
      const ref = await uploadTeacherSubmissionFile(file, (stage) => {
        setUploadStage(stage);
      });
      setUploadedRef(ref);
      setUploadStage('ready');
    } catch (e) {
      setUploadStage('error');
      setErrorMessage((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadedRef(null);
    setUploadStage('idle');
    setErrorMessage(null);
  };

  const submit = async () => {
    if (!canSubmit || !uploadedRef) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/verify/practice-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          key: uploadedRef.key,
          fileUrl: uploadedRef.fileUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo enviar la práctica.');
      }
      const row: PracticeCompletionRow = {
        task_id: task.id,
        score: data.score ?? 85,
        feedback: data.feedback ?? '',
        file_url: uploadedRef.fileUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLastResult({
        passed: true,
        score: row.score,
        feedback: row.feedback,
      });
      onCompleted(task.id, row);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="practice-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="practice-modal card-elevation"
        role="dialog"
        aria-labelledby="practice-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ '--practice-accent': toolMeta.accent } as CSSProperties}
      >
        <button type="button" className="practice-modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <header className="practice-modal__header">
          <span className="practice-modal__tool">{toolMeta.label} · Práctica</span>
          <h2 id="practice-modal-title" className="practice-modal__title font-condensed">
            {task.title}
          </h2>
          <p className="practice-modal__meta">~{task.estimatedMinutes} min · PDF, PNG o JPG</p>
        </header>

        <section className="practice-modal__section">
          <h3 className="practice-modal__label">Qué hacer</h3>
          <p className="practice-modal__body">{task.description}</p>
        </section>

        <section className="practice-modal__section practice-modal__expected">
          <h3 className="practice-modal__label">Qué subes</h3>
          <p className="practice-modal__body">{task.expectedOutput}</p>
        </section>

        {task.tip && (
          <aside className="practice-modal__tip">
            <strong>Tip:</strong> {task.tip}
          </aside>
        )}

        {!lastResult?.passed && (
          <section className="practice-modal__upload">
            <h3 className="practice-modal__label">Tu evidencia</h3>
            <FileUpload
              kind="pdf"
              disabled={uploading || submitting}
              onFileSelected={(file) => {
                setSelectedFile(file);
                void startFileUpload(file);
              }}
              onFileCleared={clearFile}
            />
            {selectedFile && uploadStage === 'preparing' && (
              <p className="practice-modal__upload-status">Preparando subida…</p>
            )}
            {selectedFile && uploadStage === 'uploading' && (
              <p className="practice-modal__upload-status">Subiendo archivo…</p>
            )}
            {fileReady && (
              <p className="practice-modal__upload-status practice-modal__upload-status--ok">
                Archivo listo para enviar
              </p>
            )}
          </section>
        )}

        {errorMessage && (
          <p className="practice-modal__error" role="alert">
            {errorMessage}
          </p>
        )}

        {lastResult?.passed && (
          <div className="practice-modal__result" role="status">
            <p className="practice-modal__result-badge">¡Práctica registrada! 🌟</p>
            <p className="practice-modal__result-score">Puntaje: {lastResult.score}/100</p>
            <p className="practice-modal__result-feedback">{lastResult.feedback}</p>
            <p className="practice-modal__result-note">
              Esta práctica no suma horas al diploma — es solo para tu exploración en el taller.
            </p>
          </div>
        )}

        <footer className="practice-modal__footer">
          {!lastResult?.passed ? (
            <button
              type="button"
              className="btn-primary practice-modal__submit"
              disabled={!canSubmit}
              onClick={() => void submit()}
            >
              {submitting ? 'Evaluando…' : 'Enviar práctica'}
            </button>
          ) : (
            <button type="button" className="btn-primary practice-modal__submit" onClick={onClose}>
              Cerrar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
