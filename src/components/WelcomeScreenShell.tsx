'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ButtonVariant = 'red' | 'gold';

type Props = {
  confirmEndpoint: string;
  buttonLabel: string;
  buttonVariant?: ButtonVariant;
  showConfirm: boolean;
  redirectOnSuccess?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
};

export function WelcomeScreenShell({
  confirmEndpoint,
  buttonLabel,
  buttonVariant = 'red',
  showConfirm,
  redirectOnSuccess,
  backHref,
  backLabel = 'Volver a Bienvenida',
  children,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(confirmEndpoint, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar la confirmación.');
        return;
      }
      router.push(typeof data.next === 'string' ? data.next : redirectOnSuccess || '/dashboard');
      router.refresh();
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="welcome-flow-page">
      <div className="welcome-flow-header">
        <Image
          src="/assets/logo-header.png"
          alt="Liceo de Monterrey Redwood"
          width={140}
          height={46}
          priority
          className="welcome-flow-logo"
        />
      </div>

      <div className="welcome-flow-card">{children}</div>

      <div className="welcome-flow-actions">
        {showConfirm ? (
          <>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={submitting}
              className={
                buttonVariant === 'gold' ? 'welcome-btn welcome-btn-gold' : 'welcome-btn welcome-btn-red'
              }
            >
              {submitting ? 'Guardando…' : buttonLabel}
            </button>
            {error && (
              <p className="welcome-flow-error" role="alert">
                {error}
              </p>
            )}
          </>
        ) : backHref ? (
          <Link href={backHref} className="welcome-back-link">
            ← {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
