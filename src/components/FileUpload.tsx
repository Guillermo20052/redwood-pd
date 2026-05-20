'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  accept: string;
  kind: 'image' | 'pdf';
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  onFileCleared: () => void;
};

function formatSizeMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function mimeAllowed(file: File, accept: string): boolean {
  const allowed = accept.split(',').map((s) => s.trim().toLowerCase());
  const type = file.type.toLowerCase();
  if (allowed.includes(type)) return true;
  if (type === 'image/jpg' && allowed.includes('image/jpeg')) return true;
  return false;
}

export function FileUpload({ accept, kind, disabled, onFileSelected, onFileCleared }: Props) {
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
      if (next.size > MAX_BYTES) {
        setError('El archivo es demasiado grande (máx. 10MB)');
        return;
      }
      if (!mimeAllowed(next, accept)) {
        setError('Tipo de archivo no permitido');
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(next);
      if (kind === 'image' && next.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(next));
      } else {
        setPreviewUrl(null);
      }
      onFileSelected(next);
    },
    [accept, kind, onFileSelected, previewUrl]
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
            accept={accept}
            className="hidden"
            disabled={disabled}
            onChange={onChange}
          />
          <span className="text-3xl block mb-2">{kind === 'pdf' ? '📄' : '🖼️'}</span>
          <p className="text-sm font-semibold text-[var(--gray-800)]">
            Arrastra tu archivo aquí o haz clic para buscar
          </p>
          <p className="text-xs text-[var(--gray-500)] mt-1">Máximo 10MB</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-4 space-y-3">
          <p className="text-sm text-[var(--gray-800)]">
            Archivo seleccionado: <span className="font-semibold">{file.name}</span> (
            {formatSizeMb(file.size)} MB)
          </p>
          <p className="text-xs text-[var(--gray-500)]">{file.type || 'tipo desconocido'}</p>
          {previewUrl && kind === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Vista previa"
              className="max-w-full rounded-lg border border-[var(--gray-200)]"
              style={{ maxHeight: 400, maxWidth: 400, objectFit: 'contain' }}
            />
          )}
          {kind === 'pdf' && (
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
