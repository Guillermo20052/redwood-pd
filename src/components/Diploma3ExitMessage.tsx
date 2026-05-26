'use client';

import { Fraunces } from 'next/font/google';
import { useCallback, useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/celebrate';
import { PRAKASH_NAIR_SPACES_PDF_URL } from '@/lib/prakash-nair-resources';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-fraunces',
});

type Props = {
  firstName: string;
  onClose: () => void;
  onViewDiplomaAgain?: () => void;
};

export function Diploma3ExitMessage({ firstName, onClose, onViewDiplomaAgain }: Props) {
  const [closing, setClosing] = useState(false);
  const reducedMotion = prefersReducedMotion();

  const requestClose = useCallback(() => {
    if (closing) return;
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [closing, onClose, reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('diploma-modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('diploma-modal-open');
    };
  }, [requestClose]);

  return (
    <div
      className={`d3-exit-overlay ${fraunces.variable}${closing ? ' d3-exit-overlay--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Mensaje de cierre del programa"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className={`d3-exit-panel${reducedMotion ? ' d3-exit-panel--static' : ''}${closing ? ' d3-exit-panel--closing' : ''}`}
      >
        <p className="d3-exit-eyebrow">CAMINO COMPLETADO · DIPLOMA DE ORO</p>

        <h2 className="d3-exit-title">{firstName}, llegaste al final del camino.</h2>

        <div className="d3-exit-body">
          <p>
            Has completado las 30 horas. Has alcanzado los 3 diplomas. Hoy eres oficialmente una
            Docente IA Transformadora.
          </p>
          <p>
            Este logro representa algo más que un certificado: es la prueba de tu compromiso con
            seguir creciendo como educadora, con explorar nuevas herramientas, y con ponerte al
            servicio de tus alumnas con todo lo que la tecnología puede ofrecer hoy.
          </p>
          <p>
            Pero el verdadero camino apenas comienza. Las herramientas y reflexiones que practicaste
            aquí están listas para vivir en tu aula. En cada clase, cada conversación, cada
            estrategia, puedes seguir aprendiendo y mejorando.
          </p>
          <p>
            Como siguiente paso, te recomendamos profundamente leer el material de Prakash Nair
            sobre diseño de espacios educativos. Las herramientas son poderosas, pero los espacios
            donde las usamos también moldean cómo aprenden las alumnas. Es una lectura que complementa
            perfectamente todo lo que has logrado.
          </p>
        </div>

        <article className="d3-exit-rec-card">
          <p className="d3-exit-rec-label">Recomendado · Lectura Final</p>
          <h3 className="d3-exit-rec-title">Diseño de Espacios Educativos · Prakash Nair</h3>
          <p className="d3-exit-rec-desc">
            Profundiza en cómo los espacios físicos del aula influyen en el aprendizaje. Una lectura
            clave para llevar todo lo aprendido al siguiente nivel.
          </p>
          <a
            href={PRAKASH_NAIR_SPACES_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="d3-exit-rec-cta"
          >
            Ver el PDF →
          </a>
        </article>

        <p className="d3-exit-closing">Gracias por confiar en este camino. Te admiramos profundamente.</p>

        <footer className="d3-exit-footer">
          <button type="button" className="btn-primary d3-exit-close-btn" onClick={requestClose}>
            Cerrar
          </button>
          {onViewDiplomaAgain && (
            <button type="button" className="d3-exit-replay-link" onClick={onViewDiplomaAgain}>
              Ver mi diploma de nuevo
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
