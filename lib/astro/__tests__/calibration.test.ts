import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_DAYS, CALIBRATION_EPOCH, SCORE_METHOD, applyScale, calibrationFor, computeCalibration,
} from '../calibration';
import { SCORE_CEILING, SCORE_FLOOR, computeReading } from '../scoring';
import { AXIS_IDS } from '../transits';
import { addCivilDays } from '../zone';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import { referenceChart } from './fixtures';

const ZONE = 'Europe/Paris';
const read = (startDate: string, days: number) =>
  computeReading({ chart: referenceChart(), zone: ZONE, startDate, days });

/**
 * L'exigence centrale de la direction produit du 11 septembre 2026 : un même
 * jour vaut la même chose partout. C'est le seul test qui compte vraiment ici —
 * tout le reste du module existe pour le rendre vrai.
 */
describe('un jour garde son score, d’où qu’on le regarde', () => {
  it('ne dépend pas de la fenêtre dans laquelle il tombe', () => {
    for (const cible of ['2026-09-12', '2026-09-20', '2026-10-05', '2027-01-30']) {
      const vues: Record<string, number[]> = Object.fromEntries(AXIS_IDS.map((a) => [a, []]));
      // Le jour vu en tête de la vue du jour, en deuxième des trois jours, au
      // milieu du mois, à la fin du mois — toutes les positions du produit.
      for (const offset of [0, 1, 2, 5, 12, 29]) {
        for (const days of [1, 3, 30, 90]) {
          if (offset >= days) continue;
          const r = read(addCivilDays(cible, -offset), days);
          for (const axis of AXIS_IDS) vues[axis].push(r.axes[axis].days[offset].score);
        }
      }
      for (const axis of AXIS_IDS) {
        expect(vues[axis].length).toBeGreaterThan(5);
        // Identité stricte, pas « proche » : un score affiché à l'unité près
        // masquerait une dérive qui finirait par franchir un arrondi.
        expect(new Set(vues[axis])).toHaveProperty('size', 1);
      }
    }
  });

  it('ne change pas quand la fenêtre avance d’un jour, comme le lendemain matin', () => {
    const hier = read('2026-09-11', 30);
    const aujourdhui = read('2026-09-12', 30);
    for (const axis of AXIS_IDS) {
      for (let d = 0; d < 29; d += 1) {
        expect(aujourdhui.axes[axis].days[d].score).toBe(hier.axes[axis].days[d + 1].score);
        expect(aujourdhui.axes[axis].days[d].date).toBe(hier.axes[axis].days[d + 1].date);
      }
    }
  });

  it('ne change pas selon l’axe qu’on regarde : les trois sont calculés ensemble', () => {
    // Le produit laisse changer d'axe sans recalculer : la garantie porte donc
    // sur le rapport entier, pas sur l'axe prioritaire seul.
    const a = read('2026-09-12', 3);
    const b = read('2026-09-12', 30);
    for (const axis of AXIS_IDS) {
      for (let d = 0; d < 3; d += 1) {
        expect(a.axes[axis].days[d].score).toBe(b.axes[axis].days[d].score);
      }
    }
  });
});

describe('l’étalonnage', () => {
  const cal = calibrationFor(referenceChart(), ZONE);

  it('porte sa méthode, pour qu’un résultat enregistré ne se mélange pas', () => {
    expect(cal.method).toBe(SCORE_METHOD);
    expect(read('2026-09-11', 30).method).toBe(SCORE_METHOD);
  });

  it('est reproductible : deux calculs du même thème donnent la même échelle', () => {
    expect(computeCalibration(referenceChart(), ZONE)).toEqual(cal);
  });

  it('ne dépend d’aucune date d’aujourd’hui : l’époque est fixe', () => {
    expect(CALIBRATION_EPOCH).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Un cycle synodique de Mars, pour que l'axe Énergie ne soit pas étalonné
    // sur une demi-révolution de sa planète dominante.
    expect(CALIBRATION_DAYS).toBe(780);
  });

  it('donne à chaque thème sa propre échelle', () => {
    const autre = computeNatalChart(
      resolveBirthInstant({ date: '1970-01-01', time: '04:15', lat: 43.2965, lng: 5.3698 }),
      43.2965, 5.3698,
    );
    expect(calibrationFor(autre, ZONE).axes.business.score.median)
      .not.toBe(cal.axes.business.score.median);
  });

  it('borne au lieu de déborder : un jour hors du champ de référence tient l’échelle', () => {
    const s = cal.axes.business.score;
    expect(applyScale(1e6, s)).toBe(SCORE_CEILING);
    expect(applyScale(-1e6, s)).toBe(SCORE_FLOOR);
    expect(applyScale(s.median, s)).toBeGreaterThan(SCORE_FLOOR);
    expect(applyScale(s.median, s)).toBeLessThan(SCORE_CEILING);
  });
});
