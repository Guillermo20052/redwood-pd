export default function EticaPage() {
  return (
    <article className="space-y-6">
      <div className="level-hero lh-e">
        <div className="level-hero-tag">Ética · Política institucional</div>
        <h2>IA con responsabilidad en el aula IB</h2>
        <p>
          La IA es una herramienta de apoyo — no un sustituto de tu criterio profesional ni de la
          relación con tus alumnas.
        </p>
      </div>

      <div className="eth-grid">
        <section className="eth-crd">
          <h2 className="eth-ttl">
            <span className="eth-bul" aria-hidden />
            Integridad académica (2025–2026)
          </h2>
          <ul className="eth-list">
            <li>
              <span className="eth-bul" aria-hidden />
              Los materiales generados deben revisarse y adaptarse al contexto IB y al perfil de tus
              alumnas.
            </li>
            <li>
              <span className="eth-bul" aria-hidden />
              Cita la asistencia de IA según la política institucional de Redwood High.
            </li>
          </ul>
        </section>

        <section className="eth-crd warn">
          <h2 className="eth-ttl">Riesgos y mal uso</h2>
          <ul className="eth-list">
            <li>
              <span className="eth-bul" aria-hidden />
              Datos personales de alumnas en prompts sin consentimiento
            </li>
            <li>
              <span className="eth-bul" aria-hidden />
              Evaluaciones finales generadas íntegramente por IA sin revisión
            </li>
            <li>
              <span className="eth-bul" aria-hidden />
              Dependencia de detectores de IA como única medida de integridad
            </li>
            <li>
              <span className="eth-bul" aria-hidden />
              Contenido desactualizado o con sesgos no verificados
            </li>
          </ul>
        </section>

        <section className="eth-crd">
          <h2 className="eth-ttl">Política en el aula</h2>
          <p className="text-sm text-[var(--gray-700)]">
            Define con tus alumnas: para qué se puede usar IA, para qué no, cómo citar asistencia de IA
            y consecuencias. Usa la plantilla del Nivel 1 como punto de partida y actualízala cada ciclo
            escolar.
          </p>
        </section>

        <section className="eth-crd">
          <h2 className="eth-ttl">Detección de IA</h2>
          <p className="text-sm text-[var(--gray-700)]">
            Los detectores tienen falsos positivos y negativos. Combina evaluaciones auténticas, proceso
            visible del trabajo y conversaciones con alumnas en lugar de confiar solo en herramientas
            automáticas.
          </p>
        </section>
      </div>
    </article>
  );
}
