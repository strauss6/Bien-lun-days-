import { describe, expect, it } from 'vitest';
import { RARITY_OF, computeRareEvents, isHighlightable, rarityOfBody } from '../rarity';
import { referenceChart } from './fixtures';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';

const chart = referenceChart();
const events = computeRareEvents({ chart, startDate: '2026-09-10', days: 30 });
const find = (transit: string, aspect: string, natal: string) =>
  events.find((e) => e.transit === transit && e.aspect === aspect && e.natal === natal);

describe('classes de rareté', () => {
  it('suit la période orbitale, de la Lune à Pluton', () => {
    expect(rarityOfBody('moon')).toBe('never');
    expect(rarityOfBody('sun')).toBe('yearly');
    expect(rarityOfBody('mercury')).toBe('yearly');
    expect(rarityOfBody('venus')).toBe('yearly');
    expect(rarityOfBody('mars')).toBe('notable');
    expect(rarityOfBody('jupiter')).toBe('rare');
    expect(rarityOfBody('saturn')).toBe('very-rare');
    expect(rarityOfBody('uranus')).toBe('exceptional');
    expect(rarityOfBody('neptune')).toBe('exceptional');
    expect(rarityOfBody('pluto')).toBe('exceptional');
  });

  it('ne met en avant que « rare » et au-dessus', () => {
    expect(isHighlightable('moon')).toBe(false);
    expect(isHighlightable('venus')).toBe(false);
    expect(isHighlightable('mars')).toBe(false);
    expect(isHighlightable('jupiter')).toBe(true);
    expect(isHighlightable('saturn')).toBe(true);
    expect(isHighlightable('pluto')).toBe(true);
    expect(Object.keys(RARITY_OF)).toHaveLength(10);
  });

  it('la Lune n\'apparaît jamais dans les jours rares', () => {
    expect(events.every((e) => isHighlightable(e.transit))).toBe(true);
  });
});

describe('dernière et prochaine occurrence, sur le thème de référence', () => {
  it('Jupiter conjonction Soleil : 2015 à 21 ans, prochaine en 2038', () => {
    const e = find('jupiter', 'conjunction', 'sun');
    expect(e).toBeDefined();
    expect(e!.rarity).toBe('rare');
    expect(e!.previous?.date.slice(0, 4)).toBe('2015');
    expect(e!.previous?.age).toBe(21);
    expect(e!.next?.date.slice(0, 4)).toBe('2038');
    expect(e!.firstInLifetime).toBe(false);
  });

  it('Saturne trigone Soleil : 2016 à 23 ans, prochaine en 2045', () => {
    const e = find('saturn', 'trine', 'sun');
    expect(e).toBeDefined();
    expect(e!.rarity).toBe('very-rare');
    expect(e!.previous?.date.slice(0, 4)).toBe('2016');
    expect(e!.previous?.age).toBe(23);
    expect(e!.next?.date.slice(0, 4)).toBe('2045');
  });

  it('Saturne opposition Jupiter : 1997 à 3 ans, prochaine en 2056', () => {
    const e = find('saturn', 'opposition', 'jupiter');
    expect(e).toBeDefined();
    expect(e!.previous?.date.slice(0, 4)).toBe('1997');
    expect(e!.previous?.age).toBe(3);
    expect(e!.next?.date.slice(0, 4)).toBe('2056');
  });

  /**
   * Le piège que ce module existe pour éviter : une planète lente repasse deux ou
   * trois fois sur le même degré pendant sa rétrogradation. Compter ces passages
   * comme des occurrences distinctes ferait dire « la dernière fois, tu avais 31
   * ans » d'un transit qui n'est arrivé qu'une seule fois.
   */
  it('Neptune conjonction Lune n\'est jamais arrivé avant : on l\'écrit', () => {
    const e = find('neptune', 'conjunction', 'moon');
    expect(e).toBeDefined();
    expect(e!.rarity).toBe('exceptional');
    expect(e!.firstInLifetime).toBe(true);
    expect(e!.previous).toBeNull();
  });

  it('aucune occurrence antérieure n\'est jamais située avant la naissance', () => {
    for (const e of events) {
      if (!e.previous) continue;
      expect(e.previous.age).toBeGreaterThanOrEqual(0);
      expect(e.previous.date >= chart.birth.utcISO.slice(0, 10)).toBe(true);
      expect(e.previous.date < '2026-09-10').toBe(true);
    }
  });

  it('les passages rétrogrades d\'un même transit ne comptent jamais pour deux', () => {
    for (const e of events) {
      if (!e.previous || !e.next) continue;
      const gapYears = (Number(e.next.date.slice(0, 4)) - Number(e.previous.date.slice(0, 4)));
      // Deux occurrences successives sont séparées d'au moins la moitié d'une révolution.
      expect(gapYears).toBeGreaterThan(e.recurrenceYears / 2);
    }
  });
});

describe('honnêteté', () => {
  it('ne fabrique jamais de rareté : chaque événement est réellement dans l\'orbe', () => {
    for (const e of events) {
      expect(e.orbInWindow).toBeLessThanOrEqual(6);
      expect(e.exactDate === null || typeof e.exactDate === 'string').toBe(true);
    }
  });

  it('sans heure de naissance, ne parle jamais des axes du thème', () => {
    const noon = computeNatalChart(
      resolveBirthInstant({ date: '1993-08-06', time: null, lat: 48.8352, lng: 2.2409 }),
      48.8352, 2.2409,
    );
    const e = computeRareEvents({ chart: noon, startDate: '2026-09-10', days: 30 });
    expect(e.some((x) => x.natal === 'asc' || x.natal === 'mc' || x.natal === 'dsc')).toBe(false);
  });

  it('classe du plus rare au plus courant', () => {
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i - 1].recurrenceYears).toBeGreaterThanOrEqual(events[i].recurrenceYears);
    }
  });

  it('le second appel est servi par le cache et rend le même résultat', () => {
    const again = computeRareEvents({ chart, startDate: '2026-09-10', days: 30 });
    expect(again).toEqual(events);
  });
});
