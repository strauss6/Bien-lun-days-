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
        {/*
          L'entrée du produit est le questionnaire, pas la démonstration : celle-ci
          tourne sur des données fixes et ne sert qu'à montrer le ruban.
        */}
        <span className="home-actions">
          <Link href="/quiz" className="primary-link technical">Calculer mes jours</Link>
          <Link href="/demo/ruban" className="text-button technical secondary">Voir la démonstration</Link>
        </span>
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
