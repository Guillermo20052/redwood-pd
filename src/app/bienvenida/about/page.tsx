import { WelcomeScreenShell } from '@/components/WelcomeScreenShell';
import { requireWelcomeStepAccess } from '@/lib/welcome-page';

export default async function AboutWelcomePage() {
  const { reviewMode } = await requireWelcomeStepAccess('about');

  return (
    <WelcomeScreenShell
      confirmEndpoint="/api/welcome/about/confirm"
      buttonLabel="Comenzar Nivel 1 →"
      buttonVariant="red"
      showConfirm={!reviewMode}
      backHref={reviewMode ? '/bienvenida' : undefined}
    >
      <p className="welcome-eyebrow">ANTES DE EMPEZAR</p>
      <h1 className="welcome-title">Cómo funciona tu ruta</h1>

      <div className="welcome-body welcome-body-sections">
        <section>
          <h2>¿Qué es este programa?</h2>
          <p>
            Esta es la Ruta de Desarrollo Profesional en Inteligencia Artificial del Liceo de
            Monterrey Redwood. Está diseñada para ayudarte — como docente IB — a integrar la IA en tu
            práctica con intención, responsabilidad y el rigor que caracteriza a nuestro colegio.
          </p>
        </section>

        <section>
          <h2>La meta del programa</h2>
          <p>
            La meta del programa es alcanzar el Diploma 3 (Oro): Docente IA Transformadora. El
            camino se reconoce en 3 etapas — Bronce, Plata y Oro — pero el viaje completo es la
            transformación.
          </p>
        </section>

        <section>
          <h2>Los 3 niveles</h2>
          <ul>
            <li>
              <strong>Nivel 1 · Fundamentos</strong> (rojo): primeras herramientas (ChatGPT, Claude,
              Perplexity, MagicSchool, Diffit). Aprenderás a usar IA con confianza.
            </li>
            <li>
              <strong>Nivel 2 · Integración</strong> (teal): herramientas más avanzadas (NotebookLM,
              Canva, Gemini, Brisk, Gamma). Integrar IA en tu flujo completo.
            </li>
            <li>
              <strong>Nivel 3 · Transformación</strong> (oro): la etapa final del camino — herramientas
              de liderazgo (Napkin, Copilot, SchoolAI, Khanmigo, ElevenLabs). De usuaria a líder
              pedagógica.
            </li>
          </ul>
        </section>

        <section>
          <h2>¿Cómo es cada nivel?</h2>
          <p>
            Cada nivel tiene 5 partes con: video introductorio, tarea práctica y reflexión guiada. Al
            final de cada nivel, hay una tarea colaborativa con otra compañera del programa.
          </p>
        </section>

        <section>
          <h2>Las Tareas Level Up</h2>
          <p>
            Después de completar cada nivel, desbloquearás 10 Tareas Level Up — variaciones más cortas
            que te ayudan a profundizar. Necesitas 4 por nivel (12 en total) para alcanzar el Diploma 3
            (Oro).
          </p>
        </section>

        <section>
          <h2>Las etapas del camino</h2>
          <ul>
            <li>
              <strong>Diploma 3 (Oro) — la meta:</strong> Docente IA Transformadora · Diploma 2 + 30h +
              4 Level Up del Nivel 3
            </li>
            <li>
              <strong>Diploma 2 (Plata):</strong> Diploma 1 + 24h verificadas en total
            </li>
            <li>
              <strong>Diploma 1 (Bronce):</strong> completar Niveles 1+2 + 4 Level Up de cada uno
            </li>
          </ul>
        </section>

        <section>
          <h2>¿Qué esperamos de ti?</h2>
          <ul>
            <li>
              Honestidad en tus reflexiones — escribe lo que realmente pensaste, no lo que crees que
              queremos leer
            </li>
            <li>Compromiso con tu propia transformación pedagógica</li>
            <li>Curiosidad para experimentar con las herramientas</li>
            <li>Generosidad para compartir con tus compañeras</li>
          </ul>
        </section>

        <section>
          <h2>¿Dónde pides ayuda?</h2>
          <ul>
            <li>
              El bot de ayuda (botón rojo abajo a la derecha) responde dudas sobre la plataforma
            </li>
            <li>La pestaña Comunidad para conectar con otras docentes</li>
            <li>
              Cynthia y la coordinación del Liceo para temas pedagógicos o personales
            </li>
          </ul>
        </section>

        <section>
          <h2>Beneficios para docentes</h2>
          <p>
            Casi todas las herramientas que usaremos tienen versiones gratuitas o con descuento para
            docentes. En la pestaña <strong>Herramientas</strong> de cada nivel verás cómo registrarte
            tú misma con tu email del Liceo o tu cuenta personal — la mayoría puedes activarlas hoy
            mismo, sin esperar autorización.
          </p>
        </section>

        <section>
          <h2>Antes de empezar</h2>
          <p>
            Recuerda que la IA es una herramienta — tú sigues siendo la docente. El programa te dará
            confianza técnica, pero el corazón sigue siendo lo que tú aportas a tus alumnas.
          </p>
        </section>
      </div>

      <aside className="welcome-support-card" aria-label="Soporte directo por WhatsApp">
        <div className="welcome-support-card-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div className="welcome-support-card-content">
          <p className="welcome-support-eyebrow">Soporte directo</p>
          <h2 className="welcome-support-title">Estás conectada con el fundador</h2>
          <p className="welcome-support-body">
            Vas a estar en un grupo de WhatsApp con el fundador de la plataforma. Si tienes dudas
            técnicas, sugerencias, o algo no funciona, escribe ahí y te respondemos rápido. Aquí
            estamos para que esta experiencia sea genuinamente útil para ti.
          </p>
        </div>
      </aside>
    </WelcomeScreenShell>
  );
}
