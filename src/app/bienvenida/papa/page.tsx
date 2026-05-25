import { WelcomeScreenShell } from '@/components/WelcomeScreenShell';
import { requireWelcomeStepAccess } from '@/lib/welcome-page';

export default async function PapaWelcomePage() {
  const { reviewMode } = await requireWelcomeStepAccess('papa');

  return (
    <WelcomeScreenShell
      confirmEndpoint="/api/welcome/pope/confirm"
      buttonLabel="Marcar como leído"
      buttonVariant="gold"
      showConfirm={!reviewMode}
      backHref={reviewMode ? '/bienvenida' : undefined}
    >
      <div className="welcome-pope-ornament" aria-hidden>
        ✝
      </div>
      <p className="welcome-eyebrow welcome-eyebrow-gold">MENSAJE DEL SANTO PADRE LEÓN XIV</p>
      <h1 className="welcome-title">Custodiar voces y rostros humanos</h1>
      <p className="welcome-context">Para la LX Jornada Mundial de las Comunicaciones Sociales</p>

      <div className="welcome-body">
        <p>
          El rostro y la voz no son simples datos biológicos: son dones que revelan la identidad de
          cada persona. Cuando miramos a alguien a los ojos, cuando escuchamos su voz, reconocemos una
          presencia irreductible. Custodiar voces y rostros humanos significa, entonces, cuidar lo
          que nos hace humanos — aquello que ninguna máquina puede reemplazar sin empobrecer la
          experiencia educativa y comunitaria.
        </p>
        <p>
          En un tiempo marcado por la Inteligencia Artificial, el desafío ya no es solo tecnológico,
          sino profundamente antropológico. Se trata de preservar el pensamiento, la creatividad y las
          relaciones auténticas frente a sistemas que pueden generar respuestas convincentes sin
          haber vivido, sentido o elegido. El riesgo no es solo el error factual, sino la comodidad de
          las burbujas de fácil consenso: delegar la reflexión a algoritmos y perder la capacidad de
          formar criterio propio.
        </p>
        <p>
          Por eso el Papa León XIV llama a tres pilares: responsabilidad, cooperación y educación. Las
          docentes tienen un papel insustituible en la alfabetización digital crítica — enseñar no solo
          a usar herramientas, sino a preguntarse qué tipo de comunicación dignifica a la persona y qué
          tipo la reduce a un perfil o a un output automatizado.
        </p>
        <blockquote className="pull-quote">
          <p>
            Necesitamos que el rostro y la voz vuelvan a expresar a la persona, especialmente cuando
            es más vulnerable, más herida, más invisible.
          </p>
          <span className="pull-quote-attribution">
            — León XIV PP., Vaticano · 24 de enero de 2026
          </span>
        </blockquote>
      </div>

      <div className="welcome-pdf-top">
        <a
          href="/welcome/mensaje-papa-leon-xiv.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="welcome-pdf-download-btn no-underline"
        >
          <svg
            className="welcome-pdf-download-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar (PDF)
        </a>
      </div>
    </WelcomeScreenShell>
  );
}
