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

describe('jetons de texte des axes', () => {
  for (const [axis, palette] of Object.entries(AXIS_COLORS)) {
    it(`${axis} reste lisible sur la carte et sur le papier`, () => {
      expect(contrast(palette.text, SURFACE)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrast(palette.text, PAPER)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }

  /*
   * La teinte vive n'est pas une teinte de texte, et le test le dit plutôt que
   * de laisser croire l'inverse : `#FF9500` sur blanc ne passe même pas le seuil
   * du grand texte. C'est la raison d'être du jeton `text` — les nombres de
   * l'interface l'emploient, les dégradés du ruban gardent la teinte vive.
   */
  it('l’orangé vif de l’axe Énergie ne peut pas servir de texte', () => {
    expect(contrast(AXIS_COLORS.energy.deep, SURFACE)).toBeLessThan(AA_LARGE);
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
