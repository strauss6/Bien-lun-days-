import Link from 'next/link';
import { ZodiacGlyph } from '@/components/glyphs/ZodiacGlyph';
import { ZODIAC_LABELS, ZODIAC_ORDER } from '@/lib/design/zodiac-paths';

export default function Home() {
  return (
    <main className="app-shell home-shell">
      <header className="app-header">
        <span className="wordmark">Bien.Luné</span>
        <span className="technical secondary">En développement</span>
      </header>
      <section className="home-intro">
        <h1 className="technical home-title">Tes 30 prochains jours ne se valent pas.</h1>
        <p className="reading home-description">Calculé sur l&apos;heure et la ville exactes de ta naissance. Pas sur ton signe.</p>
        <Link href="/demo/ruban" className="primary-link technical">Explorer la démonstration</Link>
      </section>
      <ul className="zodiac-index" aria-label="Les douze repères du zodiaque">
        {ZODIAC_ORDER.map((sign) => (
          <li key={sign}>
            <ZodiacGlyph sign={sign} size={28} tone="season" />
            <span className="technical">{ZODIAC_LABELS[sign]}</span>
          </li>
        ))}
      </ul>
      <footer className="app-footer technical">Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion personnelle.</footer>
    </main>
  );
}
