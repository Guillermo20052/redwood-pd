'use client';

import { getToolsByLevel, type SectionTool } from '@/lib/content';
import { HABILIDADES_FALLBACK } from '@/lib/habilidades-fallback';
import {
  getLevelAncillary,
  getSubjectsPill,
} from '@/lib/level-ancillary';
import { getAplicacionesIb } from '@/lib/aplicaciones-ib';
import { SessionsSection } from './SessionsSection';
import { PrakashNairSection } from './PrakashNairSection';
import { ToolCardWithPerk } from './ToolCardWithPerk';

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
    const TOOL_GROUPS: { levels: ('b' | 'i' | 'a')[]; label: string; accent: string; headingSize: 'sm' | 'lg' }[] =
      level === 'b'
        ? [{ levels: ['b'], label: 'Nivel 1 · Fundamentos', accent: 'var(--navy)', headingSize: 'lg' }]
        : level === 'i'
          ? [
              { levels: ['b'], label: 'Nivel 1 · Fundamentos', accent: 'var(--navy)', headingSize: 'sm' },
              { levels: ['i'], label: 'Nivel 2 · Integración', accent: 'var(--teal)', headingSize: 'lg' },
            ]
          : [
              { levels: ['b'], label: 'Nivel 1 · Fundamentos', accent: 'var(--navy)', headingSize: 'sm' },
              { levels: ['i'], label: 'Nivel 2 · Integración', accent: 'var(--teal)', headingSize: 'sm' },
              { levels: ['a'], label: 'Nivel 3 · Transformación', accent: 'var(--red)', headingSize: 'lg' },
            ];

    const renderToolGroup = (tools: SectionTool[]) => (
      <div className="tools-grid">
        {tools.map((t) => (
          <ToolCardWithPerk key={t.name} tool={t} />
        ))}
      </div>
    );

    return (
      <div className="sec-content active">
        <div className="sec-hdr">
          <h2 className="sec-title">Herramientas IA</h2>
          <span className="sec-pill">2025–2026</span>
        </div>
        <p className="mb-5 text-sm text-[var(--gray-600)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
          Tu caja de herramientas crece con cada nivel — aquí ves todo lo que has incorporado hasta ahora.
        </p>
        {TOOL_GROUPS.map((group, idx) => {
          const tools = group.levels.flatMap((lv) => getToolsByLevel(lv));
          if (!tools.length) return null;
          return (
            <section key={group.label} className={idx > 0 ? 'mt-8 pt-6 border-t border-[var(--gray-200)]' : ''}>
              <h3
                className="font-condensed font-extrabold mb-3"
                style={{
                  color: group.accent,
                  fontSize: group.headingSize === 'lg' ? 20 : 14,
                  letterSpacing: group.headingSize === 'lg' ? '-0.02em' : '0.04em',
                  textTransform: group.headingSize === 'sm' ? 'uppercase' : undefined,
                }}
              >
                {group.label}
              </h3>
              {renderToolGroup(tools)}
            </section>
          );
        })}
      </div>
    );
  }

  if (section === 'mod') {
    return <PrakashNairSection />;
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
          Ejemplos concretos por materia del Bachillerato Internacional con la herramienta más
          útil de este nivel.
        </p>
        <div className="subj-grid subj-grid--wide">
          {subjects.map((s) => (
            <div key={s.name} className="subj-crd subj-crd--compact">
              <div className="subj-hdr">
                <div className="subj-ico">{s.icon}</div>
                <div className="subj-name">{s.name}</div>
              </div>
              <p className="subj-example">{s.example}</p>
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
