'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      setError('Supabase no configurado. Usa modo local desde login.');
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName, subject },
      },
    });
    if (err) setError(err.message);
    else setSent(true);
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
        <h1>Crear cuenta</h1>
        <p className="text-sm text-center text-[var(--gray-500)] mb-6 mt-2">
          Registro para docentes de Redwood High
        </p>
        {sent ? (
          <p className="text-sm text-center text-[var(--teal)] font-semibold">
            Revisa tu correo para confirmar tu cuenta.
          </p>
        ) : (
          <form onSubmit={signUp} className="space-y-4">
            <label className="block text-xs font-bold uppercase text-[var(--gray-500)]">
              Nombre completo
              <input
                required
                className="mt-1 w-full border border-[var(--gray-200)] rounded-lg px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="block text-xs font-bold uppercase text-[var(--gray-500)]">
              Materia / área
              <input
                className="mt-1 w-full border border-[var(--gray-200)] rounded-lg px-3 py-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="block text-xs font-bold uppercase text-[var(--gray-500)]">
              Correo
              <input
                type="email"
                required
                className="mt-1 w-full border border-[var(--gray-200)] rounded-lg px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-xs font-bold uppercase text-[var(--gray-500)]">
              Contraseña
              <input
                type="password"
                required
                minLength={6}
                className="mt-1 w-full border border-[var(--gray-200)] rounded-lg px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-[var(--red)]">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              Registrarme
            </button>
            <p className="text-xs text-center text-[var(--gray-500)]">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[var(--red)] font-semibold">
                Inicia sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
