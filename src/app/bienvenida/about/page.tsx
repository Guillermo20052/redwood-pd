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
              <strong>Nivel 3 · Transformación</strong> (oro): herramientas de liderazgo (Napkin,
              Copilot, SchoolAI, Khanmigo, ElevenLabs). De usuaria a líder pedagógica.
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
            que te ayudan a profundizar. Necesitas terminar 4 de cada nivel para tu Diploma.
          </p>
        </section>

        <section>
          <h2>Los Diplomas</h2>
          <ul>
            <li>
              <strong>Diploma 1 (Bronce):</strong> completar Niveles 1+2 + 4 Level Up de cada uno
            </li>
            <li>
              <strong>Diploma 2 (Plata):</strong> Diploma 1 + 24h verificadas en total
            </li>
            <li>
              <strong>Diploma 3 (Oro):</strong> Diploma 2 + 30h + 4 Level Up del Nivel 3
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
            docentes. Revisa cada herramienta en la pestaña <strong>Herramientas</strong> de tu nivel
            para ver cómo obtener acceso — no pagues por funciones premium si existe una versión
            educativa.
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
    </WelcomeScreenShell>
  );
}
