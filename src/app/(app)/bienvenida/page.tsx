import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUserId, loadProfile } from '@/lib/completions-service';
import {
  formatWelcomeDate,
  getNextWelcomePath,
  isWelcomeComplete,
} from '@/lib/welcome-gate';

export default async function BienvenidaOverviewPage() {
  const session = await getSessionUserId();
  if (!session) redirect('/login');

  const profile = await loadProfile(session.userId);
  if (!isWelcomeComplete(profile)) {
    redirect(getNextWelcomePath(profile));
  }

  const cards = [
    {
      href: '/bienvenida/cynthia',
      title: 'Mensaje de Cynthia',
      description: 'Palabras de bienvenida de la directora',
      readAt: profile?.welcome_cynthia_read_at ?? null,
    },
    {
      href: '/bienvenida/papa',
      title: 'Mensaje del Papa León XIV',
      description: 'Custodiar voces y rostros humanos',
      readAt: profile?.welcome_pope_read_at ?? null,
    },
    {
      href: '/bienvenida/about',
      title: 'Cómo funciona el programa',
      description: 'Niveles, diplomas y qué esperamos de ti',
      readAt: profile?.welcome_about_read_at ?? null,
    },
  ];

  return (
    <div className="app-page">
      <div className="level-hero lh-b">
        <div className="level-hero-tag">Bienvenida</div>
        <h2>Mensajes de bienvenida</h2>
        <p>
          Puedes volver a leer los mensajes iniciales del programa cuando quieras. Cada uno quedó
          registrado con la fecha en que lo confirmaste.
        </p>
      </div>

      <div className="welcome-overview-grid">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="welcome-overview-card no-underline">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            {card.readAt ? (
              <span className="welcome-overview-date">
                Leído · {formatWelcomeDate(card.readAt)}
              </span>
            ) : (
              <span className="welcome-overview-date welcome-overview-date--pending">Pendiente</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
