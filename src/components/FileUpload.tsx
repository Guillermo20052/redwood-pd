'use client';

import { useCallback, useRef, useState } from 'react';

import {
  MAX_TEACHER_UPLOAD_BYTES,
  validateUploadFile,
} from '@/lib/teacher-file-upload';

/** All tasks accept PDF and images — do not narrow the native file picker by task type. */
const UNIFIED_FILE_ACCEPT =
  'application/pdf,image/png,image/jpeg,image/jpg,.pdf,.png,.jpg,.jpeg';

type Props = {
  accept?: string;
  kind: 'image' | 'pdf';
  disabled?: boolean;
  slotLabel?: string;
  onFileSelected: (file: File) => void;
  onFileCleared: () => void;
};

function formatSizeMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function isImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith('image/')) return true;
  return /\.(png|jpe?g)$/i.test(file.name);
}

function isPdfFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === 'application/pdf' || t.includes('pdf')) return true;
  return /\.pdf$/i.test(file.name);
}

export function FileUpload({
  kind: _kind,
  disabled,
  slotLabel,
  onFileSelected,
  onFileCleared,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const clear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileCleared();
  }, [previewUrl, onFileCleared]);

  const validateAndSet = useCallback(
    (next: File) => {
      setError(null);
      if (next.size > MAX_TEACHER_UPLOAD_BYTES) {
        setError('El archivo es demasiado grande (máximo 10 MB)');
        return;
      }
      const fileCheck = validateUploadFile(next.name, next.type);
      if (!fileCheck.ok) {
        setError(fileCheck.reason);
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(next);
      if (isImageFile(next)) {
        setPreviewUrl(URL.createObjectURL(next));
      } else {
        setPreviewUrl(null);
      }
      onFileSelected(next);
    },
    [onFileSelected, previewUrl]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSet(dropped);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) validateAndSet(picked);
  };

  return (
    <div className="space-y-3">
      {slotLabel && (
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--gray-600)]">
          {slotLabel}
        </p>
      )}
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
            dragOver
              ? 'border-[var(--red)] bg-[var(--red-pale)]'
              : 'border-[var(--gray-300)] bg-white hover:border-[var(--red)] hover:bg-[var(--red-pale)]'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={UNIFIED_FILE_ACCEPT}
            className="hidden"
            disabled={disabled}
            onChange={onChange}
          />
          <span className="text-3xl block mb-2">📎</span>
          <p className="text-sm font-semibold text-[var(--gray-800)]">
            Arrastra tu archivo aquí (PDF, PNG o JPG)
          </p>
          <p className="text-xs text-[var(--gray-500)] mt-1">
            o haz clic para buscar · Máximo 10MB
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-4 space-y-3">
          <p className="text-sm text-[var(--gray-800)]">
            Archivo seleccionado: <span className="font-semibold">{file.name}</span> (
            {formatSizeMb(file.size)} MB)
          </p>
          <p className="text-xs text-[var(--gray-500)]">{file.type || 'tipo desconocido'}</p>
          {previewUrl && isImageFile(file) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Vista previa"
              className="max-w-full rounded-lg border border-[var(--gray-200)]"
              style={{ maxHeight: 400, maxWidth: 400, objectFit: 'contain' }}
            />
          )}
          {isPdfFile(file) && (
            <div className="flex items-center gap-2 text-[var(--gray-700)]">
              <span className="text-2xl">📄</span>
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          )}
          <button
            type="button"
            className="btn-outline text-sm"
            onClick={clear}
            disabled={disabled}
          >
            Quitar
          </button>
        </div>
      )}
      {error && <p className="text-sm font-semibold text-[var(--red)]">{error}</p>}
    </div>
  );
}
