import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MIN_PERIOD_DAYS, axisPeriods } from '../periods';
import { neutralScore } from '../calibration';

const p = (scores: number[], neutre = 50, min = MIN_PERIOD_DAYS) => axisPeriods(scores, neutre, 'business', min);
const plat = (valeur: number, n: number) => Array.from({ length: n }, () => valeur);

describe('les fenêtres d’un axe', () => {
  it('ne retient rien sous la durée minimale', () => {
    expect(p([...plat(80, 6), ...plat(20, 30)]).map((f) => f.from)).toEqual([6]);
    expect(p([...plat(80, 7), ...plat(20, 30)]).map((f) => f.from)).toEqual([0, 7]);
  });

  it('découpe aux traversées de la ligne neutre', () => {
    const f = p([...plat(80, 10), ...plat(20, 10), ...plat(80, 10)]);
    expect(f.map((x) => [x.from, x.to, x.favourable])).toEqual([
      [0, 9, true], [10, 19, false], [20, 29, true],
    ]);
  });

  it('la ligne neutre est inclusive vers le haut', () => {
    // Un jour exactement sur la ligne compte comme favorable, une fois pour toutes.
    expect(p(plat(50, 10))[0].favourable).toBe(true);
    expect(p(plat(49, 10))[0].favourable).toBe(false);
  });

  it('rend la moyenne, le jour le plus marqué et son score', () => {
    // Un jour bas puis six hauts : deux tronçons, aucun n'atteint sept jours.
    expect(p([10, 90, 60, 70, 80, 65, 75])).toEqual([]);

    const [g] = p([60, 90, 60, 70, 80, 65, 75]);
    expect(g.days).toBe(7);
    expect(g.peak).toBe(1);
    expect(g.peakScore).toBe(90);
    expect(g.average).toBe(71);
  });

  it('cherche le creux dans une fenêtre basse, pas le sommet', () => {
    const [f] = p([40, 10, 45, 30, 20, 35, 25]);
    expect(f.favourable).toBe(false);
    expect(f.peak).toBe(1);
    expect(f.peakScore).toBe(10);
  });

  /*
   * Même exigence que pour les plages d'aspect : une borne atteinte parce que le
   * calcul s'arrête là n'est pas une date. L'interface doit pouvoir le dire.
   */
  it('signale les fenêtres coupées par le bord du calcul', () => {
    const f = p([...plat(80, 10), ...plat(20, 10), ...plat(80, 10)]);
    expect([f[0].openStart, f[0].openEnd]).toEqual([true, false]);
    expect([f[1].openStart, f[1].openEnd]).toEqual([false, false]);
    expect([f[2].openStart, f[2].openEnd]).toEqual([false, true]);
  });

  it('rend une seule fenêtre ouverte des deux côtés quand rien ne traverse', () => {
    const [f] = p(plat(80, 90));
    expect([f.days, f.openStart, f.openEnd, f.favourable]).toEqual([90, true, true, true]);
  });

  it('ne rend rien sur une série vide', () => {
    expect(p([])).toEqual([]);
  });

  /*
   * Un trimestre sans rien de saillant existe, et le produit doit pouvoir le dire.
   * Une alternance serrée ne produit aucune fenêtre : c'est le résultat juste.
   */
  it('rend une liste vide quand rien ne dure', () => {
    const dents = Array.from({ length: 90 }, (_, i) => (i % 2 === 0 ? 80 : 20));
    expect(p(dents)).toEqual([]);
  });

  it('couvre la série sans trou ni recouvrement, aux fenêtres courtes près', () => {
    const scores = Array.from({ length: 90 }, (_, i) => Math.round(50 + 40 * Math.sin(i / 9)));
    const f = p(scores);
    for (let i = 1; i < f.length; i += 1) {
      expect(f[i].from).toBeGreaterThan(f[i - 1].to);
      expect(f[i].favourable).not.toBe(f[i - 1].favourable);
    }
    expect(f.every((x) => x.days >= MIN_PERIOD_DAYS)).toBe(true);
  });

  it('arrondit le score du pic comme la carte du jour', () => {
    const [f] = p([60, 90.4, 60, 70, 80, 65, 75]);
    expect(f.peakScore).toBe(90);
    expect(Number.isInteger(f.average)).toBe(true);
  });

  it('est déterministe et sans horloge', () => {
    const scores = Array.from({ length: 90 }, (_, i) => Math.round(50 + 30 * Math.sin(i / 7)));
    expect(p(scores)).toEqual(p(scores));
    const source = readFileSync(new URL('../periods.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Date\.now|new Date\(|Math\.random/);
  });
});

describe('la ligne neutre', () => {
  /*
   * Elle vient de l'échelle de la personne, calculée une fois sur la période de
   * référence fixe. Si elle venait des jours affichés, la moitié d'entre eux
   * seraient favorables par construction, pour tout le monde et tous les
   * trimestres — et le produit ne pourrait plus dire qu'une période est calme.
   */
  it('est le score de la journée médiane de la personne', () => {
    const scale = { median: 10, scale: 4, lo: -0.9, hi: 0.9 };
    expect(neutralScore(scale)).toBeCloseTo(50, 5);
  });

  it('se décale quand la distribution de la personne n’est pas symétrique', () => {
    const haute = neutralScore({ median: 10, scale: 4, lo: -0.4, hi: 0.95 });
    const basse = neutralScore({ median: 10, scale: 4, lo: -0.95, hi: 0.4 });
    expect(haute).toBeLessThan(50);
    expect(basse).toBeGreaterThan(50);
  });
});
