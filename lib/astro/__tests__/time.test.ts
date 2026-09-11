import { describe, expect, it } from 'vitest';
import { formatOffset, resolveBirthInstant, zoneFor } from '../time';
import { addCivilDays, localDateISO, localNoonInstant } from '../zone';

const PARIS = { lat: 48.8566, lng: 2.3522 };
const BOULOGNE = { lat: 48.8352, lng: 2.2409 };
const NEW_YORK = { lat: 40.7128, lng: -74.006 };
const KOLKATA = { lat: 22.5726, lng: 88.3639 };
const SYDNEY = { lat: -33.8688, lng: 151.2093 };

describe('fuseau déduit des coordonnées', () => {
  it('trouve la bonne zone IANA', () => {
    expect(zoneFor(PARIS.lat, PARIS.lng)).toBe('Europe/Paris');
    expect(zoneFor(BOULOGNE.lat, BOULOGNE.lng)).toBe('Europe/Paris');
    expect(zoneFor(KOLKATA.lat, KOLKATA.lng)).toBe('Asia/Kolkata');
    expect(zoneFor(SYDNEY.lat, SYDNEY.lng)).toBe('Australia/Sydney');
  });
});

describe('heure locale de naissance → UTC', () => {
  it('heure d\'hiver en France : UTC+1', () => {
    const r = resolveBirthInstant({ date: '1991-03-14', time: '14:07', ...PARIS });
    expect(r.utcISO).toBe('1991-03-14T13:07:00.000Z');
    expect(r.offsetSeconds).toBe(3600);
    expect(r.anomaly).toBeNull();
    expect(r.precision).toBe('exact');
  });

  it('heure d\'été en France : UTC+2', () => {
    const r = resolveBirthInstant({ date: '1985-07-15', time: '03:30', ...PARIS });
    expect(r.utcISO).toBe('1985-07-15T01:30:00.000Z');
    expect(r.offsetSeconds).toBe(7200);
  });

  it('août 1993 à Boulogne-Billancourt : UTC+2', () => {
    const r = resolveBirthInstant({ date: '1993-08-06', time: '20:50', ...BOULOGNE });
    expect(r.utcISO).toBe('1993-08-06T18:50:00.000Z');
    expect(r.offsetSeconds).toBe(7200);
  });

  /**
   * Réintroduction de l'heure d'été en France : dans la nuit du 28 mars 1976,
   * la transition a lieu à 01:00 heure normale — les horloges passent de 01:00
   * à 02:00. L'heure murale 01:30 n'a donc jamais existé cette nuit-là.
   */
  it('trou de changement d\'heure : signalé, pas ignoré', () => {
    const r = resolveBirthInstant({ date: '1976-03-28', time: '01:30', ...PARIS });
    expect(r.anomaly).toBe('dst-gap');
    expect(r.localTime).toBe('02:30');
    expect(r.utcISO).toBe('1976-03-28T00:30:00.000Z');

    // 02:30 la même nuit existe bel et bien, en heure d'été : aucune anomalie.
    const ok = resolveBirthInstant({ date: '1976-03-28', time: '02:30', ...PARIS });
    expect(ok.anomaly).toBeNull();
    expect(ok.offsetSeconds).toBe(7200);
  });

  /**
   * Retour à l'heure d'hiver aux États-Unis le 29 octobre 2000 : 01:30 est
   * vécu deux fois. On retient la première occurrence et on lève le drapeau.
   */
  it('heure ambiguë : première occurrence retenue et signalée', () => {
    const r = resolveBirthInstant({ date: '2000-10-29', time: '01:30', ...NEW_YORK });
    expect(r.anomaly).toBe('dst-ambiguous');
    expect(r.offsetSeconds).toBe(-4 * 3600);
    expect(r.utcISO).toBe('2000-10-29T05:30:00.000Z');
  });

  /**
   * Test de régression décisif : jusqu'au 11 mars 1911 la France vivait à
   * l'heure moyenne de Paris, UTC+00:09:21. Toute implémentation à offset fixe
   * se trompe ici de 9 minutes 21 secondes, soit 2°20' d'Ascendant.
   */
  it('avant 1911 en France : Paris Mean Time, à la seconde', () => {
    const r = resolveBirthInstant({ date: '1911-02-05', time: '08:00', ...PARIS });
    expect(r.offsetSeconds).toBe(9 * 60 + 21);
    expect(r.utcISO).toBe('1911-02-05T07:50:39.000Z');
  });

  /** Été 1943 : la France occupée vit à l'heure allemande d'été, UTC+2. */
  it('France occupée en 1943 : UTC+2', () => {
    const r = resolveBirthInstant({ date: '1943-06-10', time: '09:00', ...PARIS });
    expect(r.offsetSeconds).toBe(7200);
    expect(r.utcISO).toBe('1943-06-10T07:00:00.000Z');
  });

  it('offset non entier : Inde à UTC+5:30', () => {
    const r = resolveBirthInstant({ date: '1990-01-01', time: '06:00', ...KOLKATA });
    expect(r.offsetSeconds).toBe(5 * 3600 + 1800);
    expect(r.utcISO).toBe('1990-01-01T00:30:00.000Z');
  });

  it('hémisphère sud : heure d\'été australe en janvier', () => {
    const r = resolveBirthInstant({ date: '1990-01-01', time: '06:00', ...SYDNEY });
    expect(r.offsetSeconds).toBe(11 * 3600);
    expect(r.utcISO).toBe('1989-12-31T19:00:00.000Z');
  });

  it('heure inconnue : repli sur midi, précision dégradée', () => {
    const r = resolveBirthInstant({ date: '1993-08-06', time: null, ...BOULOGNE });
    expect(r.precision).toBe('noon-fallback');
    expect(r.localTime).toBe('12:00');
    expect(r.utcISO).toBe('1993-08-06T10:00:00.000Z');
  });

  it('rejette les entrées invalides plutôt que de deviner', () => {
    expect(() => resolveBirthInstant({ date: '06/08/1993', time: '20:50', ...PARIS })).toThrow();
    expect(() => resolveBirthInstant({ date: '1993-08-06', time: '25:00', ...PARIS })).toThrow();
    expect(() => resolveBirthInstant({ date: '1993-08-06', time: '20h50', ...PARIS })).toThrow();
  });
});

describe('affichage de l\'offset', () => {
  it('formate les cas ronds et les cas non ronds', () => {
    expect(formatOffset(3600)).toBe('UTC+1');
    expect(formatOffset(5 * 3600 + 1800)).toBe('UTC+5:30');
    expect(formatOffset(9 * 60 + 21)).toBe('UTC+0:09:21');
    expect(formatOffset(-5 * 3600)).toBe('UTC−5');
  });
});

describe('itération des jours', () => {
  it('avance dans le calendrier civil, changement d\'heure inclus', () => {
    expect(addCivilDays('2026-09-09', 89)).toBe('2026-12-07');
    expect(addCivilDays('2026-10-24', 2)).toBe('2026-10-26'); // week-end du changement d'heure
    expect(addCivilDays('2028-02-28', 1)).toBe('2028-02-29'); // année bissextile
  });

  it('midi local reste midi local de part et d\'autre du changement d\'heure', () => {
    for (const date of ['2026-10-24', '2026-10-25', '2026-10-26']) {
      const noon = localNoonInstant('Europe/Paris', date);
      expect(localDateISO('Europe/Paris', noon)).toBe(date);
      expect(new Date(noon).toISOString()).toMatch(/T1[01]:00:00/);
    }
  });
});
