import { ZodiacGlyph } from '@/components/glyphs/ZodiacGlyph';
import { ZODIAC_LABELS, ZODIAC_ORDER } from '@/lib/design/zodiac-paths';

/**
 * Page d'attente le temps que le tunnel soit construit. Elle sert de cible au
 * test de fumée et vérifie que les deux registres typographiques et les glyphes
 * se chargent réellement en production.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="technical text-[11px] uppercase text-ink/55">Bien.Luné</p>

      <h1 className="reading mt-6 text-[clamp(2.375rem,8.4vw,5.125rem)] leading-[1.02] font-medium">
        Tes 30 prochains jours ne se valent pas.
      </h1>

      <p className="reading mt-6 text-ink/80">
        Calculé sur l&apos;heure et la ville exactes de ta naissance. Pas sur ton signe.
      </p>

      <ul className="mt-14 grid grid-cols-6 gap-4" aria-label="Les douze repères du zodiaque">
        {ZODIAC_ORDER.map((sign) => (
          <li key={sign} className="flex flex-col items-center gap-2">
            <ZodiacGlyph sign={sign} size={32} tone="season" />
            <span className="technical text-[9px] text-ink/50">{ZODIAC_LABELS[sign]}</span>
          </li>
        ))}
      </ul>

      <footer className="reading mt-20 text-sm text-ink/55">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de
        réflexion personnelle.
      </footer>
    </main>
  );
}
