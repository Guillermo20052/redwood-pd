'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { isAllowedSignupEmail, SIGNUP_DOMAIN_ERROR } from '@/lib/signup-domain';

const hasSupabase = isSupabaseConfigured();

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('user already registered'))
    return 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.';
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('invalid email')) return 'Correo electrónico inválido.';
  if (m.includes('rate limit'))
    return 'Demasiados intentos. Espera un minuto y vuelve a intentar.';
  return message;
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!hasSupabase) {
      setError('Supabase no está configurado en este entorno. Usa modo local desde /login.');
      return;
    }

    if (!isAllowedSignupEmail(email)) {
      setError(SIGNUP_DOMAIN_ERROR);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            full_name: fullName,
            subject,
            subject_area: subject,
          },
        },
      });

      if (err) {
        setError(translateAuthError(err.message));
        setLoading(false);
        return;
      }

      // With "Confirm email" disabled in Supabase Auth settings, signUp returns
      // an active session immediately. The trigger in migration 007 creates
      // the profile row, but we upsert here too as a belt-and-suspenders so the
      // app still works if the trigger isn't installed yet.
      if (data.user) {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: data.user.email ?? email,
              full_name: fullName,
              subject,
              role: 'teacher',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
      }

      if (data.session) {
        window.location.href = '/dashboard';
        return;
      }

      // Fallback: email confirmation is still on for this project.
      setInfo(
        'Cuenta creada. Revisa tu correo para confirmar y poder iniciar sesión.'
      );
      setLoading(false);
    } catch (err) {
      setError((err as Error).message || 'No se pudo crear la cuenta.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-card w-full max-w-[440px]">
        <div className="auth-logo-wrap">
          <Image
            src="/assets/logo-header.png"
            alt="Liceo Redwood"
            width={160}
            height={56}
            className="h-14 w-auto"
            priority
          />
        </div>
        <h1>Crea tu cuenta</h1>
        <p className="text-sm text-center text-[var(--gray-500)] mb-6 mt-2">
          Únete al programa de Desarrollo Profesional con IA
        </p>
        <form onSubmit={signUp} className="space-y-4">
          <label className="auth-field">
            <span>
              Nombre completo
            </span>
            <input
              required
              autoComplete="name"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Sofía Martínez"
              disabled={loading}
            />
          </label>
          <label className="auth-field">
            <span>
              Materia o área
            </span>
            <input
              className="auth-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. Matemáticas"
              disabled={loading}
            />
          </label>
          <label className="auth-field">
            <span>
              Correo
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@liceodemonterrey.edu.mx"
              disabled={loading}
            />
            <p className="mt-1.5 text-[11px] text-[var(--gray-500)] leading-snug">
              Solo emails @liceodemonterrey.edu.mx pueden registrarse.
            </p>
          </label>
          <label className="auth-field">
            <span>
              Contraseña
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Creando cuenta…' : 'Registrarme'}
          </button>
          <p className="text-xs text-center text-[var(--gray-500)] pt-2 border-t border-[var(--gray-200)]">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[var(--red)] font-semibold">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
