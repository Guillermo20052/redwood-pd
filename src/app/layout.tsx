import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import './legacy.css';
import { Providers } from '@/components/Providers';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-barlow',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-barlow-condensed',
});

export const metadata: Metadata = {
  title: 'LICEO DE MONTERREY REDWOOD - RUTA DE DESARROLLO PROFESIONAL',
  description:
    'Ruta de Desarrollo Profesional del Liceo de Monterrey Redwood — formación en IA para docentes IB.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className={barlow.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
