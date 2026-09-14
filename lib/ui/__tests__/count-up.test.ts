import { describe, expect, it } from 'vitest';
import { countAt, easeOutExpo } from '../count-up';

describe('easeOutExpo', () => {
  it('part de zéro et arrive exactement à un', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    // Un dépassement de la fenêtre ne doit jamais rendre plus que la valeur finale.
    expect(easeOutExpo(1.4)).toBe(1);
    expect(easeOutExpo(-0.2)).toBe(0);
  });

  it('décélère : la moitié du temps a déjà fait l’essentiel du trajet', () => {
    expect(easeOutExpo(0.5)).toBeGreaterThan(0.95);
  });

  it('ne recule jamais', () => {
    let previous = 0;
    for (let t = 0; t <= 1; t += 0.02) {
      const value = easeOutExpo(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('countAt', () => {
  it('finit sur la valeur exacte, jamais sur un arrondi voisin', () => {
    for (const score of [3, 12, 51, 84, 97]) {
      expect(countAt(score, 1)).toBe(score);
      expect(countAt(score, 0)).toBe(0);
    }
  });
});
