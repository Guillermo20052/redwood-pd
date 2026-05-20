'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const hasSupabase =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasSupabase) {
      window.location.href = '/dashboard';
      return;
    }

    const supabase = createClient();

    if (mode === 'magic') {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) setError(err.message);
      else setSent(true);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0edea] p-4">
      <div className="login-card">
        <Image
          src="/assets/logo-header.png"
          alt="Redwood High"
          width={140}
          height={48}
          className="mx-auto mb-4 h-12 w-auto"
          priority
        />
        <h1>Ruta de Desarrollo Profesional</h1>
        <p className="text-sm text-center text-[var(--gray-500)] mb-6 mt-2">
          Inicia sesión con tu cuenta de docente
        </p>
        {sent ? (
          <p className="text-sm text-center text-[var(--teal)] font-semibold">
            Revisa tu correo para el enlace de acceso.
          </p>
        ) : (
          <form onSubmit={signIn} className="space-y-4">
            <label className="teacher-field block">
              <span className="text-[10px] font-bold uppercase text-[var(--gray-500)]">
                Correo electrónico
              </span>
              <input
                type="email"
                required
                className="mt-1 w-full border border-[var(--gray-200)] rounded-lg px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="docente@redwood.edu.mx"
              />
            </label>
            {mode === 'password' && (
              <label className="teacher-field block">
                <span className="text-[10px] font-bold uppercase text-[var(--gray-500)]">
                  Contraseña
                </span>
                <input
                  type="password"
                  required
                  className="mt-1 w-full border border-[var(--gray-200)] rounded-lg px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {error && <p className="text-sm text-[var(--red)]">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              {mode === 'password' ? 'Iniciar sesión' : 'Enviar enlace mágico'}
            </button>
            <button
              type="button"
              className="w-full text-xs text-[var(--gray-500)] underline"
              onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
            >
              {mode === 'password' ? 'Usar enlace mágico por correo' : 'Usar correo y contraseña'}
            </button>
            <p className="text-xs text-center text-[var(--gray-500)]">
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
        )}
      </div>
    </div>
  );
}
