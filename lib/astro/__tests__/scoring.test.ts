import { describe, expect, it } from 'vitest';
import {
  BEST_THRESHOLD, MIN_DATES, SCORE_CEILING, SCORE_FLOOR, WORST_THRESHOLD,
  computeReading, effectiveNatalWeights, eventKeyOf, normalize, polarity,
  primaryAspect, selectDates, smooth,
} from '../scoring';
import { exactness, findAspect } from '../aspects';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import { AXIS_IDS } from '../transits';

const BIRTH = { date: '1993-08-06', time: '20:50', lat: 48.8352, lng: 2.2409 };
const chart = computeNatalChart(resolveBirthInstant(BIRTH), BIRTH.lat, BIRTH.lng);

describe('aspects', () => {
  it('un aspect serré pèse ~34 fois un aspect large', () => {
    const ratio = exactness(0.5, 5) / exactness(4.5, 5);
    expect(ratio).toBeGreaterThan(30);
    expect(ratio).toBeLessThan(40);
  });

  it('ne retient qu\'un aspect à la fois, celui dans l\'orbe', () => {
    expect(findAspect(0, 0)?.aspect).toBe('conjunction');
    expect(findAspect(0, 120.4)?.aspect).toBe('trine');
    expect(findAspect(0, 124)?.aspect).toBe('trine');   // 4° d'orbe, dans la limite de 5°
    expect(findAspect(0, 126)).toBeNull();              // 6° d'orbe, hors limite
    expect(findAspect(10, 190)?.aspect).toBe('opposition');
  });

  it('l\'orbe est symétrique et indépendant du sens', () => {
    expect(findAspect(350, 110)?.orb).toBeCloseTo(findAspect(110, 350)!.orb, 10);
  });
});

describe('polarité', () => {
  it('Saturne en conjonction pèse contre, Jupiter en conjonction pour', () => {
    expect(polarity('saturn', 'conjunction')).toBeLessThan(0);
    expect(polarity('jupiter', 'conjunction')).toBeGreaterThan(0);
  });

  it('les harmoniques de Saturne comptent, mais moins', () => {
    expect(polarity('saturn', 'trine')).toBeGreaterThan(0);
    expect(polarity('saturn', 'trine')).toBeLessThan(polarity('venus', 'trine'));
  });

  it('un carré de Jupiter est un excès, pas un mur', () => {
    expect(polarity('jupiter', 'square')).toBe(-0.5);
    expect(polarity('mars', 'square')).toBe(-1);
  });
});

describe('normalisation', () => {
  it('étale toujours entre 3 et 97, quelle que soit la variance', () => {
    for (const series of [
      Array.from({ length: 90 }, (_, i) => Math.sin(i / 7)),
      Array.from({ length: 90 }, (_, i) => (i % 11 === 0 ? 4 : 0.01)),
      Array.from({ length: 90 }, () => 0.5 + Math.random() * 0.001),
    ]) {
      const out = normalize(series);
      expect(Math.min(...out)).toBeCloseTo(SCORE_FLOOR, 6);
      expect(Math.max(...out)).toBeCloseTo(SCORE_CEILING, 6);
    }
  });

  /**
   * Le point qui distingue cette normalisation d'un rang percentile : un pic
   * unique doit rester un pic. En percentile pur, le deuxième jour de la série
   * serait à 97 − 1/90 × 94 ≈ 96, soit un plateau.
   */
  it('conserve la forme : un pic isolé reste isolé', () => {
    const raw = new Array(90).fill(0);
    raw[40] = 10;
    raw[70] = 1;
    const out = normalize(raw);
    expect(out.indexOf(Math.max(...out))).toBe(40);
    expect(out[40] - out[70]).toBeGreaterThan(20);
  });

  it('gère une série plate sans produire de NaN', () => {
    const out = normalize(new Array(90).fill(0));
    expect(out.every((v) => Number.isFinite(v))).toBe(true);
    expect(out[0]).toBeCloseTo(50, 6);
  });

  it('le lissage renormalise les bords au lieu de les creuser', () => {
    const flat = new Array(10).fill(2);
    expect(smooth(flat)).toEqual(flat);
  });
});

