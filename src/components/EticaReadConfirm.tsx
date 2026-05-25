'use client';

import { useState } from 'react';

type Props = {
  initialReadAt: string | null;
};

export function EticaReadConfirm({ initialReadAt }: Props) {
  const [readAt, setReadAt] = useState<string | null>(initialReadAt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/etica/confirm', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar la confirmación.');
        return;
      }
      setReadAt(typeof data.etica_read_at === 'string' ? data.etica_read_at : new Date().toISOString());
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 pt-8 flex flex-col items-center text-center">
      {readAt ? (
        <p
          className="text-sm font-semibold text-[var(--green)] px-4 py-3 rounded-lg border border-[var(--green)]/30 bg-[var(--green-light)]"
          role="status"
        >
          ✓ Ética leída · {formatEticaDate(readAt)}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={submitting}
            className="rounded-full border-2 border-[var(--gold)] bg-transparent px-6 py-2.5 text-sm font-semibold text-[var(--navy)] transition hover:bg-[var(--gold-light)] disabled:opacity-50"
          >
            {submitting ? 'Guardando…' : 'Confirmar lectura'}
          </button>
          {error && <p className="mt-3 text-xs text-[var(--red)]">{error}</p>}
        </>
      )}
    </div>
  );
}

function formatEticaDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
