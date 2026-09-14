import { describe, expect, it } from 'vitest';
import { computeReading } from '../scoring';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import { AXIS_IDS } from '../transits';
import { SIGNS } from '../angles';
import { referenceChart } from './fixtures';
import {
  ASPECT_PLAIN, aspectPhrase, notation, possessive, transitPhrase,
} from '../labels';
import { ASPECT_IDS } from '../aspects';
import { ANGLE_IDS, PLANETS } from '../natal';

const CHARTS: Array<[string, string, number, number]> = [
  ['1993-08-06', '20:40', 48.8352, 2.2409],
  ['1985-11-22', '12:00', 40.7128, -74.006],
  ['1970-01-01', '04:15', -33.8688, 151.2093],
  ['2001-05-03', '23:55', 22.5726, 88.3639],
  ['1962-02-14', '07:30', 60.1699, 24.9384],
];

describe('les deux aspects qui expliquent le score', () => {
  const reading = computeReading({ chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10' });

  it('chaque jour et chaque axe en portent au plus deux', () => {
    for (const axis of AXIS_IDS) {
      for (const day of reading.axes[axis].days) {
        expect(day.explaining.length).toBeLessThanOrEqual(2);
        expect(day.explaining.length).toBe(Math.min(2, day.aspects.length));
      }
    }
  });

  it('ce sont les deux plus fortes contributions en valeur absolue', () => {
    for (const axis of AXIS_IDS) {
      for (const day of reading.axes[axis].days) {
        const byWeight = [...day.aspects]
          .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
          .slice(0, 2);
        expect(day.explaining.map((a) => a.contribution)).toEqual(byWeight.map((a) => a.contribution));
      }
    }
  });

  /**
   * Le point que le brief signale comme souvent raté : on ne garde pas les deux
   * aspects les plus **favorables**, on garde les deux qui ont le plus **pesé**.
   * Un jour bas doit donc afficher ce qui l'a fait tomber.
   */
  it.each(CHARTS)('%s — un jour bas est expliqué par ce qui l\'a fait tomber', (date, time, lat, lng) => {
    const chart = computeNatalChart(resolveBirthInstant({ date, time, lat, lng }), lat, lng);
    const r = computeReading({ chart, zone: 'Europe/Paris', startDate: '2026-09-10' });

    for (const axis of AXIS_IDS) {
      const worstDay = [...r.axes[axis].days].sort((a, b) => a.score - b.score)[0];
      expect(worstDay.explaining.length).toBeGreaterThan(0);
      expect(worstDay.explaining[0].contribution).toBeLessThan(0);
      // Et le jour le plus haut, symétriquement, par ce qui l'a porté.
      const bestDay = [...r.axes[axis].days].sort((a, b) => b.score - a.score)[0];
      expect(bestDay.explaining[0].contribution).toBeGreaterThan(0);
    }
  });

  it('chaque aspect retenu porte tout ce que le brief demande', () => {
    for (const day of reading.axes.business.days) {
      for (const a of day.explaining) {
        expect(a.transit).toBeTruthy();
        expect(a.aspect).toBeTruthy();
        expect(a.natal).toBeTruthy();
        expect(a.orb).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(a.contribution)).toBe(true);
        expect(a.contribution).not.toBe(0);
      }
    }
  });
});

describe('libellés', () => {
  it('un aspect vise un point natal, jamais un signe', () => {
    const points = [...PLANETS, ...ANGLE_IDS];
    for (const aspect of ASPECT_IDS) {
      for (const natal of points) {
        for (const transit of PLANETS) {
          const phrase = transitPhrase(transit, aspect, natal);
          for (const sign of SIGNS) {
            // « Lion » ne doit jamais apparaître ; « Soleil » oui.
            expect(phrase, phrase).not.toContain(sign);
          }
        }
      }
    }
  });

  it('accorde le possessif au genre du point', () => {
    expect(possessive('sun')).toBe('ton Soleil');
    expect(possessive('moon')).toBe('ta Lune');
    expect(possessive('venus')).toBe('ta Vénus');
    expect(possessive('mars')).toBe('ton Mars');
    expect(possessive('asc')).toBe('ton Ascendant');
    expect(possessive('mc')).toBe('ton Milieu du Ciel');
  });

  it('compose les deux formes attendues par le produit', () => {
    expect(aspectPhrase('trine', 'sun')).toBe('trigone à ton Soleil');
    expect(transitPhrase('jupiter', 'trine', 'sun')).toBe('Jupiter en trigone à ton Soleil');
    expect(transitPhrase('venus', 'square', 'moon')).toBe('Vénus en carré à ta Lune');
    expect(notation('jupiter', 'trine', 'sun')).toBe('♃ △ ☉');
  });

  /** Chaque terme technique a sa traduction en clair, pour son premier emploi. */
  it('traduit chaque aspect en clair, une fois', () => {
    for (const aspect of ASPECT_IDS) {
      expect(ASPECT_PLAIN[aspect].length).toBeGreaterThan(10);
      expect(ASPECT_PLAIN[aspect]).toMatch(/\d+\s?°|dessus/);
    }
  });
});
