import { describe, expect, it } from 'vitest';
import { MAX_DAYS, decodeRibbon, encodeRibbon, type RibbonShareDay } from '../share-code';
import { AXIS_IDS } from '../../astro/transits';
import type { Season } from '../../astro/types';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

const sample = (n: number): RibbonShareDay[] => Array.from({ length: n }, (_, i) => ({
  season: SEASONS[i % 4],
  scores: Object.fromEntries(AXIS_IDS.map((a, k) => [a, (i * 7 + k * 31) % 98])) as RibbonShareDay['scores'],
}));

describe('code de partage', () => {
  it('fait l’aller-retour sans perte', () => {
    for (const n of [1, 3, 4, 5, 30, 90]) {
      expect(decodeRibbon(encodeRibbon(sample(n)))).toEqual(sample(n));
    }
  });

  it('tient dans une adresse : trente jours en moins de 140 caractères', () => {
    const code = encodeRibbon(sample(30));
    expect(code.length).toBeLessThanOrEqual(140);
    // base64url : rien qui doive être échappé dans une adresse.
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  /*
   * L'exigence de fond, et la raison d'être du module : une image partagée
   * circule, et son adresse ne doit porter que ce qui se voit. Le test le
   * vérifie sur le seul terrain observable — la taille. Trente jours de ruban
   * tiennent en 99 octets ; y glisser une date, une heure et des coordonnées
   * ferait déborder ce compte.
   */
  it('ne porte que le dessin : 99 octets pour trente jours', () => {
    // 1 octet de longueur + 3 × 30 scores + 8 octets de saisons à deux bits.
    // Quatre caractères de base64 pour trois octets, et 99 tombe juste.
    expect(encodeRibbon(sample(30))).toHaveLength(132);
  });

  it('refuse une saison inconnue plutôt que d’en inventer une', () => {
    const cassé = sample(30);
    // Le cas réel : un appelant qui lit la saison au mauvais endroit du rapport
    // et passe `undefined`. Sans garde, le bandeau sortait vert printemps sur un
    // ruban de septembre — un faux qu'on ne découvre qu'une fois l'image partagée.
    (cassé[7] as { season: unknown }).season = undefined;
    expect(() => encodeRibbon(cassé)).toThrow(/saison inconnue au jour 7/);
  });

  it('refuse une longueur impossible plutôt que de deviner', () => {
    expect(() => encodeRibbon([])).toThrow(/entre 1 et/);
    expect(() => encodeRibbon(sample(MAX_DAYS + 1))).toThrow(/entre 1 et/);
    expect(() => decodeRibbon('AAAA')).toThrow();
    expect(() => decodeRibbon(encodeRibbon(sample(30)).slice(0, -4))).toThrow(/octets attendus/);
  });
});
