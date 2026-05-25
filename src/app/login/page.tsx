'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const hasSupabase = isSupabaseConfigured();

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Tu correo aún no está confirmado.';
  if (m.includes('user not found')) return 'No encontramos una cuenta con ese correo.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un minuto y vuelve a intentar.';
  return message;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const search = useSearchParams();
  const next = search.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!hasSupabase) {
      window.location.href = next;
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(translateAuthError(err.message));
        setLoading(false);
        return;
      }
      window.location.href = next;
    } catch (err) {
      setError((err as Error).message || 'No se pudo iniciar sesión.');
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Escribe tu correo arriba para enviarte el enlace de recuperación.');
      return;
    }
    if (!hasSupabase) {
      setError('Supabase no está configurado en este entorno.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      });
      if (err) {
        setError(translateAuthError(err.message));
      } else {
        setInfo('Te enviamos un correo con el enlace para restablecer tu contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-card w-full max-w-[440px]">
        <div className="auth-logo-wrap">
          <Image
            src="/assets/logo-header.png"
            alt="Liceo de Monterrey Redwood"
            width={160}
            height={56}
            className="h-14 w-auto"
            priority
          />
        </div>
        <h1 className="text-center text-[15px] font-extrabold leading-snug tracking-wide text-[var(--navy)]">
          LICEO DE MONTERREY REDWOOD - RUTA DE DESARROLLO PROFESIONAL
        </h1>
        <p className="text-sm text-center text-[var(--gray-500)] mb-6 mt-2">
          Inicia sesión para continuar tu camino
        </p>
        <form onSubmit={signIn} className="space-y-4">
          <label className="auth-field">
            <span>
              Correo electrónico
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="docente@redwood.edu.mx"
              disabled={loading}
            />
          </label>
          <label className="auth-field">
            <span>
              Contraseña
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>
          {error && (
            <p className="text-sm text-[var(--red)] bg-[var(--red-pale)] border border-[var(--red)]/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-[var(--teal)] bg-[var(--teal-light)] border border-[var(--teal)]/20 rounded-md px-3 py-2">
              {info}
            </p>
          )}
          <button type="submit" className="btn-primary auth-submit-btn w-full" disabled={loading}>
            {loading ? 'Cargando…' : 'Iniciar sesión'}
          </button>
          <button
            type="button"
            onClick={resetPassword}
            disabled={loading}
            className="w-full text-xs text-[var(--gray-500)] hover:text-[var(--red)] underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <p className="text-xs text-center text-[var(--gray-500)] pt-2 border-t border-[var(--gray-200)]">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="text-[var(--red)] font-semibold">
              Regístrate
            </Link>
          </p>
          {!hasSupabase && (
            <p className="text-xs text-center text-[var(--gray-500)]">
              Sin Supabase configurado,{' '}
              <a href="/dashboard" className="text-[var(--red)] font-semibold">
                continuar en modo local
              </a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
