'use client';

import { useState } from 'react';
import Link from 'next/link';
import { levels, tools } from '@/lib/content';
import { useProgressContext } from './Providers';
import { VerifiedPathSection } from './VerifiedPathSection';
import { LevelLockBanner } from './LevelLockBanner';
import { SessionsSection } from './SessionsSection';
import { isLevelUnlocked, getLevelHours } from '@/lib/progress';
import { getPathByLevel, getPartsByLevel } from '@/lib/curriculum-path';

const SECTIONS = [
  { id: 'ov', label: 'Visión General', icon: '🎯' },
  { id: 'wk', label: 'Plan de Sesiones', icon: '📅' },
  { id: 'tools', label: 'Herramientas', icon: '🔧' },
  { id: 'mod', label: 'Modalidades Nair', icon: '🧠' },
  { id: 'ib', label: 'Alineación IB', icon: '📚' },
  { id: 'subj', label: 'Aplicaciones por Materia', icon: '🎨' },
  { id: 'hsk', label: 'Habilidades', icon: '🌟' },
];

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
  const { completions, refreshCompletions } = useProgressContext();
  const [section, setSection] = useState('ov');

  const locked =
    (slug === 'i' || slug === 'a') && !isLevelUnlocked(completions, slug as 'i' | 'a');
  const heroClass = slug === 'b' ? 'lh-b' : slug === 'i' ? 'lh-i' : 'lh-a';
  const pathItems = getPathByLevel(slug);
  const parts = getPartsByLevel(slug);
  const collabCount = parts.filter((p) => p.collaborative).length;
  const verifiedCount = pathItems.filter(
    (p) => completions[p.itemKey]?.status === 'verified'
  ).length;
  const levelHours = getLevelHours(completions, slug as 'b' | 'i' | 'a');
  const progressPct = Math.round((verifiedCount / Math.max(1, parts.length)) * 100);

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
                <div className="hs-num">{collabCount}</div>
                <div className="hs-lbl">tareas colaborativas</div>
              </div>
              <div className="hero-stat-box">
                <div className="hs-num">{progressPct}%</div>
                <div className="hs-lbl">tu progreso</div>
              </div>
            </div>
          </div>

          {slug === 'i' && <LevelLockBanner level="i" checked={completions} />}
          {slug === 'a' && <LevelLockBanner level="a" checked={completions} />}

          {locked ? (
            <p className="text-center py-12 text-[var(--gray-500)]">
              Completa las horas del nivel anterior para desbloquear.
            </p>
          ) : (
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
                        Completa las 5 partes verificadas para sumar 10h acreditables.
                      </div>
                    </div>
                  </div>
                  <VerifiedPathSection
                    level={slug}
                    completions={completions}
                    onUpdated={refreshCompletions}
                  />
                </div>
              )}

              {section === 'wk' && <SessionsSection level={slug} />}

              {section === 'tools' && (
                <div className="sec-content active">
                  <div className="sec-hdr">
                    <h2 className="sec-title">Herramientas IA</h2>
                  </div>
                  <div className="tools-grid">
                    {tools.map((t) => (
                      <a
                        key={t.name}
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tool-crd no-underline"
                      >
                        <div className="tool-icon">{t.icon}</div>
                        <div className="tool-name">{t.name}</div>
                        <div className="tool-desc">{t.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!['ov', 'tools', 'wk'].includes(section) && (
                <div className="sec-content active">
                  <p className="text-sm text-[var(--gray-600)]">
                    El contenido detallado de esta sección está en el documento original de la
                    ruta. Tu progreso verificado vive en <strong>Visión General</strong>.
                  </p>
                  <button type="button" className="dl-btn mt-4" onClick={() => setSection('ov')}>
                    Ir a la ruta verificada
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
