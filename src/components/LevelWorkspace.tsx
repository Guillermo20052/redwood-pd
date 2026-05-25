'use client';

import { useState } from 'react';
import Link from 'next/link';
import { levels } from '@/lib/content';
import { useProgressContext } from './Providers';
import { VerifiedPathSection } from './VerifiedPathSection';
import { LevelLockBanner } from './LevelLockBanner';
import { LevelSectionContent } from './LevelSectionContent';
import { isLevelUnlocked, getLevelHours, getLevelProgressPercent } from '@/lib/progress';
const DEFAULT_SECTION = 'ov';

const SECTIONS = [
  { id: 'ov', label: 'Plan de Trabajo', icon: '🎯' },
  { id: 'wk', label: 'Plan de Sesiones', icon: '📅' },
  { id: 'tools', label: 'Herramientas', icon: '🔧' },
  { id: 'mod', label: 'Modalidades Prakash Nair', icon: '🧠' },
  { id: 'ib', label: 'Alineación IB', icon: '📚' },
  { id: 'subj', label: 'Aplicaciones por Materia', icon: '🎨' },
  { id: 'hsk', label: 'Habilidades', icon: '🌟' },
] as const;

const LEVEL_EYEBROW: Record<string, string> = {
  b: 'Nivel 1 · Fundamentos',
  i: 'Nivel 2 · Integración',
  a: 'Nivel 3 · Transformación',
};

const LEVEL_INTRO: Record<string, string> = {
  b: 'Descubre cómo la IA puede apoyar tu práctica IB sin perder el rigor ni la voz de tus alumnas.',
  i: 'Integra IA en planeación, evaluación y diferenciación con evidencia verificada en cada paso.',
  a: 'Lidera la transformación pedagógica con flujos avanzados y tareas que te retan a innovar.',
};

type Props = { slug: string };

export function LevelWorkspace({ slug }: Props) {
  const level = levels.find((l) => l.slug === slug)!;
  const { completions, refreshCompletions, profile } = useProgressContext();
  const [section, setSection] = useState(DEFAULT_SECTION);
  const isAdmin = profile.role === 'admin';

  const locked =
    !isAdmin &&
    (slug === 'i' || slug === 'a') &&
    !isLevelUnlocked(completions, slug as 'i' | 'a', false);
  const heroClass = slug === 'b' ? 'lh-b' : slug === 'i' ? 'lh-i' : 'lh-a';
  const levelHours = getLevelHours(completions, slug as 'b' | 'i' | 'a');
  const targetHours = level.totalHours ?? 10;
  const progressPct = getLevelProgressPercent(completions, slug as 'b' | 'i' | 'a', targetHours);

  return (
    <div className="lvl-content active">
      <div className="main-layout">
        <aside className="sidebar no-print">
          <div className="sb-section-title">{level.name}</div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`nav-item w-full text-left border-0 bg-transparent ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              <span className="nav-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </aside>

        <div className="content-area">
          {isAdmin && (
            <p
              className="text-xs font-semibold rounded-lg px-3 py-2 mb-4"
              style={{
                background: 'color-mix(in srgb, var(--gold) 18%, transparent)',
                border: '1px solid var(--gold)',
                color: 'var(--navy)',
              }}
            >
              Vista previa de admin · sin restricciones de nivel o parte
            </p>
          )}

          <div className={`level-hero ${heroClass}`}>
            <div className="level-hero-tag">{LEVEL_EYEBROW[slug]}</div>
            <h2>{level.tagline}</h2>
            <p>{LEVEL_INTRO[slug]}</p>
            <div className="hero-stats hero-stat-row">
              <div className="hero-stat-box">
                <div className="hs-num">5</div>
                <div className="hs-lbl">partes</div>
              </div>
              <div className="hero-stat-box">
                <div className="hs-num">{levelHours.toFixed(0)}h</div>
                <div className="hs-lbl">verificadas</div>
              </div>
              <div className="hero-stat-box">
                <div className="hs-num">1</div>
                <div className="hs-lbl">tarea colaborativa</div>
              </div>
              <div className="hero-stat-box">
                <div className="hs-num">{progressPct}%</div>
                <div className="hs-lbl">tu progreso</div>
              </div>
            </div>
          </div>

          {locked && section === 'ov' && slug === 'i' && (
            <LevelLockBanner level="i" checked={completions} />
          )}
          {locked && section === 'ov' && slug === 'a' && (
            <LevelLockBanner level="a" checked={completions} />
          )}

          {locked && section === 'ov' ? null : (
            <>
              {section === 'ov' && (
                <div className="sec-content active">
                  <div className="goal-grid">
                    <div className="goal-crd gold">
                      <div className="goal-ttl" style={{ color: 'var(--gold)' }}>
                        Ruta secuencial
                      </div>
                      <div className="goal-txt">
                        Avanza paso a paso: video, tarea con IA y reflexión en cada parte.
                      </div>
                    </div>
                    <div className="goal-crd teal">
                      <div className="goal-ttl" style={{ color: 'var(--teal)' }}>
                        Comunidad
                      </div>
                      <div className="goal-txt">
                        <Link href="/comunidad" className="text-[var(--red)] font-semibold">
                          Conecta con tus colegas
                        </Link>
                      </div>
                    </div>
                    <div className="goal-crd navy">
                      <div className="goal-ttl" style={{ color: 'var(--navy)' }}>
                        Meta del nivel
                      </div>
                      <div className="goal-txt">
                        Completa las 5 partes y la tarea colaborativa para sumar horas acreditables.
                      </div>
                    </div>
                  </div>
                  <VerifiedPathSection
                    level={slug}
                    completions={completions}
                    isAdmin={isAdmin}
                    onUpdated={refreshCompletions}
                  />
                </div>
              )}

              {section !== 'ov' && (
                <>
                  {locked && (
                    <p className="text-xs text-[var(--gray-500)] mb-4">
                      Estás explorando el contenido de referencia. Para completar las partes
                      verificadas, primero desbloquea este nivel.
                    </p>
                  )}
                  <LevelSectionContent level={slug} section={section} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
