import { describe, expect, it } from 'vitest';
import {
  LUNAR_SHARE, LUNAR_WEIGHTS, effectiveLunarWeights, lunarSeries, overallScore,
} from '../lunar';
import { LUNAR_NATALS, buildTransitGrid, comparisonsTested, allPairs } from '../transits';
import { SCORE_CEILING, SCORE_FLOOR, computeReading } from '../scoring';
import { addCivilDays } from '../zone';
import { referenceChart } from './fixtures';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';

const ZONE = 'Europe/Paris';
const read = (startDate: string, days: number) =>
  computeReading({ chart: referenceChart(), zone: ZONE, startDate, days });

describe('la Lune sur tout le thème', () => {
  it('vise les quatorze points natals, pas les quatre d’un axe', () => {
    expect(LUNAR_NATALS).toHaveLength(14);
    for (const point of LUNAR_NATALS) expect(LUNAR_WEIGHTS[point]).toBeGreaterThan(0);
  });

  it('est appariée à chacun d’eux dans la grille', () => {
    const paires = allPairs().filter((p) => p.transit === 'moon').map((p) => p.natal);
    for (const point of LUNAR_NATALS) expect(paires).toContain(point);
  });

  /*
   * Le nombre affiché à l'écran de calcul est un fait montré à l'utilisateur :
   * il doit compter les paires réellement calculées. Il était dérivé d'une somme
   * par axe qui comptait deux fois une paire partagée — la Lune sur le Soleil
   * natal sert à l'amour et à l'énergie, elle n'est calculée qu'une fois.
   */
  it('compte les combinaisons sans doublon', () => {
    expect(comparisonsTested(30)).toBe(allPairs().length * 5 * 30);
    expect(new Set(allPairs().map((p) => `${p.transit}|${p.natal}`)).size).toBe(allPairs().length);
  });

  it('retire les axes du thème quand l’heure de naissance est inconnue', () => {
    const w = effectiveLunarWeights(false);
    expect(w.asc).toBeUndefined();
    expect(w.mc).toBeUndefined();
    expect(w.dsc).toBeUndefined();
    expect(w.ic).toBeUndefined();
    // La Lune natale n'est connue qu'à ±6° sans heure : dégradée, pas retirée.
    expect(w.moon).toBeCloseTo(LUNAR_WEIGHTS.moon * 0.5, 6);
    expect(w.sun).toBe(LUNAR_WEIGHTS.sun);
  });

  it('ne produit que des contacts de la Lune, triés par poids', () => {
    const grid = buildTransitGrid({ chart: referenceChart(), zone: ZONE, startDate: '2026-09-11', days: 20 });
    const { perDay } = lunarSeries(grid, LUNAR_WEIGHTS);
    for (const day of perDay) {
      for (const a of day) expect(a.transit).toBe('moon');
      for (let i = 1; i < day.length; i += 1) {
        expect(Math.abs(day[i - 1].contribution)).toBeGreaterThanOrEqual(Math.abs(day[i].contribution));
      }
    }
  });
});

describe('le score global du jour', () => {
  it('donne les trois quarts à la Lune', () => {
    expect(LUNAR_SHARE).toBe(0.75);
    expect(overallScore(100, [0, 0, 0])).toBe(75);
    expect(overallScore(0, [100, 100, 100])).toBe(25);
    expect(overallScore(60, [60, 60, 60])).toBe(60);
  });

  it('reste dans les bornes de l’échelle', () => {
    const scores = read('2026-09-11', 30).overall;
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(SCORE_FLOOR);
    expect(Math.max(...scores)).toBeLessThanOrEqual(SCORE_CEILING);
  });

  /*
   * C'est la Lune qui fait la journée : le score global doit bouger d'un jour à
   * l'autre plus que n'importe quel axe, sans quoi il n'apporterait qu'une
   * moyenne de plus. Mesuré sur six thèmes : l'écart quotidien moyen du global
   * vaut 1,3 à 1,7 fois celui de l'axe le plus mobile, et deux à quatre fois
   * celui de l'axe Business. Le plancher est à 1,2, sous la mesure la plus
   * basse — les deux axes Amour et Énergie comptent déjà la Lune parmi leurs
   * transits, ils bougent donc eux aussi au quotidien.
   */
  it('bouge d’un jour à l’autre plus que n’importe quel axe', () => {
    const r = read('2026-09-11', 30);
    const moyenneDesEcarts = (s: number[]) =>
      s.slice(1).reduce((acc, v, i) => acc + Math.abs(v - s[i]), 0) / (s.length - 1);

    const global = moyenneDesEcarts(r.overall);
    const axes = (['business', 'love', 'energy'] as const)
      .map((a) => moyenneDesEcarts(r.axes[a].days.map((d) => d.score)));

    expect(global).toBeGreaterThan(1.2 * Math.max(...axes));
    expect(global).toBeGreaterThan(2 * moyenneDesEcarts(r.axes.business.days.map((d) => d.score)));
  });

  /*
   * L'exigence de stabilité vaut pour le score global comme pour les axes : il
   * est bâti sur deux séries déjà étalonnées, il ne doit donc rien devoir à la
   * fenêtre affichée.
   */
  it('ne dépend pas de la fenêtre dans laquelle il tombe', () => {
    for (const cible of ['2026-09-14', '2026-10-02']) {
      const vues: number[] = [];
      for (const offset of [0, 1, 2, 7, 20]) {
        for (const days of [3, 30, 60]) {
          if (offset >= days) continue;
          vues.push(read(addCivilDays(cible, -offset), days).overall[offset]);
        }
      }
      expect(vues.length).toBeGreaterThan(5);
      expect(new Set(vues)).toHaveProperty('size', 1);
    }
  });

  it('compte les contacts réels, et n’en invente aucun', () => {
    const r = read('2026-09-11', 30);
    for (let i = 0; i < 30; i += 1) {
      expect(r.lunar[i].aspects.every((a) => a.transit === 'moon')).toBe(true);
      expect(r.lunar[i].date).toBe(r.axes.business.days[i].date);
    }
  });

  it('tient sans heure de naissance', () => {
    const midi = computeNatalChart(
      resolveBirthInstant({ date: '1993-08-06', time: null, lat: 48.8352, lng: 2.2409 }),
      48.8352, 2.2409,
    );
    const r = computeReading({ chart: midi, zone: ZONE, startDate: '2026-09-11', days: 30 });
    expect(r.overall).toHaveLength(30);
    for (const s of r.overall) {
      expect(s).toBeGreaterThanOrEqual(SCORE_FLOOR);
      expect(s).toBeLessThanOrEqual(SCORE_CEILING);
    }
    // Aucun contact avec les axes du thème, qui ne sont pas calculables.
    for (const day of r.lunar) {
      for (const a of day.aspects) expect(['asc', 'mc', 'dsc', 'ic']).not.toContain(a.natal);
    }
  });
});