describe('sélection des dates', () => {
  it('respecte l\'écart minimum de 3 jours', () => {
    const scores = new Array(90).fill(0).map((_, i) => (i >= 40 && i <= 44 ? 100 - i : i / 100));
    const best = selectDates(scores, { count: 5, order: 'best' });
    expect(best).toHaveLength(5);
    for (let i = 1; i < best.length; i += 1) {
      expect(best[i] - best[i - 1]).toBeGreaterThanOrEqual(3);
    }
  });

  it('les pires jours sont les plus bas', () => {
    const scores = Array.from({ length: 90 }, (_, i) => i);
    expect(selectDates(scores, { count: 3, order: 'worst' })).toEqual([0, 3, 6]);
  });
});

describe('heure de naissance inconnue', () => {
  it('retire les axes du thème et dégrade la Lune', () => {
    const w = effectiveNatalWeights('energy', false);
    expect(w.asc).toBeUndefined();
    expect(w.moon).toBeCloseTo(0.275, 6);
    expect(effectiveNatalWeights('business', false).mc).toBeUndefined();
    expect(effectiveNatalWeights('love', false).dsc).toBeUndefined();
  });

  it('produit malgré tout un rapport avec du relief', () => {
    const noon = computeNatalChart(
      resolveBirthInstant({ ...BIRTH, time: null }), BIRTH.lat, BIRTH.lng,
    );
    const reading = computeReading({ chart: noon, zone: 'Europe/Paris', startDate: '2026-09-09' });
    for (const axis of AXIS_IDS) {
      const scores = reading.axes[axis].days.map((d) => d.score);
      expect(Math.max(...scores) - Math.min(...scores)).toBeCloseTo(94, 5);
    }
  });
});

describe('rapport complet', () => {
  const reading = computeReading({ chart, zone: 'Europe/Paris', startDate: '2026-09-09' });

  it('couvre 90 jours consécutifs', () => {
    expect(reading.days).toBe(90);
    for (const axis of AXIS_IDS) {
      expect(reading.axes[axis].days).toHaveLength(90);
    }
    expect(reading.axes.business.days[0].date).toBe('2026-09-09');
    expect(reading.axes.business.days[89].date).toBe('2026-12-07');
  });

  it('annonce le nombre exact de combinaisons testées', () => {
    // 16 paires Business + 25 Amour + 16 Énergie, cinq aspects, quatre-vingt-dix jours.
    expect(reading.stats.comparisonsTested).toBe(57 * 5 * 90);
    expect(reading.stats.aspectEvents).toBeGreaterThan(20);
    expect(reading.stats.aspectDays).toBeGreaterThan(reading.stats.aspectEvents);
  });

  it('donne 5 meilleurs et 3 pires jours par axe, tous justifiés par un aspect', () => {
    for (const axis of AXIS_IDS) {
      const { best, worst, days } = reading.axes[axis];
      expect(best.length).toBeGreaterThanOrEqual(MIN_DATES);
      expect(best.length).toBeLessThanOrEqual(5);
      expect(worst).toHaveLength(3);
      for (const day of [...best, ...worst]) {
        expect(days[day].aspects.length).toBeGreaterThan(0);
      }
    }
  });

  it('teinte chaque jour par la saison réellement traversée', () => {
    expect(reading.seasons[0]).toBe('summer');   // 9 septembre : Soleil en Vierge
    expect(reading.seasons[89]).toBe('autumn');  // 7 décembre : Soleil en Sagittaire
    expect(new Set(reading.seasons).size).toBeGreaterThan(1);
  });
});

