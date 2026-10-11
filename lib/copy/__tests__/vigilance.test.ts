import { describe, expect, it } from 'vitest';
import { VIGILANCES, houseTopic, vigilanceFor } from '../vigilance';
import { HOUSE_TOPICS } from '@/lib/astro/rulers';
import type { PointId } from '@/lib/astro/types';

const POINTS: PointId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'asc', 'mc', 'dsc', 'ic',
];
const MAISONS = Array.from({ length: 12 }, (_, i) => i + 1);
const tous = () => POINTS.flatMap((p) => MAISONS.map((h) => vigilanceFor(p, h)!));

describe('ce à quoi faire attention', () => {
  it('couvre les douze maisons', () => {
    expect(Object.keys(VIGILANCES).map(Number).sort((a, b) => a - b)).toEqual(MAISONS);
    for (const h of MAISONS) {
      expect(vigilanceFor('sun', h), `maison ${h}`).not.toBeNull();
      expect(houseTopic(h), `maison ${h}`).toBe(HOUSE_TOPICS[h]);
    }
  });

  /*
   * La règle du rédacteur, le 11 octobre 2026, lisant un Saturne opposé à un
   * Jupiter natal en maison 9 : « il faut faire attention à tout ce qui est
   * d'ordre juridique, administratif. Mais si tu fais attention, c'est bien, tu
   * vas pouvoir contrer l'aspect qui montre ces difficultés, sur ce plan. »
   */
  it('rend ses mots pour la maison 9, la seule qui soit de lui', () => {
    expect(VIGILANCES[9].source).toBe('direct');
    expect(vigilanceFor('jupiter', 9)).toContain('juridique et administratif');
    expect(Object.values(VIGILANCES).filter((v) => v.source === 'direct')).toHaveLength(1);
  });

  it('dit toujours que la difficulté se contre', () => {
    for (const t of tous()) {
      expect(t, t).toMatch(/contres?|passe au travers|désamorcer/);
    }
  });

  /* Les règles de contenu du projet s'appliquent ici comme partout. */
  it('n’annonce aucune fatalité et ne conseille jamais de renoncer', () => {
    for (const t of tous()) {
      expect(t, t).not.toMatch(/\b(mauvais|néfaste|funeste|insurmontable|irrémédiable)/i);
      expect(t, t).not.toMatch(/\b(renonce|abandonne|laisse tomber|annule)\b/i);
      expect(t, t).not.toMatch(/les astres|l’univers|énergies négatives/i);
    }
  });

  it('ne donne jamais de conseil médical', () => {
    for (const t of tous()) {
      expect(t, t).not.toMatch(/\b(symptôme|traitement|diagnostic|opération|maladie|médecin|santé)\b/i);
    }
  });

  it('tient dans le budget de densité', () => {
    for (const t of tous()) expect(t.trim().split(/\s+/).length, t).toBeLessThanOrEqual(45);
  });

  it('est déterministe, et varie la formule de clôture', () => {
    expect(tous()).toEqual(tous());
    const clotures = new Set(tous().map((t) => t.split('. ').slice(1).join('. ')));
    expect(clotures.size).toBeGreaterThanOrEqual(3);
  });
});
