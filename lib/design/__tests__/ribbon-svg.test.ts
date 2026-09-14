import { describe, expect, it } from 'vitest';
import { RIBBON_HEIGHT, RIBBON_SHARE_WIDTH, ribbonDataUri, ribbonSvg } from '../ribbon-svg';
import { LABEL_GUTTER, PLOT_WIDTH, bandMarks } from '../ribbon-geometry';
import { AXIS_IDS } from '../../astro/transits';
import type { RibbonShareDay } from '../share-code';
import type { Season } from '../../astro/types';

const SEASONS: Season[] = ['summer', 'summer', 'autumn', 'autumn'];
const days: RibbonShareDay[] = Array.from({ length: 30 }, (_, i) => ({
  season: SEASONS[Math.floor(i / 8)] ?? 'autumn',
  scores: Object.fromEntries(AXIS_IDS.map((a, k) => [a, 20 + ((i * 11 + k * 29) % 70)])) as RibbonShareDay['scores'],
}));

describe('ruban en SVG pur', () => {
  const svg = ribbonSvg(days);

  /*
   * L'exigence de la tâche : une seule source de vérité entre l'écran et le PNG.
   * Elle ne se vérifie pas en lisant le code — elle se vérifie en comptant. Si
   * quelqu'un change la forme des marques d'un côté sans l'autre, ce test tombe.
   */
  it('pose exactement les marques que la géométrie calcule', () => {
    const attendu = AXIS_IDS.reduce(
      (total, axis) => total + bandMarks(days.map((d) => d.scores[axis]), days.length, axis).length,
      0,
    );
    expect(svg.match(/<rect /g)!.length).toBe(attendu + 1); // + le bandeau de saison
  });

  it('place chaque marque exactement où la géométrie la met', () => {
    const dansLeSvg = [...svg.matchAll(/<rect x="([\d.]+)"/g)]
      .map((m) => Number(m[1]))
      .filter((x) => x > LABEL_GUTTER);
    const calculé = AXIS_IDS.flatMap((axis) =>
      bandMarks(days.map((d) => d.scores[axis]), days.length, axis).map((m) => Number(m.x.toFixed(2))));
    expect([...new Set(dansLeSvg)].sort((a, b) => a - b))
      .toEqual([...new Set(calculé)].sort((a, b) => a - b));
  });

  /*
   * Le cadrage coupe la gouttière des noms d'axes : l'image de partage n'en
   * porte aucun, et la laisser vide décalait le ruban dans un cadre symétrique.
   * C'est une fenêtre différente, pas une géométrie différente — le test
   * au-dessus vérifie que les marques n'ont pas bougé d'un pixel.
   */
  it('cadre sur la zone de tracé, gouttière coupée', () => {
    expect(svg).toContain(`viewBox="${LABEL_GUTTER} 0 ${PLOT_WIDTH} ${RIBBON_HEIGHT}"`);
    expect(RIBBON_SHARE_WIDTH).toBe(PLOT_WIDTH);
    const ys = [...svg.matchAll(/y="([\d.]+)" width/g)].map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeLessThan(RIBBON_HEIGHT);
  });

  /*
   * Même règle que les glyphes du zodiaque : aucune courbe. Ici ce n'est pas une
   * question de style mais de rendu — l'image de partage passe par Satori, dont
   * le moteur SVG est partiel. Des rectangles et des dégradés linéaires, rien de
   * plus, c'est ce qui garantit que le PNG ressemble à l'écran.
   */
  it('n’emploie que des rectangles et des dégradés linéaires', () => {
    expect(svg).not.toMatch(/<path|<circle|<ellipse|<text|<filter|<mask/);
  });

  it('s’emballe en adresse de données pour un `img`', () => {
    const uri = ribbonDataUri(days);
    expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(atob(uri.slice('data:image/svg+xml;base64,'.length))).toBe(svg);
  });
});
