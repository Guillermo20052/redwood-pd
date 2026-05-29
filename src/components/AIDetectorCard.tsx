import type { AIDetectorEntry, PricingTier } from '@/lib/ai-detectors';

const PRICING_STYLES: Record<
  PricingTier,
  { label: string; color: string; bg: string }
> = {
  free: {
    label: 'Gratis',
    color: 'var(--green)',
    bg: 'var(--green-light)',
  },
  freemium: {
    label: 'Freemium',
    color: 'var(--navy)',
    bg: 'var(--navy-light)',
  },
  paid: {
    label: 'De pago',
    color: 'var(--gold)',
    bg: 'var(--gold-light)',
  },
};

type Props = {
  detector: AIDetectorEntry;
};

export function AIDetectorCard({ detector }: Props) {
  const pricingStyle = PRICING_STYLES[detector.pricingTier];

  return (
    <article className="detector-card card-elevation">
      <header className="detector-card-header">
        <div>
          <h3 className="detector-card-name">{detector.name}</h3>
          <p className="detector-card-vendor">{detector.vendor}</p>
        </div>
        <span
          className="detector-pricing-badge"
          style={{ color: pricingStyle.color, background: pricingStyle.bg }}
          title={detector.pricing}
        >
          {pricingStyle.label}
        </span>
      </header>

      <p className="detector-pricing-detail">{detector.pricing}</p>

      <section className="detector-section">
        <h4 className="detector-section-title">Cómo funciona</h4>
        <p className="detector-how-it-works">{detector.howItWorks}</p>
      </section>

      <section className="detector-section">
        <h4 className="detector-section-title detector-section-title--good">
          <span aria-hidden>✓</span> Mejor para
        </h4>
        <ul className="detector-list">
          {detector.bestFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="detector-section">
        <h4 className="detector-section-title detector-section-title--warn">
          <span aria-hidden>⚠</span> Limitaciones
        </h4>
        <ul className="detector-list detector-list--warn">
          {detector.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <blockquote className="detector-accuracy">
        <span className="detector-inline-label">Precisión real</span>
        <p>{detector.accuracy}</p>
      </blockquote>

      <a
        href={detector.url}
        target="_blank"
        rel="noopener noreferrer"
        className="detector-link-btn no-underline"
      >
        Visitar {detector.name.split(' ')[0]} →
      </a>
    </article>
  );
}
