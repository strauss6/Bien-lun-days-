import { describe, expect, it } from 'vitest';
import { AA_LARGE, AA_TEXT, contrast, luminance } from '../contrast';
import { AXIS_COLORS, INK, PAPER, SEASON_COLORS, SURFACE } from '../tokens';

describe('formule de contraste', () => {
  it('rend les valeurs de référence de la norme', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(luminance('#000000')).toBeCloseTo(0, 5);
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 2);
    // Le gris de référence de WCAG : 4,54:1 sur blanc, tout juste conforme.
    expect(contrast('#FFFFFF', '#767676')).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('jetons des axes', () => {
  for (const [axis, palette] of Object.entries(AXIS_COLORS)) {
    it(`${axis} — le jeton de texte tient le seuil du texte courant`, () => {
      expect(contrast(palette.text, SURFACE)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrast(palette.text, PAPER)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    /*
     * `deep` a deux emplois : le haut du dégradé du ruban, qui est une forme, et
     * le grand nombre de la carte, qui est du texte. Le second impose le seuil du
     * grand texte — 24 px, ou 18,66 px en gras.
     *
     * Ce test disait l'inverse jusqu'au 10 septembre 2026 : il vérifiait que
     * `#FF9500` échouait, et le grand nombre portait alors le jeton `text`. La
     * direction artistique a tranché la question Q9 dans l'autre sens — garder la
     * teinte vive sur le nombre et assombrir la famille pour qu'elle la mérite.
     * L'attente a donc changé parce que la décision a changé, pas pour faire
     * passer un test rouge : `#FF9500` est devenu `#D46700`.
     */
    it(`${axis} — la teinte vive peut porter le grand nombre`, () => {
      expect(contrast(palette.deep, SURFACE)).toBeGreaterThanOrEqual(AA_LARGE);
      expect(contrast(palette.deep, PAPER)).toBeGreaterThanOrEqual(AA_LARGE);
    });
  }

  /*
   * `bright` est l'autre extrémité du dégradé : elle ne porte jamais de texte, et
   * n'a donc aucun seuil à tenir. Le test fige cette frontière plutôt que de la
   * laisser à la mémoire de qui relit le fichier.
   */
  it('l’extrémité lumineuse reste une couleur de forme, jamais de texte', () => {
    const lisibles = Object.entries(AXIS_COLORS)
      .filter(([, p]) => contrast(p.bright, SURFACE) >= AA_LARGE)
      .map(([axis]) => axis);
    expect(lisibles).toEqual([]);
  });
});

describe('encre et papier', () => {
  it('l’encre sur le papier dépasse largement le seuil', () => {
    expect(contrast(INK, PAPER)).toBeGreaterThan(15);
  });

  it('les couleurs de saison ne portent jamais de texte, seulement un bandeau', () => {
    // Documenté comme tel : aucune n'atteint le seuil, et aucune n'est employée
    // pour du texte. Le test fige cette frontière.
    for (const color of Object.values(SEASON_COLORS)) {
      expect(contrast(color, SURFACE)).toBeLessThan(AA_TEXT);
    }
  });
});
