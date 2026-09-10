import type { Metadata, Viewport } from 'next';
import { EB_Garamond, Geist_Mono } from 'next/font/google';
import './globals.css';

/**
 * Deux familles, deux registres étanches.
 *
 * Geist Mono porte tout ce qui relève du calcul — chiffres, degrés, dates, noms
 * d'aspects. EB Garamond, caractère du XVIᵉ siècle, porte l'interprétation. Un
 * bloc ne mélange jamais les deux : ils se font face.
 */
const technical = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const reading = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bien.Luné — tes 30 prochains jours ne se valent pas',
  description:
    "Calculé sur l'heure et la ville exactes de ta naissance. Pas sur ton signe.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#eff0ee',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${technical.variable} ${reading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
