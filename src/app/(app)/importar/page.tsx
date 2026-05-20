'use client';

import { useState } from 'react';
import { useProgressContext } from '@/components/Providers';

export default function ImportarPage() {
  const { reload } = useProgressContext();
  const [status, setStatus] = useState('');
  const [unmapped, setUnmapped] = useState<string[]>([]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Importando...');
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
        const err = await res.json();
        importLocal(payload);
        setStatus(err.error || 'Importado en modo local');
        reload();
      }
    } catch {
      setStatus('Archivo JSON inválido');
    }
  };

  const importLocal = (payload: { pd?: string; ref?: string }) => {
    if (payload.pd) {
      const state = JSON.parse(payload.pd);
      localStorage.setItem('redwood_pd_local_v2', JSON.stringify({ checked: state, profile: {} }));
    }
    if (payload.ref) {
      localStorage.setItem('redwood_ref_local', payload.ref);
    }
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
        <input type="file" accept=".json" className="hidden" onChange={onFile} />
        <span className="text-4xl block mb-3">📤</span>
        <span className="font-condensed text-base font-bold text-[var(--gray-900)]">
          Seleccionar archivo .json
        </span>
        <span className="block mt-2 text-xs text-[var(--gray-500)]">
          Arrastra aquí o haz clic para buscar
        </span>
      </label>
      {status && <p className="text-sm font-semibold text-center">{status}</p>}
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
