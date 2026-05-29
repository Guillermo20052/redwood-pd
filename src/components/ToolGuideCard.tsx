import type { ToolGuideEntry } from '@/lib/tools-guide';

const LEVEL_STYLES = {
  b: {
    label: 'Nivel 1',
    color: 'var(--navy)',
    bg: 'var(--navy-light)',
  },
  i: {
    label: 'Nivel 2',
    color: 'var(--teal)',
    bg: 'var(--teal-light)',
  },
  a: {
    label: 'Nivel 3',
    color: 'var(--red)',
    bg: 'var(--red-pale)',
  },
} as const;

type Props = {
  tool: ToolGuideEntry;
};

export function ToolGuideCard({ tool }: Props) {
  const levelStyle = LEVEL_STYLES[tool.level];

  return (
    <article className="tool-guide-card card-elevation">
      <header className="tool-guide-card-header">
        <div className="tool-guide-card-title-row">
          <span className="tool-guide-icon" aria-hidden>
            {tool.icon}
          </span>
          <div>
            <h3 className="tool-guide-name">{tool.name}</h3>
            <p className="tool-guide-vendor">{tool.vendor}</p>
          </div>
        </div>
        <span
          className="tool-guide-level-badge"
          style={{ color: levelStyle.color, background: levelStyle.bg }}
        >
          {levelStyle.label}
        </span>
      </header>

      <section className="tool-guide-section">
        <h4 className="tool-guide-section-title tool-guide-section-title--good">
          <span aria-hidden>✓</span> Mejor para:
        </h4>
        <ul className="tool-guide-list">
          {tool.bestFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="tool-guide-section">
        <h4 className="tool-guide-section-title tool-guide-section-title--bad">
          <span aria-hidden>✕</span> NO ideal para:
        </h4>
        <ul className="tool-guide-list tool-guide-list--bad">
          {tool.notIdealFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="tool-guide-file-types">
        <span className="tool-guide-inline-label">Tipos de archivo:</span> {tool.fileTypes}
      </p>

      <blockquote className="tool-guide-example">
        <span className="tool-guide-inline-label">Ejemplo concreto:</span>
        <p>{tool.example}</p>
      </blockquote>

      <p className="tool-guide-alternative">
        <span className="tool-guide-inline-label">Cuándo usar otra:</span> {tool.alternativeWhen}
      </p>
    </article>
  );
}
