import { Fraunces } from 'next/font/google';
import { AIDetectorCard } from '@/components/AIDetectorCard';
import { AI_DETECTORS, DETECTOR_WARNING } from '@/lib/ai-detectors';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  variable: '--font-fraunces',
});

export default function DetectoresIAPage() {
  return (
    <div className={`app-page detector-page ${fraunces.variable}`}>
      <header className="level-hero lh-a detector-hero">
        <div className="level-hero-tag">Referencia · Integridad académica</div>
        <h2>Detectores de IA</h2>
        <p>
          Las 5 mejores herramientas, sus límites, y por qué la conversación sigue
          siendo más confiable.
        </p>
      </header>

      <aside className="detector-warning-panel" aria-labelledby="detector-warning-title">
        <div className="detector-warning-panel-inner">
          <h2 id="detector-warning-title" className="detector-warning-title">
            {DETECTOR_WARNING.title}
          </h2>
          <p className="detector-warning-intro">{DETECTOR_WARNING.intro}</p>

          <div className="detector-warning-columns">
            <section className="detector-warning-block">
              <h3 className="detector-warning-subtitle">Limitaciones documentadas</h3>
              <ul className="detector-warning-list">
                {DETECTOR_WARNING.documentedLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="detector-warning-block">
              <h3 className="detector-warning-subtitle">Qué hacer en vez</h3>
              <ol className="detector-instead-list">
                {DETECTOR_WARNING.insteadFramework.map((step, index) => (
                  <li key={step.title}>
                    <strong>{index + 1}. {step.title}</strong> {step.body}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </aside>

      <p className="detector-results-count">{AI_DETECTORS.length} detectores</p>

      <div className="detector-grid">
        {AI_DETECTORS.map((detector) => (
          <AIDetectorCard key={detector.name} detector={detector} />
        ))}
      </div>
    </div>
  );
}
