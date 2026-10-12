import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  AXIS_HOUSES, HOUSE_FLOOR, RULER_SHARE, houseAffinity, houseRulerWeights, houseWeight,
} from '../houses';
import { effectiveNatalWeights, NATAL_WEIGHTS } from '../scoring';
import { rulerOfHouse } from '../rulers';
import { referenceChart } from './fixtures';
import { AXIS_IDS } from '../transits';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import { signOf } from '../angles';
import type { PointId } from '../types';

const chart = referenceChart();

describe('les maisons de chaque axe', () => {
  it('sont déclarées avec leur provenance', () => {
    for (const axis of AXIS_IDS) {
      const maisons = AXIS_HOUSES[axis];
      expect(maisons.length, axis).toBeGreaterThan(0);
      for (const m of maisons) {
        expect(m.house, axis).toBeGreaterThanOrEqual(1);
        expect(m.house, axis).toBeLessThanOrEqual(12);
        expect(m.weight).toBeGreaterThan(0);
        expect(m.weight).toBeLessThanOrEqual(1);
        expect(m.why.length).toBeGreaterThan(5);
      }
      // Une maison principale par axe, et une seule.
      expect(maisons.filter((m) => m.weight === 1), axis).toHaveLength(1);
      // Pas de doublon.
      expect(new Set(maisons.map((m) => m.house)).size, axis).toBe(maisons.length);
    }
  });

  /*
   * Les quatre maisons que le rédacteur nomme importantes — 1, 4, 7, 10 — doivent
   * être employées quelque part, et sa mise en garde impose qu'on ne s'y limite
   * pas : « il y en a d'autres, et il faut les prendre en compte ».
   */
  it('emploient les quatre maisons du rédacteur, sans s’y limiter', () => {
    const toutes = AXIS_IDS.flatMap((a) => AXIS_HOUSES[a].map((m) => m.house));
    for (const importante of [1, 4, 7, 10]) expect(toutes, `maison ${importante}`).toContain(importante);
    expect(toutes.some((h) => ![1, 4, 7, 10].includes(h))).toBe(true);
  });

  it('déclarent honnêtement ce qui n’est pas de sa main', () => {
    const inferees = AXIS_IDS.flatMap((a) => AXIS_HOUSES[a].filter((m) => m.source === 'inféré'));
    const directes = AXIS_IDS.flatMap((a) => AXIS_HOUSES[a].filter((m) => m.source === 'direct'));
    expect(directes.length).toBeGreaterThan(0);
    expect(inferees.length).toBeGreaterThan(0);
    // Les maisons principales des trois axes viennent de lui, pas de nous.
    for (const axis of AXIS_IDS) {
      expect(AXIS_HOUSES[axis].find((m) => m.weight === 1)!.source, axis).toBe('direct');
    }
  });

  it('houseWeight rend zéro hors des maisons de l’axe', () => {
    expect(houseWeight('business', 10)).toBe(1);
    expect(houseWeight('business', 9)).toBe(0);
    expect(houseWeight('love', 7)).toBe(1);
  });
});

