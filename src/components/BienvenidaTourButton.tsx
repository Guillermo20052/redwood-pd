'use client';

import Link from 'next/link';

export function BienvenidaTourButton() {
  return (
    <Link href="/dashboard?tour=replay" className="bienvenida-tour-replay no-underline">
      Volver a ver el tour guiado →
    </Link>
  );
}
