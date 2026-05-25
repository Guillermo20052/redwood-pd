'use client';

import { useState } from 'react';
import { useProgressContext } from './Providers';

type Props = {
  itemKey: string;
  onReset?: () => void;
};

export function AdminResetButton({ itemKey, onReset }: Props) {
  const { profile, resetItem } = useProgressContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (profile.role !== 'admin') return null;

  const handleReset = async () => {
    if (loading) return;
    const ok = window.confirm(
      '¿Estás segura de reiniciar esta tarea? Borrará la verificación actual y la podrás volver a hacer.'
    );
    if (!ok) return;

    setLoading(true);
    setError('');
    try {
      await resetItem(itemKey);
      onReset?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={loading}
        style={{
          background: 'transparent',
          border: '1.5px solid var(--gold)',
          color: 'var(--gold)',
          fontWeight: 700,
        }}
        className="rounded-lg px-3 py-1 text-xs disabled:opacity-50"
      >
        {loading ? 'Reiniciando…' : 'Reiniciar tarea'}
      </button>
      {error && <span className="text-xs text-[var(--red)]">{error}</span>}
    </div>
  );
}
