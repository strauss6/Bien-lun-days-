import { describe, expect, it } from 'vitest';
import {
  BAND_HEIGHT, LABEL_GUTTER, PLOT_WIDTH, RIBBON_WIDTH, bandMarks, columnCenter,
  seasonStops, tickPositions,
} from '../ribbon-geometry';

const scores30 = Array.from({ length: 30 }, (_, i) => (i * 97) / 29);

describe('géométrie des colonnes', () => {
  it('répartit les jours après la gouttière des libellés', () => {
    for (const n of [7, 30, 90]) {
      // Les colonnes commencent après la gouttière : sans elle, le nom de l'axe
      // se superpose aux premiers jours.
      expect(columnCenter(0, n)).toBeGreaterThan(LABEL_GUTTER);
      expect(columnCenter(n - 1, n)).toBeLessThan(RIBBON_WIDTH);
      const pitch = columnCenter(1, n) - columnCenter(0, n);
      expect(pitch).toBeCloseTo(PLOT_WIDTH / n, 6);
    }
  });

  it('un score au-dessus de cinquante monte, en dessous descend', () => {
    const [low] = bandMarks([20], 1, 'business');
    const [high] = bandMarks([80], 1, 'business');
    expect(low.y).toBeGreaterThanOrEqual(high.y + high.height);
    expect(high.y + high.height).toBeLessThanOrEqual(low.y + 0.001);
  });

  it('l\'intensité suit l\'écart à la médiane, pas le score brut', () => {
    const [tiede] = bandMarks([50], 1, 'business');
    const [pic] = bandMarks([97], 1, 'business');
    const [creux] = bandMarks([3], 1, 'business');
    expect(tiede.opacity).toBeLessThan(pic.opacity);
    expect(tiede.opacity).toBeLessThan(creux.opacity);
  });

  it('rien ne sort de la bande', () => {
    for (const axis of ['business', 'love', 'energy'] as const) {
      for (const m of bandMarks(scores30, 30, axis)) {
        expect(m.y).toBeGreaterThanOrEqual(0);
        expect(m.y + m.height).toBeLessThanOrEqual(BAND_HEIGHT);
        expect(m.x).toBeGreaterThanOrEqual(0);
        expect(m.x + m.width).toBeLessThanOrEqual(RIBBON_WIDTH);
      }
    }
  });

  /** Les trois axes se distinguent par le tracé, jamais par la teinte. */
  it('chaque axe a son mode de tracé', () => {
    const business = bandMarks(scores30, 30, 'business');
    const love = bandMarks(scores30, 30, 'love');
    const energy = bandMarks(scores30, 30, 'energy');

    // Colonne pleine : une marque par jour.
    expect(business).toHaveLength(30);
    // Double filet : deux traits fins par jour.
    expect(love).toHaveLength(60);
    expect(love[0].width).toBeLessThan(business[0].width);
    // Pile de tirets : le nombre dépend de la hauteur, la hauteur d'une marque est fixe.
    expect(energy.length).toBeGreaterThan(60);
    expect(new Set(energy.map((m) => m.height))).toHaveLength(1);

    // Toutes les marques sont des pilules : le rayon vaut la moitié de la largeur.
    for (const m of [...business, ...love, ...energy]) {
      expect(m.radius).toBeGreaterThan(0);
      expect(m.radius).toBeLessThanOrEqual(Math.max(m.width, m.height) / 2 + 0.001);
    }
  });
});

describe('lavis saisonnier', () => {
  it('une fenêtre d\'une seule saison donne une teinte constante', () => {
    const stops = seasonStops(new Array(30).fill('summer'));
    expect(new Set(stops.map((s) => s.color)).size).toBe(1);
  });

  it('une fenêtre à cheval glisse d\'une teinte à l\'autre', () => {
    const seasons = [...new Array(14).fill('summer'), ...new Array(16).fill('autumn')];
    const stops = seasonStops(seasons);
    expect(new Set(stops.map((s) => s.color)).size).toBe(2);
    expect(stops[0].offset).toBe(0);
    expect(stops[stops.length - 1].offset).toBe(100);
    for (let i = 1; i < stops.length; i += 1) {
      expect(stops[i].offset).toBeGreaterThanOrEqual(stops[i - 1].offset);
    }
  });

  it('le bandeau porte la saison à pleine teinte, puisqu\'il ne concurrence plus rien', () => {
    const [stop] = seasonStops(new Array(30).fill('spring'));
    expect(stop.color).toBe('#34C759');
  });
});

describe('graduation', () => {
  it('marque une semaine sur sept et étiquette le premier jour', () => {
    const ticks = tickPositions(30);
    expect(ticks.filter((t) => t.labelled)).toHaveLength(Math.ceil(30 / 7));
    expect(ticks[0].label).toBe('AUJ.');
    expect(ticks.find((t) => t.day === 7)?.label).toBe('+7');
    expect(ticks).toHaveLength(30);
  });
});
