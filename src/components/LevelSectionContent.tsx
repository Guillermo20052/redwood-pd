'use client';

import { getToolsByLevel } from '@/lib/content';
import { HABILIDADES_FALLBACK } from '@/lib/habilidades-fallback';
import {
  getLevelAncillary,
  getModalitiesPill,
  getSubjectsPill,
} from '@/lib/level-ancillary';
import { getAplicacionesIb } from '@/lib/aplicaciones-ib';
import { SessionsSection } from './SessionsSection';

type Props = {
  level: string;
  section: string;
};

export function LevelSectionContent({ level, section }: Props) {
  const data = getLevelAncillary(level);
  const lvClass = level === 'b' ? 'lv-b' : level === 'i' ? 'lv-i' : 'lv-a';

  if (section === 'wk') {
    return <SessionsSection level={level} />;
  }

  if (section === 'tools') {
    const tools = getToolsByLevel(level);
    return (
      <div className="sec-content active">
        <div className="sec-hdr">
          <h2 className="sec-title">Herramientas IA</h2>
          <span className="sec-pill">2025–2026</span>
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
    );
  }

  if (section === 'mod') {
    return (
      <div className="sec-content active">
        <div className="sec-hdr">
          <div className="sec-title">Modalidades Prakash Nair</div>
          <div className="sec-pill">{getModalitiesPill(level)}</div>
        </div>
        <div className="mod-grid">
          {data.modalities.map((m) => (
            <div key={m.name} className="mod-crd">
              <div className="mod-name">{m.name}</div>
              <div className="mod-how">{m.how}</div>
              <div className="mod-ex">{m.example}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'ib') {
    return (
      <div className="sec-content active">
        <div className="sec-hdr">
          <h2 className="sec-title">Alineación IB · {level === 'b' ? 'Nivel 1' : level === 'i' ? 'Nivel 2' : 'Nivel 3'}</h2>
        </div>
        <div className="ib-grid">
          {data.ib.map((card) => (
            <div key={card.title} className="ib-crd">
              <div className="ib-ttl">{card.title}</div>
              <ul className="ib-list">
                {card.items.map((item) => (
                  <li key={item}>
                    <span>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'subj') {
    const subjects = getAplicacionesIb(level);
    return (
      <div className="sec-content active">
        <div className="sec-hdr">
          <div className="sec-title">Aplicaciones por Materia</div>
          <div className="sec-pill">{getSubjectsPill(level)} · IB DP</div>
        </div>
        <p className="mb-4 text-sm text-[var(--gray-600)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
          Ejemplos concretos por materia del Bachillerato Internacional y las cinco herramientas de
          este nivel.
        </p>
        <div className="subj-grid">
          {subjects.map((s) => (
            <div
              key={s.name}
              className="subj-crd"
              style={
                s.highlight
                  ? { border: '1px solid var(--red)', borderTop: '3px solid var(--red)' }
                  : undefined
              }
            >
              <div className="subj-hdr">
                <div
                  className="subj-ico"
                  style={s.highlight ? { background: '#FFF0F0' } : undefined}
                >
                  {s.icon}
                </div>
                <div className="subj-name">{s.name}</div>
              </div>
              {s.applications.map((app) => (
                <div key={app.title} className="subj-app">
                  <div className="app-ttl">{app.title}</div>
                  <div className="prompt-box">{app.prompt}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'hsk') {
    const { skills } = data;
    const fallback = HABILIDADES_FALLBACK[level];
    const blockBullets = (blockIndex: number): string[] => {
      const block = skills.blocks[blockIndex];
      if (block?.items?.length) {
        return block.items.map((item) => item.name);
      }
      if (!fallback) return [];
      return blockIndex === 0 ? fallback.teacher : fallback.students;
    };

    return (
      <div className="sec-content active">
        <div className={`hsk-intro ${lvClass}`}>
          <div className="hsk-intro-tag">{skills.introTag}</div>
          <p>{skills.intro}</p>
        </div>
        <div
          className="grid gap-3 mb-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {skills.blocks.map((block, blockIndex) => {
            const bullets = blockBullets(blockIndex);
            return (
              <div key={block.label} className="ib-crd" style={{ marginBottom: 0 }}>
                <div className="ib-ttl">{block.label}</div>
                <ul className="ib-list">
                  {bullets.map((text) => (
                    <li key={text}>
                      <span>→</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
