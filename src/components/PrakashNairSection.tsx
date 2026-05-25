'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

const FLOOR_PLAN_SRC = '/prakash-nair/layout-prep-redwood-2026.jpg';

type ResourceLink = {
  kind: 'link';
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: string;
  accent: string;
  badge?: string;
};

type ResourceInfo = {
  kind: 'info';
  title: string;
  description: string;
  icon: string;
};

const RESOURCES: (ResourceLink | ResourceInfo)[] = [
  {
    kind: 'link',
    title: 'Sitio oficial de Prakash Nair',
    description:
      'Conoce el trabajo y la filosofía de Prakash Nair, líder mundial en diseño de espacios educativos transformadores.',
    href: 'https://prakashnair.com/',
    cta: 'Visitar sitio →',
    icon: '🌐',
    accent: 'var(--teal)',
  },
  {
    kind: 'link',
    title: 'Diseño de Espacios Educativos · PDF',
    description:
      'Documento completo de Prakash Nair sobre los principios de diseño de espacios educativos que inspiran esta renovación en Redwood. Lectura recomendada para el verano.',
    href: 'https://aprenderapensar.net/wp-content/uploads/2016/11/Dise%C3%B1odeespacioseducativos.pdf',
    cta: 'Descargar PDF →',
    icon: '📄',
    accent: 'var(--gold)',
    badge: 'PDF',
  },
  {
    kind: 'info',
    title: 'Blueprint for Tomorrow',
    description:
      'Libro de Prakash Nair sobre el diseño de espacios educativos del futuro. Enlace próximamente.',
    icon: '📘',
  },
];

export function PrakashNairSection() {
  const [planOpen, setPlanOpen] = useState(false);

  const closePlan = useCallback(() => setPlanOpen(false), []);

  useEffect(() => {
    if (!planOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePlan();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [planOpen, closePlan]);

  return (
    <div className="sec-content active prakash-nair-section">
      <div className="sec-hdr">
        <h2 className="sec-title">Prakash Nair · Diseño de espacios educativos</h2>
        <span className="sec-pill">Prepa · Liceo Redwood</span>
      </div>

      <section className="prakash-block">
        <p className="prakash-intro">
          Les compartimos el layout de la prepa para que puedan empezar a visualizar los espacios y
          diseñar sus actividades, clases, reflexiones y programación teniendo el entorno en mente.
        </p>
        <p className="prakash-intro">
          Esta renovación busca mucho más que transformar la infraestructura; busca transformar la
          experiencia de aprendizaje.
        </p>
        <blockquote className="pull-quote">
          <p>
            El espacio educativo funciona como un &ldquo;tercer educador&rdquo;: un aliado pedagógico
            que influye en la manera en que los alumnos colaboran, piensan, crean, dialogan y
            aprenden.
          </p>
          <span className="pull-quote-attribution">— Prakash Nair, arquitecto educativo</span>
        </blockquote>
        <p className="prakash-intro">
          Cada espacio fue pensado para favorecer distintas dinámicas de enseñanza y aprendizaje,
          promoviendo mayor flexibilidad, interacción, autonomía y sentido de comunidad. La invitación
          es comenzar a imaginar cómo estos ambientes pueden potenciar lo que ya hacen tan bien en el
          aula.
        </p>
        <p className="prakash-intro">
          Esperamos que este layout les ayude a inspirarse y a comenzar a construir experiencias de
          aprendizaje donde el espacio también enseñe.
        </p>
      </section>

      <section className="prakash-block">
        <h3 className="prakash-section-title">Layout de la prepa · Liceo Redwood</h3>
        <button
          type="button"
          className="prakash-floorplan-btn"
          onClick={() => setPlanOpen(true)}
          aria-label="Ampliar plano de la prepa"
        >
          <Image
            src={FLOOR_PLAN_SRC}
            alt="Plano del nuevo diseño de la prepa — espacios para colaboración y aprendizaje activo"
            width={1024}
            height={608}
            className="prakash-floorplan-img"
            sizes="(max-width: 768px) 100vw, 720px"
            unoptimized
          />
        </button>
        <p className="prakash-floorplan-caption">
          Plano del nuevo diseño de la prepa — espacios pensados para colaboración, flexibilidad y
          aprendizaje activo.{' '}
          <span className="prakash-floorplan-hint">Haz clic para ampliar.</span>
        </p>
      </section>

      <section className="prakash-block">
        <h3 className="prakash-section-title">Recursos · Lectura opcional para el verano</h3>
        <p className="prakash-resources-sub">
          Si quieres profundizar en la filosofía de diseño que está detrás de esta renovación, te
          recomendamos estos recursos.
        </p>
        <div className="prakash-resources-grid">
          {RESOURCES.map((resource) =>
            resource.kind === 'link' ? (
              <a
                key={resource.href}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="prakash-resource-card no-underline"
                style={{ '--prakash-accent': resource.accent } as React.CSSProperties}
              >
                <span className="prakash-resource-icon" aria-hidden>
                  {resource.icon}
                </span>
                <span className="prakash-resource-body">
                  <span className="prakash-resource-title-row">
                    <span className="prakash-resource-title">{resource.title}</span>
                    {resource.badge && (
                      <span className="prakash-resource-badge">{resource.badge}</span>
                    )}
                  </span>
                  <span className="prakash-resource-desc">{resource.description}</span>
                  <span className="prakash-resource-cta">{resource.cta}</span>
                </span>
                <span className="prakash-resource-arrow" aria-hidden>
                  ↗
                </span>
              </a>
            ) : (
              <div key={resource.title} className="prakash-resource-card prakash-resource-card--info">
                <span className="prakash-resource-icon" aria-hidden>
                  {resource.icon}
                </span>
                <span className="prakash-resource-body">
                  <span className="prakash-resource-title-row">
                    <span className="prakash-resource-title">{resource.title}</span>
                  </span>
                  <span className="prakash-resource-desc">{resource.description}</span>
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <p className="prakash-closing">
        El espacio enseña tanto como nosotras. Si lo diseñamos con intención, se vuelve nuestro aliado
        en cada clase.
      </p>

      {planOpen && (
        <div
          className="prakash-floorplan-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Plano ampliado de la prepa"
          onClick={closePlan}
        >
          <div className="prakash-floorplan-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="prakash-floorplan-close"
              onClick={closePlan}
              aria-label="Cerrar"
            >
              ×
            </button>
            <a
              href={FLOOR_PLAN_SRC}
              target="_blank"
              rel="noopener noreferrer"
              className="prakash-floorplan-open-tab"
            >
              Abrir en pestaña nueva ↗
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FLOOR_PLAN_SRC}
              alt="Plano del nuevo diseño de la prepa — vista ampliada"
              className="prakash-floorplan-modal-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}
