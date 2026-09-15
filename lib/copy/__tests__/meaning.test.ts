import { describe, expect, it } from 'vitest';
import { rareMeaning } from '../meaning';
import { ASPECT_BLOCKS, NATAL_BLOCKS, TRANSIT_BLOCKS } from '../blocks';
import type { AspectId, PlanetId, PointId } from '@/lib/astro/types';

const TRANSITS = TRANSIT_BLOCKS.map((b) => b.key as PlanetId);
const ASPECTS = ASPECT_BLOCKS.map((b) => b.key as AspectId);
const NATALS = NATAL_BLOCKS.map((b) => b.key as PointId);

const tous = (): string[] => {
  const out: string[] = [];
  for (const t of TRANSITS) for (const a of ASPECTS) for (const n of NATALS) out.push(rareMeaning(t, a, n));
  return out;
};

describe('le sens composé depuis les briques', () => {
  it('ne rend jamais vide sur un trio connu', () => {
    for (const texte of tous()) expect(texte.length).toBeGreaterThan(30);
  });

  it('est déterministe : la même configuration donne toujours le même texte', () => {
    expect(tous()).toEqual(tous());
  });

  /*
   * Les défauts relevés le 15 septembre sur l'écran des jours rares. Chacun
   * venait d'une phrase de brique arrachée à son contexte ; chacun est ici.
   */
  it('ouvre toujours sur la planète en transit, jamais sur un bout de phrase', () => {
    /*
     * « Saturne : il montre où est la résistance, à toi de la lever » : la
     * proposition principale manquait. La même phrase est juste en fin de carte,
     * où elle qualifie l'angle — d'où le contrôle sur la première phrase seule.
     */
    for (const t of TRANSITS) {
      for (const a of ASPECTS) {
        for (const n of NATALS) {
          const tete = rareMeaning(t, a, n).split('. ')[0];
          expect(tete, tete).not.toMatch(/^(Saturne|Jupiter|[A-ZÀ-Ý]\w+)\s*:\s*(il|elle|à toi|et|ce qu)/i);
          expect(tete, tete).not.toMatch(/\b(aussi|également|non plus)\s*$/i);
        }
      }
    }
    // Une glose ne commence jamais par une liaison.
    for (const texte of tous()) expect(texte, texte).not.toMatch(/:\s(et|mais|donc|aussi)\b/i);
  });

  it('pose un seul deux-points, celui du gabarit', () => {
    for (const texte of tous()) expect(texte.split(':').length - 1, texte).toBeLessThanOrEqual(1);
  });

  it('ne conditionne jamais à une polarité que l’angle contredirait', () => {
    for (const texte of tous()) {
      expect(texte, texte).not.toMatch(/\b(bon aspect|aspect difficile|bien aspect|mal aspect)/i);
    }
  });

  it('ne fait entrer aucune planète étrangère au transit', () => {
    for (const t of TRANSITS) {
      for (const a of ASPECTS) {
        for (const n of NATALS) {
          const texte = rareMeaning(t, a, n);
          // Le point natal est nommé par le gabarit ; le reste doit être le transit seul.
          const noms = ['Soleil', 'Lune', 'Mercure', 'Vénus', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'];
          const attendus = new Set([t, n].map((k) => k));
          for (const nom of noms) {
            if (!texte.includes(nom)) continue;
            const estTransitOuNatal = [...attendus].some((k) => rareMeaning(t, a, n).includes(nom) && (
              nom === texte.slice(0, nom.length) || texte.includes(`ton ${nom}`) || texte.includes(`ta ${nom}`)
            ));
            expect(estTransitOuNatal, `${nom} dans « ${texte} »`).toBe(true);
          }
        }
      }
    }
  });

  it('varie d’un point natal à l’autre sous la même planète', () => {
    // Le reproche du 15 septembre : six cartes qui ouvrent toutes pareil.
    const cartes = NATALS.map((n) => rareMeaning('saturn', 'square', n));
    expect(new Set(cartes).size).toBeGreaterThan(NATALS.length / 2);
  });

  it('n’annonce aucune fatalité et n’emploie jamais « mauvais »', () => {
    for (const texte of tous()) {
      expect(texte, texte).not.toMatch(/\b(mauvais|néfaste|funeste|insurmontable|irrémédiable)/i);
    }
  });
});
