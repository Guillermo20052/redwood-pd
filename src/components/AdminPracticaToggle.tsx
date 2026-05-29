'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = {
  /** Server-read flag so the panel is correct before the client fetch. */
  initialEnabled?: boolean;
};

export function AdminPracticaToggle({ initialEnabled = false }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/practica-flag');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
      setEnabled(data.enabled === true);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/practica-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
      setEnabled(data.enabled === true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-practica-panel">
      <h3 className="admin-practica-panel__title">Tareas de práctica (taller)</h3>
      <p className="admin-practica-panel__status">
        Estado actual:{' '}
        <strong>
          {enabled ? 'Activada — visible en el menú' : 'Desactivada — oculta'}
        </strong>
      </p>
      <p className="text-sm text-[var(--gray-600)] mb-3 leading-relaxed">
        Activa esta sección antes de la sesión de mañana. Las docentes verán la pestaña Práctica entre
        Evaluación y Comunidad. No suma horas ni diplomas.
      </p>
      {error && (
        <p className="text-sm text-[var(--red)] mb-2" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className={`admin-practica-panel__btn ${enabled ? 'admin-practica-panel__btn--off' : ''}`}
        disabled={busy}
        onClick={() => void toggle()}
      >
        {busy
          ? 'Guardando…'
          : enabled
            ? 'Desactivar tareas de práctica'
            : 'Activar tareas de práctica'}
      </button>
    </div>
  );
}
