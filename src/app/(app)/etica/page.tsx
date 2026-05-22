export default function EticaPage() {
  return (
    <article className="space-y-8">
      <div className="level-hero lh-e">
        <div className="level-hero-tag">Ética · Política institucional</div>
        <h2>Integridad académica e IA en el IB</h2>
        <p>
          Todo docente que complete esta ruta debe comprender y comunicar los límites éticos del uso
          de IA en la educación IB, integrando los valores del Liceo Redwood.
        </p>
      </div>

      <section>
        <div className="sec-hdr">
          <h2 className="sec-title">Marco de integridad académica IB</h2>
        </div>
        <div className="eth-grid">
          <EthCard title="Principios centrales de la política de IA del IB">
            <EthItem>El trabajo generado por IA presentado como propio de la alumna constituye deshonestidad académica.</EthItem>
            <EthItem>Las alumnas deben reconocer toda asistencia de IA en cualquier trabajo IB.</EthItem>
            <EthItem>La IA está permitida como herramienta de aprendizaje cuando el pensamiento es propio de la alumna.</EthItem>
            <EthItem>Las escuelas deben tener una política de uso de IA publicada y accesible.</EthItem>
            <EthItem>IA, Monografía, ensayos TOK y orales deben reflejar la voz auténtica de la alumna.</EthItem>
            <EthItem>Los examinadores del IB están capacitados para identificar trabajo generado por IA.</EthItem>
          </EthCard>
          <EthCard warn title="Qué constituye deshonestidad">
            <EthItem>Usar IA para escribir cualquier sección de una IA, Monografía o ensayo TOK.</EthItem>
            <EthItem>Presentar datos o análisis generados por IA como investigación original.</EthItem>
            <EthItem>Usar IA para parafrasear fuentes sin declaración.</EthItem>
            <EthItem>Hacer que la IA complete tareas de práctica sin declaración en clase.</EthItem>
            <EthItem>Usar IA durante evaluaciones con tiempo restringido en el aula.</EthItem>
            <EthItem>Pedir a la IA argumentos que la alumna luego presenta como propios.</EthItem>
          </EthCard>
          <EthCard title="Uso permitido de IA en el IB">
            <EthItem>Investigar temas y comprender información de fondo.</EthItem>
            <EthItem>Revisar gramática y expresión (con declaración).</EthItem>
            <EthItem>Generar ideas que la alumna desarrolla de forma independiente.</EthItem>
            <EthItem>Usar IA como tutor socrático para conceptos difíciles.</EthItem>
            <EthItem>Generar preguntas de práctica para preparación de exámenes.</EthItem>
            <EthItem>Usar herramientas de IA asignadas explícitamente por la docente.</EthItem>
          </EthCard>
          <EthCard title="Cómo citar la asistencia de IA">
            <EthItem>Declarar: qué herramienta, la fecha y para qué se usó.</EthItem>
            <EthItem>
              Ejemplo: &quot;Claude (Anthropic, mayo 2025) generó ideas iniciales para la Sección 2,
              desarrolladas después de forma independiente.&quot;
            </EthItem>
            <EthItem>El IB recomienda un formato de citación de IA consistente en la escuela.</EthItem>
            <EthItem>Las docentes deben modelar la citación de IA en sus propios materiales.</EthItem>
          </EthCard>
        </div>
      </section>

      <section>
        <div className="sec-hdr">
          <h2 className="sec-title">Riesgos del mal uso de IA</h2>
        </div>
        <div className="eth-grid">
          <EthCard warn title="Limitaciones de la detección de IA">
            <EthItem>Ningún detector es 100% preciso; los falsos positivos pueden acusar injustamente.</EthItem>
            <EthItem>Turnitin señala patrones, no pruebas — debe usarse como señal, no como evidencia única.</EthItem>
            <EthItem>Parafrasear resultados de IA puede no ser detectado.</EthItem>
            <EthItem>Las herramientas van rezagadas respecto a las capacidades de escritura de IA.</EthItem>
            <EthItem>No uses detectores como única base para procedimientos de deshonestidad.</EthItem>
          </EthCard>
          <EthCard warn title="Riesgos cognitivos y de aprendizaje">
            <EthItem>La dependencia excesiva reduce el desarrollo del pensamiento central del IB.</EthItem>
            <EthItem>Externalizar la escritura debilita la comunicación independiente.</EthItem>
            <EthItem>El uso pasivo (copiar-pegar) no produce beneficio de aprendizaje.</EthItem>
            <EthItem>La IA puede reducir la tolerancia a la dificultad que el IB requiere.</EthItem>
            <EthItem>Las alumnas pueden confundir confianza de la IA con precisión factual.</EthItem>
          </EthCard>
          <EthCard title="Alucinaciones y confiabilidad">
            <EthItem>La IA &quot;alucina&quot; — información falsa con confianza, incluso fuentes inventadas.</EthItem>
            <EthItem>Todos los hechos, estadísticas y citas generados deben verificarse.</EthItem>
            <EthItem>Los modelos tienen fecha de corte; eventos recientes pueden ser inexactos.</EthItem>
            <EthItem>Datos desequilibrados pueden producir contenido culturalmente sesgado.</EthItem>
            <EthItem>Modela la evaluación crítica de resultados de IA en clase con regularidad.</EthItem>
          </EthCard>
          <EthCard title="Privacidad y seguridad de datos">
            <EthItem>No ingreses nombres, calificaciones ni datos personales de alumnas en IA públicas.</EthItem>
            <EthItem>Anonimiza trabajo estudiantil antes de pegarlo en IA para análisis.</EthItem>
            <EthItem>Verifica la política de protección de datos de tu colegio.</EthItem>
            <EthItem>SchoolAI y MagicSchool ofrecen protección de datos para menores.</EthItem>
          </EthCard>
        </div>
      </section>

      <section>
        <div className="sec-hdr">
          <h2 className="sec-title">Uso responsable de IA en el aula</h2>
        </div>
        <div className="eth-grid">
          <EthCard title="El aula transparente en IA">
            <EthItem>Publica tu política de uso de IA en el aula y en Classroom.</EthItem>
            <EthItem>Indica explícitamente cuándo pueden usar IA en cada tarea — y cuándo no.</EthItem>
            <EthItem>Modela el uso: muestra cómo haces prompts, evalúas y modificas resultados.</EthItem>
            <EthItem>Crea tareas sin IA que construyan habilidades auténticas para exámenes IB.</EthItem>
            <EthItem>Celebra el pensamiento estudiantil que va más allá de lo que produjo la IA.</EthItem>
            <EthItem>Enseña que la IA es punto de partida, nunca punto final.</EthItem>
          </EthCard>
          <EthCard title="IA y humanismo cristiano">
            <EthItem>La dignidad humana está en el centro: la IA sirve a la persona, no la reemplaza.</EthItem>
            <EthItem>La honestidad e integridad son virtudes fundamentales al citar IA.</EthItem>
            <EthItem>La formación de la voluntad requiere ejercicio de la razón — no sustituir el pensamiento.</EthItem>
            <EthItem>
              Perfil del Alumno IB y valores cristianos convergen: íntegra, mentalidad abierta y reflexiva
              con la IA.
            </EthItem>
          </EthCard>
          <EthCard title="Hablando con alumnas sobre IA">
            <EthItem>&quot;La IA es compañera de pensamiento, no reemplazo del pensamiento.&quot;</EthItem>
            <EthItem>Usa ejemplos reales de errores de IA para alfabetización digital crítica.</EthItem>
            <EthItem>Pregunta: &quot;¿Qué aportaste TÚ a este trabajo?&quot; después de tareas con IA.</EthItem>
            <EthItem>Co-diseña normas de clase sobre IA con tus alumnas.</EthItem>
            <EthItem>Conecta la ética de IA con el Perfil del Alumno IB.</EthItem>
          </EthCard>
        </div>
      </section>

      <section>
        <div className="sec-hdr">
          <h2 className="sec-title">Detección de IA: uso responsable</h2>
        </div>
        <EthCard
          title="Antes de cualquier decisión disciplinaria — recordar"
          style={{ borderTop: '3px solid var(--navy)', gridColumn: '1 / -1' }}
          list={false}
        >
          <ol className="eth-list space-y-3 list-none pl-0">
            <EthStep n={1} title="Revisar el trabajo en contexto">
              ¿Es coherente con la voz habitual de la alumna? ¿El nivel corresponde a su desempeño?
            </EthStep>
            <EthStep n={2} title="Usar la herramienta como apoyo">
              Registra porcentaje y secciones marcadas, sin tratarlo como evidencia definitiva.
            </EthStep>
            <EthStep n={3} title="Contrastar con evidencia del proceso">
              Borradores, participación en clase, notas del proceso, conversaciones.
            </EthStep>
            <EthStep n={4} title="Conversar con la alumna">
              Desde la curiosidad: &quot;Cuéntame cómo desarrollaste esta sección.&quot;
            </EthStep>
            <EthStep n={5} title="Decisión pedagógica">
              Busca aprendizaje, no solo sanción. ¿Qué necesita entender sobre integridad?
            </EthStep>
          </ol>
          <p className="text-sm text-[var(--navy)] mt-4 leading-relaxed border-l-[3px] border-[var(--navy)] pl-3">
            <strong>Recuerda:</strong> El objetivo no es atrapar a las alumnas — es construir una
            cultura de integridad. Los detectores son apoyo, nunca el juez.
          </p>
        </EthCard>
        <div className="eth-grid mt-4">
          <EthCard title="¿Qué son los detectores?" list={false}>
            <p className="text-sm text-[var(--gray-700)] mb-3 leading-relaxed">
              Analizan texto e estiman probabilidad de autoría IA. <strong>No son un veredicto.</strong>
            </p>
            <EthItem>No son 100% confiables: texto humano puede marcar positivo.</EthItem>
            <EthItem>Falsos positivos en escritura clara y estructurada.</EthItem>
            <EthItem>El IB no acepta un reporte de detector como prueba suficiente.</EthItem>
          </EthCard>
          <EthCard title="GPTZero">
            <EthItem>
              <strong>Qué hace:</strong> probabilidad de autoría IA frase por frase.
            </EthItem>
            <EthItem>
              <strong>Cuándo:</strong> trabajos escritos extensos (ensayos, monografías en proceso).
            </EthItem>
            <EthItem>
              <strong>Límite:</strong> sensible al estilo; puede señalar textos técnicos IB.
            </EthItem>
          </EthCard>
          <EthCard title="Turnitin (IA Detection)">
            <EthItem>
              <strong>Qué hace:</strong> patrones de escritura asociados a IA generativa.
            </EthItem>
            <EthItem>
              <strong>Cuándo:</strong> entregas finales con proceso documentado.
            </EthItem>
            <EthItem>
              <strong>Límite:</strong> el IB advierte que no debe ser único criterio.
            </EthItem>
          </EthCard>
          <EthCard title="Originality.ai">
            <EthItem>
              <strong>Qué hace:</strong> detección y plagio combinados.
            </EthItem>
            <EthItem>
              <strong>Cuándo:</strong> borradores antes de entrega formal.
            </EthItem>
            <EthItem>
              <strong>Límite:</strong> revisar manualmente secciones marcadas.
            </EthItem>
          </EthCard>
        </div>
      </section>

      <section className="eth-crd">
        <h2 className="eth-ttl">Política en el aula (Redwood)</h2>
        <p className="text-sm text-[var(--gray-700)] leading-relaxed">
          Define con tus alumnas de prepa IB: para qué se puede usar IA, para qué no, cómo citar
          asistencia y consecuencias. Usa la plantilla del Nivel 1 como punto de partida y
          actualízala cada ciclo escolar.
        </p>
      </section>
    </article>
  );
}

function EthCard({
  title,
  children,
  warn,
  style,
  list = true,
}: {
  title: string;
  children: React.ReactNode;
  warn?: boolean;
  style?: React.CSSProperties;
  list?: boolean;
}) {
  return (
    <section className={`eth-crd ${warn ? 'warn' : ''}`} style={style}>
      <h2 className="eth-ttl">{title}</h2>
      {list ? <ul className="eth-list">{children}</ul> : children}
    </section>
  );
}

function EthItem({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <span className="eth-bul" aria-hidden />
      {children}
    </li>
  );
}

function EthStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 items-start">
      <span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
        style={{ background: 'var(--navy)' }}
      >
        {n}
      </span>
      <div>
        <div className="text-xs font-bold text-[var(--gray-900)]">{title}</div>
        <div className="text-xs text-[var(--gray-700)] leading-snug">{children}</div>
      </div>
    </li>
  );
}
