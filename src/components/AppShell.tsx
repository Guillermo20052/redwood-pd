'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ProgressBanner } from './ProgressBanner';
import { HelpChatbot } from './HelpChatbot';
import { useProgressContext } from './Providers';
import { createClient } from '@/lib/supabase/client';

const IS_DEV = process.env.NODE_ENV === 'development';

const nav: { href: string; label: string; dot: string; extra?: boolean }[] = [
  { href: '/dashboard', label: 'Inicio', dot: '' },
  { href: '/nivel/b', label: 'Nivel 1', dot: '#1A2E4A' },
  { href: '/nivel/i', label: 'Nivel 2', dot: '#1A7A6E' },
  { href: '/nivel/a', label: 'Nivel 3', dot: '#B22234' },
  { href: '/tareas-extra', label: 'Tareas Level Up', dot: 'var(--gold)', extra: true },
  { href: '/logros', label: 'Logros', dot: '' },
  { href: '/etica', label: 'Ética', dot: '' },
  { href: '/reflexion', label: 'Reflexión', dot: '' },
  { href: '/evaluacion', label: 'Evaluación', dot: '' },
  { href: '/comunidad', label: 'Comunidad', dot: '' },
];

function isLocalMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const progress = useProgressContext();
  const isAdmin = progress.profile.role === 'admin';
  const isLevelPage = pathname.startsWith('/nivel/');
  const [localMode, setLocalMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) setLocalMode(isLocalMode());
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  const logout = async () => {
    if (!localMode) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="site-header no-print relative">
        <div className="header-main">
          <div className="logo-wrap">
            <Image
              src="/assets/logo-header.png"
              alt="Redwood High"
              width={156}
              height={52}
              priority
              className="h-[52px] w-auto"
            />
          </div>
          <div className="header-center hidden md:block">
            <h1>Ruta de Desarrollo Profesional con IA</h1>
            <p>Redwood High School · Liceo de Monterrey</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="mobile-nav-toggle md:hidden"
              aria-expanded={mobileNavOpen}
              aria-label="Menú de navegación"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              ☰
            </button>
            {IS_DEV && localMode && (
              <span className="header-badge text-[10px]">Modo local</span>
            )}
            {IS_DEV && <DevResetMenu />}
            <button
              type="button"
              onClick={logout}
              className="header-badge border-0 cursor-pointer bg-white/20 hover:bg-white/30"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <ProgressBanner {...progress} />

      <nav
        className={`level-nav no-print ${mobileNavOpen ? 'mobile-open' : ''}`}
        aria-label="Niveles"
      >
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href.startsWith('/nivel') && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`level-tab no-underline ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => setMobileNavOpen(false)}
              style={item.extra ? { color: 'var(--gold)' } : undefined}
            >
              {item.dot && (
                <span className="dot" style={{ background: item.dot }} />
              )}
              {item.label}
              {item.extra && (
                <span
                  className="ml-1 text-[9px] font-bold opacity-80"
                  aria-hidden
                >
                  +
                </span>
              )}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/maestras"
            className={`level-tab no-underline ${pathname === '/maestras' || pathname.startsWith('/maestras') ? 'active' : ''}`}
            aria-current={pathname === '/maestras' ? 'page' : undefined}
            onClick={() => setMobileNavOpen(false)}
            style={{ color: 'var(--gold)', fontWeight: 700 }}
          >
            <span className="dot" style={{ background: 'var(--gold)' }} />
            Maestras
          </Link>
        )}
      </nav>

      <main
        className={
          isLevelPage
            ? 'flex-1'
            : 'flex-1 px-4 py-8 md:px-10 md:py-12 lg:px-14 max-w-6xl mx-auto w-full'
        }
      >
        {children}
      </main>

      <HelpChatbot />
    </div>
  );
}

function DevResetMenu() {
  if (!IS_DEV) return null;
  const { refreshCompletions } = useProgressContext();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const reset = async (level: 'b' | 'i' | 'a', label: string) => {
    const ok = window.confirm(
      `¿Reiniciar todo el progreso de ${label}? Esto borra completions de las 5 partes.`
    );
    if (!ok) return;
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch('/api/dev/reset-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Reset failed');
      }
      await refreshCompletions();
      setToast(`${label} reiniciado`);
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast(`Error: ${(e as Error).message}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-red-400 bg-red-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-500/40 disabled:opacity-60"
        title="Solo visible en desarrollo"
      >
        🛠 DEV · Reiniciar
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-[var(--gray-300)] bg-white text-[var(--gray-800)] shadow-lg">
          <button
            type="button"
            onClick={() => reset('b', 'Nivel 1')}
            className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-50)]"
          >
            Reiniciar Nivel 1
          </button>
          <button
            type="button"
            onClick={() => reset('i', 'Nivel 2')}
            className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-50)]"
          >
            Reiniciar Nivel 2
          </button>
          <button
            type="button"
            onClick={() => reset('a', 'Nivel 3')}
            className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-50)]"
          >
            Reiniciar Nivel 3
          </button>
        </div>
      )}
      {toast && (
        <div className="absolute right-0 top-full z-50 mt-1 whitespace-nowrap rounded-md bg-black/85 px-3 py-2 text-[11px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
