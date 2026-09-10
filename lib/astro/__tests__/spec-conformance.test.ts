import { describe, expect, it } from 'vitest';
import { AXIS_NATALS, AXIS_TRANSITS, DEFAULT_WINDOW_DAYS, comparisonsTested } from '../transits';
import { NATAL_WEIGHTS, TRANSIT_WEIGHTS, computeReading } from '../scoring';
import { referenceChart } from './fixtures';

/**
 * Conformité au périmètre du brief.
 *
 * Les tables d'axes avaient été élargies après une mesure sur 90 jours — voir
 * QUESTIONS.md Q3. Le brief les redonne à quatre transits et quatre points
 * natals, et c'est lui qui fait foi. Ce test empêche la dérive de revenir sans
 * qu'on s'en aperçoive.
 */
describe('périmètre des axes, tel que fixé par le brief', () => {
  it('quatre planètes en transit par axe, exactement celles du brief', () => {
    expect(AXIS_TRANSITS.business).toEqual(['jupiter', 'saturn', 'mercury', 'sun']);
    expect(AXIS_TRANSITS.love).toEqual(['venus', 'mars', 'moon', 'jupiter']);
    expect(AXIS_TRANSITS.energy).toEqual(['mars', 'sun', 'moon', 'saturn']);
  });

  it('quatre points natals visés par axe, exactement ceux du brief', () => {
    expect(AXIS_NATALS.business).toEqual(['sun', 'mc', 'mercury', 'jupiter']);
    expect(AXIS_NATALS.love).toEqual(['venus', 'moon', 'dsc', 'sun']);
    expect(AXIS_NATALS.energy).toEqual(['asc', 'sun', 'mars', 'moon']);
  });

  it('chaque planète et chaque point du brief porte un poids, et rien d\'autre', () => {
    for (const axis of ['business', 'love', 'energy'] as const) {
      expect(Object.keys(TRANSIT_WEIGHTS[axis]).sort()).toEqual([...AXIS_TRANSITS[axis]].sort());
      expect(Object.keys(NATAL_WEIGHTS[axis]).sort()).toEqual([...AXIS_NATALS[axis]].sort());
    }
  });

  it('16 couples par axe, 48 en tout', () => {
    expect(comparisonsTested(1)).toBe(48 * 5);
  });
});

describe('la fenêtre est un paramètre de premier plan', () => {
  it('vaut 30 jours par défaut, comme le demande l\'objectif de session', () => {
    expect(DEFAULT_WINDOW_DAYS).toBe(30);
    const reading = computeReading({ chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10' });
    expect(reading.days).toBe(30);
    expect(reading.axes.business.days).toHaveLength(30);
    expect(reading.axes.business.days[0].date).toBe('2026-09-10');
    expect(reading.axes.business.days[29].date).toBe('2026-10-09');
    expect(reading.seasons).toHaveLength(30);
    expect(reading.stats.comparisonsTested).toBe(48 * 5 * 30);
  });

  it('sait encore produire 90 jours, pour le rapport complet à venir', () => {
    const reading = computeReading({
      chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10', days: 90,
    });
    expect(reading.days).toBe(90);
    expect(reading.axes.love.days[89].date).toBe('2026-12-08');
  });

  /** La normalisation reste par personne : l'amplitude tient sur 30 jours comme sur 90. */
  it('garde son amplitude sur une fenêtre courte', () => {
    for (const days of [14, 30, 90]) {
      const reading = computeReading({
        chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10', days,
      });
      for (const axis of ['business', 'love', 'energy'] as const) {
        const scores = reading.axes[axis].days.map((d) => d.score);
        expect(Math.max(...scores) - Math.min(...scores)).toBeCloseTo(94, 5);
      }
    }
  });
});
