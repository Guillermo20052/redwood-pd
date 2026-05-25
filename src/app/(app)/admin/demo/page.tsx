'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DiplomaModal } from '@/components/DiplomaModal';
import { useProgressContext } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import {
  celebrateDiploma,
  celebrateLarge,
  celebrateSmall,
  HOURS_TOAST,
  LEVEL_LABELS,
} from '@/lib/celebrate';
import { getPartsByLevel } from '@/lib/curriculum-path';
import type { DiplomaTier } from '@/lib/diplomas';
import { countCompletedExtras } from '@/lib/extras-gating';
import { isPartComplete } from '@/lib/part-progress';
import { createClient } from '@/lib/supabase/client';

const DIPLOMA_HOURS: Record<DiplomaTier, number> = { 1: 20, 2: 24, 3: 30 };

const LEVEL_COLORS: Record<'b' | 'i' | 'a', string[]> = {
  b: ['#1A2E4A', '#C8972A', '#F0EDEA'],
  i: ['#1A7A6E', '#C8972A', '#F0EDEA'],
  a: ['#B22234', '#C8972A', '#F0EDEA'],
};

const LEVEL_SHORT: Record<'b' | 'i' | 'a', string> = {
  b: 'Nivel 1 (Fundamentos)',
  i: 'Nivel 2 (Integración)',
  a: 'Nivel 3 (Transformación)',
};

function isLocalMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default function DemoModePage() {
  const router = useRouter();
  const showToast = useToast();
  const { profile, loading, totalHours, completions, refreshCompletions, reload } =
    useProgressContext();

  const [diplomaTier, setDiplomaTier] = useState<DiplomaTier | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && profile.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, profile.role, router]);

  const progressSummary = useMemo(() => {
    const levels = (['b', 'i', 'a'] as const).map((level) => {
      const parts = getPartsByLevel(level);
      const partsDone = parts.filter((p) => isPartComplete(p, completions)).length;
      return {
        level,
        label: LEVEL_LABELS[level],
        partsDone,
        partsTotal: parts.length,
        extrasDone: countCompletedExtras(level, completions),
      };
    });
    return levels;
  }, [completions]);

  const triggerDiploma = (tier: DiplomaTier) => {
    celebrateDiploma(tier);
    setDiplomaTier(tier);
  };

  const triggerLevelComplete = (level: 'b' | 'i' | 'a') => {
    celebrateLarge({ colors: LEVEL_COLORS[level] });
    showToast(`¡Completaste el ${LEVEL_LABELS[level]}!`, {
      duration: 6000,
      action: { label: 'Ver progreso', href: '/dashboard' },
    });
  };

  const triggerMilestone = (hours: 5 | 10 | 15) => {
    celebrateSmall();
    showToast(HOURS_TOAST[hours] ?? `Llegaste a ${hours}h verificadas.`);
  };

  const postReset = useCallback(
    async (endpoint: string, body?: object) => {
      setBusy(true);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Error al resetear');
        if (data.completions) {
          await refreshCompletions();
        } else {
          await reload();
        }
        return true;
      } catch (e) {
        showToast(`Error: ${(e as Error).message}`);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refreshCompletions, reload, showToast]
  );

  const confirmReset = async (message: string, action: () => Promise<boolean>) => {
    if (!window.confirm(message)) return;
    await action();
  };

  const logout = async () => {
    if (!isLocalMode()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  if (loading || profile.role !== 'admin') {
    return (
      <div className="demo-mode-page">
        <div className="demo-mode-loading">Cargando panel de demo…</div>
      </div>
    );
  }

  return (
    <div className="demo-mode-page">
      <header className="demo-mode-hero">
        <div className="demo-mode-hero-glow" aria-hidden />
        <div className="demo-mode-hero-top">
          <span className="demo-mode-eyebrow">Modo admin · Vista previa</span>
          <span className="demo-mode-badge">ADMIN</span>
        </div>
        <h1>Demo Mode</h1>
        <p className="demo-mode-subtitle">
          Simula cualquier estado para previsualizar lo que verán las docentes. Nada se guarda en
          la base de datos — todo es solo visual.
        </p>
        <div className="demo-mode-warning" role="note">
          Estas acciones NO modifican tu progreso real ni el de las docentes. Es solo para vista
          previa.
        </div>
      </header>

      <DemoSection
        title="Disparar diplomas (visual)"
        subtitle="Activa el flujo de un diploma — verás el modal del certificado, la animación de confetti y todo lo que ve la docente."
      >
        <DemoButton
          label="Ganar Diploma 1 (Bronce)"
          hint="Confetti bronce + modal de certificado · 20h simuladas"
          accent="bronze"
          onClick={() => triggerDiploma(1)}
        />
        <DemoButton
          label="Ganar Diploma 2 (Plata)"
          hint="Confetti plata + modal de certificado · 24h simuladas"
          accent="silver"
          onClick={() => triggerDiploma(2)}
        />
        <DemoButton
          label="Ganar Diploma 3 (Oro)"
          hint="Confetti oro + modal de certificado · 30h simuladas"
          accent="gold"
          onClick={() => triggerDiploma(3)}
        />
      </DemoSection>

      <DemoSection
        title="Completar niveles (visual)"
        subtitle="Activa la celebración de nivel completo sin modificar tu progreso real."
      >
        {(['b', 'i', 'a'] as const).map((level) => (
          <DemoButton
            key={level}
            label={`Completar ${LEVEL_SHORT[level]}`}
            hint="Confetti grande + toast de nivel completo"
            accent={level === 'b' ? 'navy' : level === 'i' ? 'teal' : 'red'}
            onClick={() => triggerLevelComplete(level)}
          />
        ))}
      </DemoSection>

      <DemoSection
        title="Disparar milestones de horas"
        subtitle="Activa la celebración de los milestones intermedios."
      >
        {([5, 10, 15] as const).map((hours) => (
          <DemoButton
            key={hours}
            label={`${hours}h verificadas`}
            hint={HOURS_TOAST[hours]}
            accent="neutral"
            onClick={() => triggerMilestone(hours)}
          />
        ))}
      </DemoSection>

      <DemoSection
        title="Resetear progreso de admin"
        subtitle="Borra el progreso de admin-skip de partes específicas. Esto SÍ modifica la base de datos (solo tus rows de admin-skip)."
        destructive
      >
        <div className="demo-mode-group">
          <p className="demo-mode-group-label">Por nivel</p>
          {(['b', 'i', 'a'] as const).map((level) => (
            <DemoButton
              key={level}
              label={`Resetear todo ${LEVEL_SHORT[level]}`}
              hint="Elimina completions admin-skip de este nivel"
              accent="destructive"
              disabled={busy}
              onClick={() =>
                void confirmReset(
                  `¿Estás segura? Esto borrará tu progreso admin-skip de ${LEVEL_SHORT[level]}. No afecta a las docentes.`,
                  async () => {
                    const ok = await postReset('/api/admin/demo/reset-level', { level });
                    if (ok) showToast(`Progreso reseteado · ${LEVEL_SHORT[level]}`);
                    return ok;
                  }
                )
              }
            />
          ))}
        </div>

        <div className="demo-mode-group">
          <p className="demo-mode-group-label">Por categoría</p>
          <DemoButton
            label="Resetear todas las tareas Level Up"
            hint="Elimina extras admin-skip (extra-lvl-*)"
            accent="destructive"
            disabled={busy}
            onClick={() =>
              void confirmReset(
                '¿Estás segura? Esto borrará tus tareas Level Up admin-skip. No afecta a las docentes.',
                async () => {
                  const ok = await postReset('/api/admin/demo/reset-category', {
                    category: 'extras',
                  });
                  if (ok) showToast('Progreso reseteado · Tareas Level Up');
                  return ok;
                }
              )
            }
          />
          <DemoButton
            label="Resetear todas las tareas colaborativas"
            hint="Elimina collab admin-skip (collab-lvl-*)"
            accent="destructive"
            disabled={busy}
            onClick={() =>
              void confirmReset(
                '¿Estás segura? Esto borrará tus tareas colaborativas admin-skip. No afecta a las docentes.',
                async () => {
                  const ok = await postReset('/api/admin/demo/reset-category', {
                    category: 'collab',
                  });
                  if (ok) showToast('Progreso reseteado · Tareas colaborativas');
                  return ok;
                }
              )
            }
          />
        </div>

        <div className="demo-mode-group">
          <p className="demo-mode-group-label">Nuclear</p>
          <DemoButton
            label="Resetear TODO mi progreso"
            hint="Elimina todas tus completions y reflexiones de sesión"
            accent="nuclear"
            disabled={busy}
            onClick={() =>
              void confirmReset(
                '¿Estás segura? Esto borrará TODO tu progreso de admin. No afecta a las docentes.',
                async () => {
                  const ok = await postReset('/api/admin/demo/reset-all');
                  if (ok) showToast('Progreso reseteado · Todo');
                  return ok;
                }
              )
            }
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Resetear flujos iniciales"
        subtitle="Vuelve a ver los mensajes de bienvenida o el tour guiado desde cero."
        destructive
      >
        <DemoButton
          label="Resetear flujo de bienvenida"
          hint="Limpia welcome_cynthia/pope/about_read_at"
          accent="destructive"
          disabled={busy}
          onClick={() =>
            void confirmReset(
              '¿Estás segura? Esto reiniciará el flujo de bienvenida en tu próxima navegación.',
              async () => {
                const ok = await postReset('/api/admin/demo/reset-welcome');
                if (ok) showToast('Progreso reseteado · Flujo de bienvenida');
                return ok;
              }
            )
          }
        />
        <DemoButton
          label="Resetear tour guiado"
          hint="Limpia tour_completed_at"
          accent="destructive"
          disabled={busy}
          onClick={() =>
            void confirmReset(
              '¿Estás segura? Esto reiniciará el tour guiado en tu próxima visita al dashboard.',
              async () => {
                const ok = await postReset('/api/admin/demo/reset-tour');
                if (ok) showToast('Progreso reseteado · Tour guiado');
                return ok;
              }
            )
          }
        />
      </DemoSection>

      <DemoSection title="Utilidades" subtitle="Consulta tu estado actual o cierra sesión.">
        <DemoButton
          label="Ver mi progreso actual"
          hint="Drawer con horas, partes y Level Up por nivel"
          accent="neutral"
          onClick={() => setDrawerOpen(true)}
        />
        <DemoButton
          label="Cerrar sesión"
          hint="Igual que Salir en el menú de usuario"
          accent="neutral"
          onClick={() => void logout()}
        />
      </DemoSection>

      {diplomaTier != null && (
        <DiplomaModal
          tier={diplomaTier}
          teacherName={profile.full_name}
          teacherEmail={profile.email}
          awardedDate={new Date()}
          totalHours={DIPLOMA_HOURS[diplomaTier]}
          celebrate
          onClose={() => setDiplomaTier(null)}
        />
      )}

      {drawerOpen && (
        <div
          className="demo-mode-drawer-overlay"
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="demo-mode-drawer"
            role="dialog"
            aria-label="Progreso actual"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="demo-mode-drawer-header">
              <h3>Mi progreso actual</h3>
              <button type="button" className="demo-mode-drawer-close" onClick={() => setDrawerOpen(false)}>
                ×
              </button>
            </div>
            <div className="demo-mode-drawer-body">
              <div className="demo-mode-stat">
                <span className="demo-mode-stat-label">Horas verificadas</span>
                <strong>{totalHours.toFixed(1)}h</strong>
              </div>
              {progressSummary.map((row) => (
                <div key={row.level} className="demo-mode-stat">
                  <span className="demo-mode-stat-label">{row.label}</span>
                  <strong>
                    {row.partsDone}/{row.partsTotal} partes · {row.extrasDone} Level Up
                  </strong>
                </div>
              ))}
              <p className="demo-mode-drawer-note">
                Solo lectura. Los resets de arriba modifican datos; las simulaciones visuales no.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function DemoSection({
  title,
  subtitle,
  destructive = false,
  children,
}: {
  title: string;
  subtitle: string;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`demo-mode-section${destructive ? ' demo-mode-section--destructive' : ''}`}>
      <div className="demo-mode-section-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="demo-mode-actions">{children}</div>
    </section>
  );
}

function DemoButton({
  label,
  hint,
  accent,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  accent:
    | 'bronze'
    | 'silver'
    | 'gold'
    | 'navy'
    | 'teal'
    | 'red'
    | 'neutral'
    | 'destructive'
    | 'nuclear';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`demo-mode-btn demo-mode-btn--${accent}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="demo-mode-btn-label">{label}</span>
      <span className="demo-mode-btn-hint">{hint}</span>
    </button>
  );
}
