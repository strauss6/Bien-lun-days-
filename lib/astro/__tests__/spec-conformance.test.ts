import { describe, expect, it } from 'vitest';
import { AXIS_NATALS, AXIS_TRANSITS, DEFAULT_WINDOW_DAYS, allPairs, comparisonsTested } from '../transits';
import { NATAL_WEIGHTS, SCORE_CEILING, SCORE_FLOOR, TRANSIT_WEIGHTS, computeReading } from '../scoring';
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

  /*
   * Le compte annoncé à l'écran de calcul était faux, et le test l'entérinait :
   * il additionnait 16 couples par axe, soit 48, alors que certains couples
   * servent à deux axes — la Lune sur le Soleil natal compte pour l'amour et
   * pour l'énergie, et n'est calculée qu'une fois. Depuis l'arrivée du score
   * global du jour, la Lune vise en plus les quatorze points du thème. Le compte
   * est maintenant dérivé des paires réellement calculées, sans doublon, et
   * c'est ce nombre-là qui est montré comme un fait.
   */
  it('compte les paires réellement calculées, sans doublon', () => {
    expect(comparisonsTested(1)).toBe(allPairs().length * 5);
    expect(new Set(allPairs().map((p) => `${p.transit}|${p.natal}`)).size).toBe(allPairs().length);
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
    expect(reading.stats.comparisonsTested).toBe(comparisonsTested(30));
  });

  it('sait encore produire 90 jours, pour le rapport complet à venir', () => {
    const reading = computeReading({
      chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10', days: 90,
    });
    expect(reading.days).toBe(90);
    expect(reading.axes.love.days[89].date).toBe('2026-12-08');
  });

  /*
   * L'échelle est celle de la personne, pas celle de la fenêtre.
   *
   * Ce test disait l'inverse jusqu'au 11 septembre 2026 : il vérifiait que toute
   * fenêtre s'étalait exactement sur 94 points, parce que la normalisation était
   * refaite sur les jours affichés. C'était la cause directe du défaut que la
   * nouvelle direction produit interdit — un même jour changeait de score selon
   * la vue, et changeait encore le lendemain. L'attente change donc parce que la
   * méthode a changé, et le test vérifie maintenant ce qui compte : les bornes
   * tiennent, et il reste du relief.
   */
  it('reste dans ses bornes et garde du relief sur une fenêtre courte', () => {
    for (const days of [14, 30, 90]) {
      const reading = computeReading({
        chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10', days,
      });
      for (const axis of ['business', 'love', 'energy'] as const) {
        const scores = reading.axes[axis].days.map((d) => d.score);
        expect(Math.min(...scores)).toBeGreaterThanOrEqual(SCORE_FLOOR);
        expect(Math.max(...scores)).toBeLessThanOrEqual(SCORE_CEILING);
        /*
         * Mesuré sur dix thèmes et quatre départs : sur trente jours, le relief
         * médian est de 67 points, le premier décile de 50, le minimum de 9. Sur
         * quatorze jours il descend plus bas encore — une quinzaine calme est
         * calme, et le produit doit pouvoir le dire. Le plancher vérifie donc
         * qu'il reste quelque chose à lire, pas que l'échelle est remplie.
         */
        expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThan(8);
      }
    }
  });
});