describe('les maîtres de maison', () => {
  /*
   * La règle du rédacteur, mot pour mot : « si la maison 7 tombe en Cancer, son
   * maître est la Lune ; un bon aspect à la Lune est alors un bon aspect sur un
   * partenariat ».
   */
  it('entrent dans les poids de l’axe que leur maison sert', () => {
    for (const axis of AXIS_IDS) {
      const poids = houseRulerWeights(chart, axis);
      for (const { house, weight } of AXIS_HOUSES[axis]) {
        const maitre = rulerOfHouse(chart, house);
        expect(poids[maitre], `${axis} maison ${house}`).toBeGreaterThanOrEqual(weight * RULER_SHARE - 1e-9);
      }
    }
  });

  it('additionnent deux maisons qui partagent un maître', () => {
    // Construit : un thème dont deux maisons d'un même axe ont le même maître.
    for (const axis of AXIS_IDS) {
      const maisons = AXIS_HOUSES[axis];
      const maitres = maisons.map((m) => rulerOfHouse(chart, m.house));
      const poids = houseRulerWeights(chart, axis);
      for (const [i, maitre] of maitres.entries()) {
        const partages = maisons.filter((_, j) => maitres[j] === maitre);
        if (partages.length < 2) continue;
        const attendu = partages.reduce((a, m) => a + m.weight * RULER_SHARE, 0);
        expect(poids[maitre], `${axis} ${maitre} (${i})`).toBeCloseTo(attendu, 9);
      }
    }
  });

  /*
   * En maisons signes entiers, les maîtres ne dépendent **que du signe
   * ascendant**. Deux personnes nées le même jour à sept heures d'écart ont donc
   * des maîtres différents ; deux personnes nées à trois ans d'écart peuvent avoir
   * exactement les mêmes. C'est l'heure de naissance qui décide — et c'est
   * précisément ce que le produit achète en l'exigeant.
   */
  it('dépendent du signe ascendant, donc de l’heure de naissance', () => {
    const meme = computeNatalChart(
      resolveBirthInstant({ date: '1996-02-14', time: '07:15', lat: 43.2965, lng: 5.3698 }),
      43.2965, 5.3698,
    );
    const autre = computeNatalChart(
      resolveBirthInstant({ date: '1996-02-14', time: '14:30', lat: 43.2965, lng: 5.3698 }),
      43.2965, 5.3698,
    );
    // Même ascendant que le thème de référence, Verseau : mêmes maîtres.
    expect(signOf(meme.points.asc.lon)).toBe(signOf(chart.points.asc.lon));
    expect(houseRulerWeights(meme, 'business')).toEqual(houseRulerWeights(chart, 'business'));

    // Sept heures plus tard, ascendant Cancer : la lecture change de maîtres.
    expect(signOf(autre.points.asc.lon)).not.toBe(signOf(chart.points.asc.lon));
    expect(houseRulerWeights(autre, 'business')).not.toEqual(houseRulerWeights(chart, 'business'));
  });
});

describe('l’affinité de maison', () => {
  /* « Le domaine dépend de la maison touchée. » */
  it('vaut 1 dans la maison principale et le plancher ailleurs', () => {
    for (const axis of AXIS_IDS) {
      for (const point of Object.keys(chart.points) as PointId[]) {
        const a = houseAffinity(chart, axis, point);
        expect(a, `${axis} ${point}`).toBeGreaterThanOrEqual(HOUSE_FLOOR - 1e-9);
        expect(a, `${axis} ${point}`).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
    // Le Milieu du Ciel est en maison 10 : affinité pleine pour Business.
    expect(houseAffinity(chart, 'business', 'mc')).toBeCloseTo(1, 9);
    // Le Jupiter natal de ce thème est en maison 9, étrangère à Business.
    expect(chart.points.jupiter.house).toBe(9);
    expect(houseAffinity(chart, 'business', 'jupiter')).toBeCloseTo(HOUSE_FLOOR, 9);
  });

  it('module d’au plus trente pour cent', () => {
    expect(1 - HOUSE_FLOOR).toBeLessThanOrEqual(0.3 + 1e-9);
  });
});

describe('les poids natals, une fois les maisons branchées', () => {
  it('ne sont plus les mêmes pour tout le monde', () => {
    const autre = computeNatalChart(
      resolveBirthInstant({ date: '1996-02-14', time: '14:30', lat: 43.2965, lng: 5.3698 }),
      43.2965, 5.3698,
    );
    for (const axis of AXIS_IDS) {
      expect(effectiveNatalWeights(axis, chart), axis)
        .not.toEqual(effectiveNatalWeights(axis, autre));
    }
  });

  it('gardent les ancrages fixes de l’axe', () => {
    for (const axis of AXIS_IDS) {
      const poids = effectiveNatalWeights(axis, chart);
      for (const point of Object.keys(NATAL_WEIGHTS[axis]) as PointId[]) {
        expect(poids[point], `${axis} ${point}`).toBeGreaterThan(0);
      }
    }
  });

  it('restent positifs et bornés', () => {
    for (const axis of AXIS_IDS) {
      for (const [point, w] of Object.entries(effectiveNatalWeights(axis, chart))) {
        expect(w, `${axis} ${point}`).toBeGreaterThan(0);
        expect(w, `${axis} ${point}`).toBeLessThan(2);
      }
    }
  });

  it('sont déterministes et sans horloge', () => {
    for (const axis of AXIS_IDS) {
      expect(effectiveNatalWeights(axis, chart)).toEqual(effectiveNatalWeights(axis, chart));
    }
    const source = readFileSync(new URL('../houses.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Date\.now|new Date\(|Math\.random/);
  });
});