describe('qualité des dates citées', () => {
  const reading = computeReading({ chart, zone: 'Europe/Paris', startDate: '2026-09-09' });

  it('cite cinq événements astrologiques distincts, pas cinq fois le même', () => {
    for (const axis of AXIS_IDS) {
      const { best, days } = reading.axes[axis];
      const events = best.map((d) => eventKeyOf(primaryAspect(days[d], 'best')));
      expect(new Set(events).size).toBe(events.length);
    }
  });

  it('justifie un bon jour par un aspect favorable et un mauvais par un aspect dur', () => {
    for (const axis of AXIS_IDS) {
      const { best, worst, days } = reading.axes[axis];
      for (const d of best) expect(primaryAspect(days[d], 'best')!.contribution).toBeGreaterThan(0);
      for (const d of worst) expect(primaryAspect(days[d], 'worst')!.contribution).toBeLessThan(0);
    }
  });

  it('ne présente jamais un jour tiède comme un pic', () => {
    for (const axis of AXIS_IDS) {
      const { best, worst, days } = reading.axes[axis];
      for (const d of best) expect(days[d].significance).toBeGreaterThanOrEqual(BEST_THRESHOLD);
      for (const d of worst) expect(days[d].significance).toBeLessThanOrEqual(WORST_THRESHOLD);
      expect(best.length).toBeGreaterThanOrEqual(MIN_DATES);
      expect(worst.length).toBeGreaterThanOrEqual(MIN_DATES);
    }
  });

  it('les bords de la fenêtre ne sont pas surreprésentés par un défaut de lissage', () => {
    // La marge de calcul rend le lissage homogène : le premier et le dernier
    // jour doivent avoir la même variance locale que le reste de la série.
    const scores = reading.axes.business.days.map((d) => d.score);
    const localSwing = (i: number) => Math.abs(scores[i] - scores[i + 1]);
    const edge = (localSwing(0) + localSwing(88)) / 2;
    const middle = Array.from({ length: 80 }, (_, i) => localSwing(i + 4))
      .reduce((a, b) => a + b, 0) / 80;
    expect(edge).toBeLessThan(middle * 4);
  });
});

/**
 * Le paywall promet cinq dates par axe. Cette promesse est une contrainte sur le
 * moteur : elle doit tenir sur des thèmes quelconques, pas seulement sur celui
 * qui a servi au développement.
 */
describe('robustesse sur dix thèmes quelconques', () => {
  const SAMPLES: Array<[string, string, number, number]> = [
    ['1993-08-06', '20:50', 48.8352, 2.2409],
    ['1991-03-14', '14:07', 48.8566, 2.3522],
    ['1970-01-01', '04:15', -33.8688, 151.2093],
    ['1985-11-22', '12:00', 40.7128, -74.006],
    ['2001-05-03', '23:55', 22.5726, 88.3639],
    ['1962-02-14', '07:30', 60.1699, 24.9384],
    ['1978-09-30', '16:20', -23.5505, -46.6333],
    ['2004-12-25', '01:05', 48.8566, 2.3522],
    ['1999-06-17', '09:40', 52.52, 13.405],
    ['1988-02-29', '21:10', 41.9028, 12.4964],
  ];

  it.each(SAMPLES)('%s %s — cinq dates par axe, cinq événements distincts', (date, time, lat, lng) => {
    const c = computeNatalChart(resolveBirthInstant({ date, time, lat, lng }), lat, lng);
    const reading = computeReading({ chart: c, zone: 'Europe/Paris', startDate: '2026-09-09' });

    for (const axis of AXIS_IDS) {
      const { best, worst, days } = reading.axes[axis];
      expect(best).toHaveLength(5);
      expect(worst).toHaveLength(3);
      expect(new Set(best.map((d) => eventKeyOf(primaryAspect(days[d], 'best')))).size).toBe(5);

      const scores = days.map((d) => d.score);
      expect(Math.max(...scores) - Math.min(...scores)).toBeCloseTo(94, 5);
    }
  });
});
