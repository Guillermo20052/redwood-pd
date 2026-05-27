'use client';

import { useEffect, useRef, useState } from 'react';
import { useProgressContext } from './Providers';
import { verificationConfig, type PathItem, type TaskInputType } from '@/lib/curriculum-path';
import { PartnerPicker, type PartnerTeacher, type PartnerValue } from './PartnerPicker';
import { FileUpload } from './FileUpload';
import { AdminResetButton } from './AdminResetButton';
import {
  uploadTeacherSubmissionFile,
  VERIFY_TASK_USER_MESSAGE,
  type UploadStage,
  type UploadedFileRef,
} from '@/lib/teacher-file-upload';

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
  const { verifyTask, completions, adminSkipItem, profile } = useProgressContext();
  const isAdmin = profile.role === 'admin';
  const inputType: TaskInputType = item.inputType ?? 'text';
  const isFileTask = inputType === 'screenshot' || inputType === 'document';
  const maxFiles = item.maxFiles ?? 1;

  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<(File | null)[]>(() =>
    maxFiles > 1 ? Array.from({ length: maxFiles }, () => null) : [null]
  );
  const [uploadedRefs, setUploadedRefs] = useState<(UploadedFileRef | null)[]>(() =>
    maxFiles > 1 ? Array.from({ length: maxFiles }, () => null) : [null]
  );
  const [uploadStages, setUploadStages] = useState<UploadStage[]>(() =>
    maxFiles > 1 ? Array.from({ length: maxFiles }, () => 'idle' as UploadStage) : ['idle']
  );
  const [uploadProgress, setUploadProgress] = useState<(number | undefined)[]>(() =>
    maxFiles > 1 ? Array.from({ length: maxFiles }, () => undefined) : [undefined]
  );
  const [uploadingSlot, setUploadingSlot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retryingVerify, setRetryingVerify] = useState(false);
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
  const fileUploadReady =
    isFileTask &&
    selectedFiles.some((f, i) => f !== null && uploadStages[i] === 'ready' && uploadedRefs[i]);
  const fileOk = isFileTask ? fileUploadReady : false;
  const meets = isFileTask ? fileOk && partnerOk : meetsLength && partnerOk;

  const acceptMime =
    maxFiles > 1
      ? 'application/pdf,image/png,image/jpeg,image/jpg'
      : inputType === 'document'
        ? 'application/pdf'
        : 'image/png,image/jpeg,image/jpg';
  const uploadKind =
    maxFiles > 1 ? ('pdf' as const) : inputType === 'document' ? ('pdf' as const) : ('image' as const);

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

  const uploadStatusLabel = (stage: UploadStage, progress?: number): string | null => {
    if (stage === 'preparing') return 'Preparando subida...';
    if (stage === 'uploading') {
      return progress != null && progress > 0
        ? `Subiendo archivo... ${Math.round(progress)}%`
        : 'Subiendo archivo...';
    }
    if (stage === 'ready') return 'Listo para evaluar';
    return null;
  };

  const startFileUpload = async (index: number, file: File) => {
    setUploadingSlot(true);
    setErrorMessage(null);
    setUploadStages((prev) => {
      const next = [...prev];
      next[index] = 'preparing';
      return next;
    });
    setUploadedRefs((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    try {
      const ref = await uploadTeacherSubmissionFile(file, (stage, progress) => {
        setUploadStages((prev) => {
          const next = [...prev];
          next[index] = stage;
          return next;
        });
        if (progress != null) {
          setUploadProgress((prev) => {
            const next = [...prev];
            next[index] = progress;
            return next;
          });
        }
      });
      setUploadedRefs((prev) => {
        const next = [...prev];
        next[index] = ref;
        return next;
      });
      setUploadStages((prev) => {
        const next = [...prev];
        next[index] = 'ready';
        return next;
      });
    } catch (e) {
      setUploadStages((prev) => {
        const next = [...prev];
        next[index] = 'error';
        return next;
      });
      setErrorMessage((e as Error).message);
    } finally {
      setUploadingSlot(false);
    }
  };

  const clearFileSlot = (index: number) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setUploadedRefs((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setUploadStages((prev) => {
      const next = [...prev];
      next[index] = 'idle';
      return next;
    });
    setUploadProgress((prev) => {
      const next = [...prev];
      next[index] = undefined;
      return next;
    });
    setErrorMessage(null);
  };

  const resetUploadState = () => {
    setSelectedFiles(maxFiles > 1 ? Array.from({ length: maxFiles }, () => null) : [null]);
    setUploadedRefs(maxFiles > 1 ? Array.from({ length: maxFiles }, () => null) : [null]);
    setUploadStages(maxFiles > 1 ? Array.from({ length: maxFiles }, () => 'idle') : ['idle']);
    setUploadProgress(
      maxFiles > 1 ? Array.from({ length: maxFiles }, () => undefined) : [undefined]
    );
    setErrorMessage(null);
    setLastResult(null);
  };

  const submit = async () => {
    if (submitting || !meets || uploadingSlot) return;
    setSubmitting(true);
    setRetryingVerify(false);
    setErrorMessage(null);
    try {
      const readyRefs = uploadedRefs.filter((r): r is UploadedFileRef => r !== null);
      let storageKeys: string[] | undefined;
      let storageKey: string | undefined;
      let fileUrls: string[] | undefined;
      let fileUrl: string | undefined;

      if (isFileTask && readyRefs.length > 0) {
        if (readyRefs.length === 1) {
          storageKey = readyRefs[0].key;
          fileUrl = readyRefs[0].fileUrl;
        } else {
          storageKeys = readyRefs.map((u) => u.key);
          fileUrls = readyRefs.map((u) => u.fileUrl);
        }
      }

      const data = await verifyTask(
        item.itemKey,
        {
          evidenceText: isFileTask ? '' : text,
          storageKey,
          storageKeys,
          fileUrl,
          fileUrls,
          inputType,
        },
        collaborative && partner ? partner : null,
        { onRetrying: () => setRetryingVerify(true) }
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
      setErrorMessage((e as Error).message || VERIFY_TASK_USER_MESSAGE);
    } finally {
      setSubmitting(false);
      setRetryingVerify(false);
    }
  };

  const handleAdminSkip = async () => {
    if (adminSkipping) return;
    setAdminSkipping(true);
    setErrorMessage(null);
    try {
      await adminSkipItem(item.itemKey, 'task');
      onVerified();
    } catch (e) {
      setErrorMessage((e as Error).message);
      setAdminSkipping(false);
    }
  };

  const retry = () => {
    if (isFileTask) {
      resetUploadState();
    } else {
      setLastResult(null);
      setErrorMessage(null);
    }
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
        maxFiles > 1 ? (
          <div className="space-y-4">
            {selectedFiles.map((_, index) => (
              <FileUpload
                key={index}
                accept={acceptMime}
                kind={uploadKind}
                slotLabel={`Subir archivo ${index + 1} (PDF o imagen)`}
                disabled={submitting || passed || uploadingSlot}
                onFileSelected={(file) => {
                  setSelectedFiles((prev) => {
                    const next = [...prev];
                    next[index] = file;
                    return next;
                  });
                  void startFileUpload(index, file);
                }}
                onFileCleared={() => clearFileSlot(index)}
              />
            ))}
            {selectedFiles.map((f, index) =>
              f && uploadStages[index] !== 'idle' ? (
                <p
                  key={`status-${index}`}
                  className={`text-sm font-medium ${
                    uploadStages[index] === 'ready'
                      ? 'text-[var(--teal)]'
                      : uploadStages[index] === 'error'
                        ? 'text-[var(--red)]'
                        : 'text-[var(--gray-600)]'
                  }`}
                >
                  Archivo {index + 1}:{' '}
                  {uploadStages[index] === 'error'
                    ? errorMessage
                    : uploadStatusLabel(uploadStages[index], uploadProgress[index])}
                </p>
              ) : null
            )}
            <p className="text-xs text-[var(--gray-500)]">
              Sube 1 archivo combinando los niveles, o 2 archivos por separado (uno por cada nivel
              de lectura).
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <FileUpload
              accept={acceptMime}
              kind={uploadKind}
              disabled={submitting || passed || uploadingSlot}
              onFileSelected={(file) => {
                setSelectedFiles([file]);
                void startFileUpload(0, file);
              }}
              onFileCleared={() => clearFileSlot(0)}
            />
            {selectedFiles[0] && uploadStages[0] !== 'idle' && (
              <p
                className={`text-sm font-medium ${
                  uploadStages[0] === 'ready'
                    ? 'text-[var(--teal)]'
                    : uploadStages[0] === 'error'
                      ? 'text-[var(--red)]'
                      : 'text-[var(--gray-600)]'
                }`}
              >
                {uploadStages[0] === 'error'
                  ? errorMessage
                  : uploadStatusLabel(uploadStages[0], uploadProgress[0])}
              </p>
            )}
          </div>
        )
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
        disabled={!meets || submitting || passed || uploadingSlot}
      >
        {submitting
          ? retryingVerify
            ? 'Reintentando…'
            : isFileTask
              ? 'Evaluando con IA…'
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
            onClick={isFileTask ? resetUploadState : submit}
            disabled={submitting || (isFileTask ? uploadingSlot : !meets)}
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
            Vista admin — avance guardado (no cuenta en cohorte)
          </span>
        </div>
      )}

      {isAdmin && alreadyVerified && (
        <AdminResetButton itemKey={item.itemKey} onReset={onVerified} />
      )}
    </div>
  );
}
