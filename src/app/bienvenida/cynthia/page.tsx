import { WelcomeScreenShell } from '@/components/WelcomeScreenShell';
import { requireWelcomeStepAccess } from '@/lib/welcome-page';

export default async function CynthiaWelcomePage() {
  const { reviewMode } = await requireWelcomeStepAccess('cynthia');

  return (
    <WelcomeScreenShell
      confirmEndpoint="/api/welcome/cynthia/confirm"
      buttonLabel="Empezar aquí →"
      buttonVariant="red"
      showConfirm={!reviewMode}
      backHref={reviewMode ? '/bienvenida' : undefined}
    >
      <p className="welcome-eyebrow">MENSAJE DE BIENVENIDA</p>
      <h1 className="welcome-title">Queridas maestras de Redwood High</h1>

      <div className="welcome-body">
        <p>
          Con mucha ilusión iniciamos este proceso de capacitación sobre el uso de Inteligencia
          Artificial en el aula. Durante esta semana conoceremos herramientas, estrategias y
          posibilidades que pueden enriquecer nuestro trabajo docente y abrir nuevas oportunidades de
          aprendizaje para nuestras alumnas.
        </p>
        <p>
          Sin embargo, antes de aprender sobre plataformas y aplicaciones, queremos invitarlas a leer
          con atención el documento compartido. Su lectura es fundamental para comprender el espíritu
          con el que deseamos acercarnos a la IA en Redwood.
        </p>
        <blockquote className="pull-quote">
          <p>En nuestro colegio, la tecnología nunca sustituye lo más importante: la persona.</p>
          <span className="pull-quote-attribution">— Cynthia, Directora · Liceo de Monterrey Redwood</span>
        </blockquote>
        <p>
          Nuestro mayor compromiso sigue siendo mirar, escuchar, acompañar y conectar auténticamente con
          cada alumna. La IA puede ser una herramienta poderosa, pero el corazón de la educación
          continúa siendo la relación humana, la presencia, el criterio, la empatía y la formación
          integral.
        </p>
        <p>
          Queremos aprender a usar estas herramientas con responsabilidad, discernimiento y sentido
          humano, recordando siempre que educar no es solo transmitir información, sino formar
          personas.
        </p>
        <p>
          Gracias por abrirse a este proceso con entusiasmo, reflexión y compromiso. Estoy segura de
          que juntas podremos construir una manera de integrar la innovación sin perder aquello que
          hace único a Redwood: poner siempre a la persona en el centro.
        </p>
        <p>Aprovechen mucho y aprendan mucho!</p>
      </div>

      <footer className="welcome-signature">
        <p>Con cariño,</p>
        <p className="welcome-signature-name">Cynthia</p>
        <p className="welcome-signature-role">Directora · Liceo de Monterrey Redwood</p>
      </footer>
    </WelcomeScreenShell>
  );
}
