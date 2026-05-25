'use client';

import Link from 'next/link';
import type { Diploma3ProgramRequirements } from '@/lib/diploma3-requirements';

type Props = {
  program: Diploma3ProgramRequirements;
};

export function Diploma3RequirementsBanner({ program }: Props) {
  const items = [
    {
      label: 'Política de ética leída',
      met: program.eticaRead,
      href: '/etica',
    },
    {
      label: 'Reflexión del Nivel 1',
      met: program.reflectionL1,
      href: '/reflexion',
    },
    {
      label: 'Reflexión del Nivel 2',
      met: program.reflectionL2,
      href: '/reflexion',
    },
    {
      label: 'Reflexión del Nivel 3',
      met: program.reflectionL3,
      href: '/reflexion',
    },
    {
      label: 'Evaluación completa',
      met: program.evaluationComplete,
      href: '/evaluacion',
    },
  ];

  return (
    <div className="extras-diploma-banner extras-diploma-banner--oro">
      <p className="extras-diploma-eyebrow">Diploma 3 (Oro)</p>
      <p className="extras-diploma-title">
        Además de horas y Level Up, el Diploma de Oro requiere:
      </p>
      <ul className="extras-diploma-list">
        {items.map((item) => (
          <li
            key={item.label}
            className={
              item.met ? 'extras-diploma-req extras-diploma-req--done' : 'extras-diploma-req'
            }
          >
            {item.met ? (
              item.label
            ) : (
              <Link href={item.href} className="extras-diploma-req-link">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
