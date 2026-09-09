import { describe, expect, it } from 'vitest';
import { angles, eclipticPointHorizon, longitudeOf, trueObliquity } from '../ephemeris';
import { computeNatalChart, wholeSignHouse } from '../natal';
import { resolveBirthInstant } from '../time';
import { signOf } from '../angles';

/**
 * Cas de contrôle répartis sur les deux hémisphères, dont une haute latitude
 * (Helsinki) et deux longitudes de signe opposé.
 */
const SITES: Array<{ label: string; iso: string; lat: number; lng: number }> = [
  { label: 'Boulogne-Billancourt 1993', iso: '1993-08-06T18:50:00Z', lat: 48.8352, lng: 2.2409 },
  { label: 'Paris 1991', iso: '1991-03-14T13:07:00Z', lat: 48.8566, lng: 2.3522 },
  { label: 'Sydney 1970', iso: '1970-01-01T00:00:00Z', lat: -33.8688, lng: 151.2093 },
  { label: 'Helsinki 2005', iso: '2005-06-21T09:15:00Z', lat: 60.1699, lng: 24.9384 },
  { label: 'São Paulo 1988', iso: '1988-12-05T23:40:00Z', lat: -23.5505, lng: -46.6333 },
];

describe('Ascendant et Milieu du Ciel', () => {
  /**
   * Validation géométrique, sans donnée externe : l'Ascendant est par définition
   * le degré de l'écliptique qui se lève à l'est. On rejoue donc la conversion
   * écliptique → horizon avec les rotations d'astronomy-engine et on vérifie
   * que le point calculé est bien sur l'horizon, du côté est.
   */
    it.each(SITES)('$label — l\'Ascendant est sur l\'horizon est', ({ iso, lat, lng }) => {
    const date = new Date(iso);
    const { asc } = angles(date, lat, lng);
    const h = eclipticPointHorizon(date, lat, lng, asc);

    expect(Math.abs(h.altitude)).toBeLessThan(0.02);
    expect(h.azimuth).toBeGreaterThan(0);
    expect(h.azimuth).toBeLessThan(180);
  });

  /** Le MC coupe le méridien : azimut plein sud ou plein nord, jamais entre les deux. */
  it.each(SITES)('$label — le MC est sur le méridien', ({ iso, lat, lng }) => {
    const date = new Date(iso);
    const { mc } = angles(date, lat, lng);
    const h = eclipticPointHorizon(date, lat, lng, mc);
    const offMeridian = Math.min(
      Math.abs(h.azimuth - 180),
      Math.abs(h.azimuth - 0),
      Math.abs(h.azimuth - 360),
    );

    expect(offMeridian).toBeLessThan(0.05);
    expect(h.altitude).toBeGreaterThan(-90);
  });

  it('l\'obliquité vraie reste proche de 23,44° sur la période utile', () => {
    for (const { iso } of SITES) {
      const eps = trueObliquity(new Date(iso));
      expect(eps).toBeGreaterThan(23.43);
      expect(eps).toBeLessThan(23.45);
    }
  });
});

describe('positions planétaires', () => {
  /**
   * Repère astronomique public : la conjonction Uranus–Neptune de 1993, autour
   * de 19° du Capricorne. Un moteur faux la manque de plusieurs degrés.
   */
  it('conjonction Uranus–Neptune de 1993 à ~19° Capricorne', () => {
    const date = new Date('1993-08-06T18:50:00Z');
    const uranus = longitudeOf('uranus', date);
    const neptune = longitudeOf('neptune', date);

    expect(uranus).toBeCloseTo(289.23, 1);
    expect(neptune).toBeCloseTo(289.10, 1);
    expect(Math.abs(uranus - neptune)).toBeLessThan(0.3);
    expect(signOf(uranus)).toBe(9); // Capricorne
  });

  it('le Soleil est à ~14° du Lion le 6 août', () => {
    const sun = longitudeOf('sun', new Date('1993-08-06T18:50:00Z'));
    expect(signOf(sun)).toBe(4); // Lion
    expect(sun % 30).toBeCloseTo(14.3, 1);
  });

  it('Pluton est en Scorpion en 1993 et en Sagittaire en 1996', () => {
    expect(signOf(longitudeOf('pluto', new Date('1993-08-06T18:50:00Z')))).toBe(7);
    expect(signOf(longitudeOf('pluto', new Date('1996-06-01T00:00:00Z')))).toBe(8);
  });

  it('Saturne est rétrograde début août 1993', () => {
    const chart = computeNatalChart(
      resolveBirthInstant({ date: '1993-08-06', time: '20:50', lat: 48.8352, lng: 2.2409 }),
      48.8352, 2.2409,
    );
    expect(chart.points.saturn.retrograde).toBe(true);
    expect(chart.points.sun.retrograde).toBe(false);
  });
});

describe('maisons en signes entiers', () => {
  it('la maison I est le signe entier de l\'Ascendant', () => {
    const asc = 338.2323; // 8°14' Poissons
    expect(wholeSignHouse(330.0, asc)).toBe(1);   // 0° Poissons
    expect(wholeSignHouse(359.9, asc)).toBe(1);   // 29°54' Poissons
    expect(wholeSignHouse(0.1, asc)).toBe(2);     // 0°06' Bélier
    expect(wholeSignHouse(242.14, asc)).toBe(10); // 2°09' Sagittaire
  });

  /**
   * En signes entiers, l'axe ASC/DSC tombe toujours en I et VII — 180° font
   * exactement six signes. Le MC, lui, n'est pas fixé à la maison X : selon la
   * latitude et la saison il tombe en IX, X ou XI. C'est une propriété du
   * système, pas un défaut ; le test vérifie l'invariant réel.
   */
  it('ASC en I, DSC en VII, et l\'axe MC/IC toujours opposé de six maisons', () => {
    const chart = computeNatalChart(
      resolveBirthInstant({ date: '1993-08-06', time: '20:50', lat: 48.8352, lng: 2.2409 }),
      48.8352, 2.2409,
    );
    expect(chart.points.asc.house).toBe(1);
    expect(chart.points.dsc.house).toBe(7);
    expect(chart.points.mc.house).toBeGreaterThanOrEqual(9);
    expect(chart.points.mc.house).toBeLessThanOrEqual(11);
    expect(((chart.points.mc.house + 5) % 12) + 1).toBe(chart.points.ic.house);
  });
});
