'use client';

import { useRef, useState } from 'react';
import { useProgressContext } from '@/components/Providers';

export default function ImportarPage() {
  const { reload } = useProgressContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [unmapped, setUnmapped] = useState<string[]>([]);

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Importando...');
    setErrorDetail('');
    setUnmapped([]);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pd: typeof payload.pd === 'string' ? payload.pd : JSON.stringify(payload.pd),
          ref: typeof payload.ref === 'string' ? payload.ref : JSON.stringify(payload.ref),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          imported?: { completions?: number; reflections?: number };
          unmapped?: string[];
        };
        const c = data.imported?.completions ?? 0;
        const r = data.imported?.reflections ?? 0;
        setStatus(`✅ Importado · ${c} avances, ${r} reflexiones`);
        setUnmapped(data.unmapped ?? []);
        reload();
      } else {
        let message = `Error ${res.status}`;
        try {
          const err = (await res.json()) as { error?: string };
          if (err.error) message = err.error;
        } catch {
          /* non-JSON error body */
        }
        setStatus('No se pudo importar el progreso. Intenta de nuevo o avisa al administrador.');
        setErrorDetail(message);
      }
    } catch (err) {
      setStatus('No se pudo importar el progreso. Intenta de nuevo o avisa al administrador.');
      setErrorDetail(
        err instanceof SyntaxError ? 'Archivo JSON inválido' : String(err)
      );
    }
    resetFileInput();
  };

  const retry = () => {
    setStatus('');
    setErrorDetail('');
    setUnmapped([]);
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="level-hero lh-e">
        <div className="level-hero-tag">Migración</div>
        <h2>Importar tu progreso</h2>
        <p>
          Sube el JSON exportado desde el documento HTML legacy para recuperar avances y
          reflexiones guardadas.
        </p>
      </div>
      <label className="block rounded-xl border-2 border-dashed border-[var(--gray-300)] bg-white p-10 text-center cursor-pointer transition hover:border-[var(--red)] hover:bg-[var(--red-pale)]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={onFile}
        />
        <span className="text-4xl block mb-3">📤</span>
        <span className="font-condensed text-base font-bold text-[var(--gray-900)]">
          Seleccionar archivo .json
        </span>
        <span className="block mt-2 text-xs text-[var(--gray-500)]">
          Arrastra aquí o haz clic para buscar
        </span>
      </label>
      {status && (
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold">{status}</p>
          {errorDetail && (
            <p className="text-xs text-[var(--gray-500)]">{errorDetail}</p>
          )}
          {errorDetail && (
            <button
              type="button"
              onClick={retry}
              className="text-sm font-semibold text-[var(--red)] hover:underline"
            >
              Reintentar
            </button>
          )}
        </div>
      )}
      {unmapped.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-bold mb-1">
            {unmapped.length} elemento(s) sin equivalente en la nueva ruta:
          </p>
          <p className="font-mono break-all">{unmapped.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
