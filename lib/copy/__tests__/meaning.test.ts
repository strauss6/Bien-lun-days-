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
    /*
     * « C'est l'exact inverse de Saturne » éclaire dans la brique d'Uranus lue en
     * entier ; dans une carte sur Uranus et ton Jupiter, ça fait entrer un
     * troisième nom pour rien. Seuls le transit et le point natal sont admis.
     */
    const NOMS: Record<string, string> = {
      sun: 'Soleil', moon: 'Lune', mercury: 'Mercure', venus: 'Vénus', mars: 'Mars',
      jupiter: 'Jupiter', saturn: 'Saturne', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluton',
    };
    for (const t of TRANSITS) {
      for (const a of ASPECTS) {
        for (const n of NATALS) {
          const texte = rareMeaning(t, a, n);
          for (const [cle, nom] of Object.entries(NOMS)) {
            if (cle === t || cle === n) continue;
            expect(texte.includes(nom), `${nom} dans « ${texte} »`).toBe(false);
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
