import { describe, expect, it } from 'vitest';
import { comparisonsTested } from '@/lib/astro/transits';
import { referenceChart } from '@/lib/astro/__tests__/fixtures';
import { ReadingRequest, buildReading } from '../reading';

const NOMINAL = {
  firstName: 'Elioth',
  birthDate: '1993-08-06',
  birthTime: '20:40',
  lat: 48.8352,
  lng: 2.2409,
  city: 'Boulogne-Billancourt',
  country: 'FR',
  priorityAxis: 'business',
  startDate: '2026-09-10',
} as const;

describe('validation de la demande', () => {
  it('accepte une demande complète', () => {
    expect(ReadingRequest.safeParse(NOMINAL).success).toBe(true);
  });

  it('refuse ce qui rendrait le thème faux, avec un message utilisable', () => {
    const cases: Array<[string, unknown]> = [
      ['date au format français', { ...NOMINAL, birthDate: '06/08/1993' }],
      ['heure impossible', { ...NOMINAL, birthTime: '25:00' }],
      ['latitude hors du globe', { ...NOMINAL, lat: 120 }],
      ['prénom vide', { ...NOMINAL, firstName: '' }],
      ['axe inconnu', { ...NOMINAL, priorityAxis: 'argent' }],
      ['date de naissance dans le futur', { ...NOMINAL, birthDate: '2099-01-01' }],
    ];
    for (const [label, input] of cases) {
      const parsed = ReadingRequest.safeParse(input);
      expect(parsed.success, label).toBe(false);
      if (!parsed.success) expect(parsed.error.issues[0].message.length, label).toBeGreaterThan(3);
    }
  });

  /*
   * Règle du 11 octobre 2026 : l'heure est obligatoire. Elle se tient dans le
   * contrat et pas seulement dans le questionnaire — un schéma qui accepte encore
   * l'absence d'heure finit par la recevoir, par un brouillon d'avant la règle ou
   * par un appel direct à l'API.
   */
  it('refuse une demande sans heure de naissance', () => {
    for (const heure of [null, undefined, '', '25:00']) {
      const parsed = ReadingRequest.safeParse({ ...NOMINAL, birthTime: heure });
      expect(parsed.success, `heure ${JSON.stringify(heure)}`).toBe(false);
    }
    expect(ReadingRequest.safeParse({ ...NOMINAL, birthTime: '20:40' }).success).toBe(true);
  });
});

describe('calcul complet', () => {
  const payload = buildReading(ReadingRequest.parse(NOMINAL));

  it('rend un objet entièrement sérialisable', () => {
    expect(() => JSON.parse(JSON.stringify(payload))).not.toThrow();
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });

  it('porte les trente jours, chacun avec ses trois axes et deux aspects', () => {
    expect(payload.days).toHaveLength(30);
    expect(payload.days[0].date).toBe('2026-09-10');
    for (const day of payload.days) {
      for (const axis of ['business', 'love', 'energy'] as const) {
        const a = day.axes[axis];
        expect(a.score).toBeGreaterThanOrEqual(0);
        expect(a.score).toBeLessThanOrEqual(100);
        expect(a.explaining.length).toBeLessThanOrEqual(2);
        expect(a.phrase.length).toBeGreaterThan(10);
        // Le glyphe du pic dit où est la planète, donc il faut son signe.
        if (a.explaining.length) {
          expect(a.peakSign).toBeGreaterThanOrEqual(0);
          expect(a.peakSign).toBeLessThan(12);
        } else {
          expect(a.peakSign).toBeNull();
        }
        for (const e of a.explaining) {
          expect(e.notation).toMatch(/\S \S \S/);
          // Le possessif s'accorde : « ton Soleil », « ta Lune », « ta Vénus ».
          expect(e.phrase).toMatch(/ à (ton|ta) /);
          expect(['+', '−']).toContain(e.sign);
        }
      }
    }
  });

  it('porte le thème sous une forme affichable par l\'écran de calcul', () => {
    expect(payload.chart.sun).toContain('Lion');
    expect(payload.chart.asc).toContain('Verseau');
    expect(payload.chart.utcISO).toBe('1993-08-06T18:40:00.000Z');
    expect(payload.chart.offset).toBe('UTC+2');
    // 49 paires uniques × 5 aspects × 30 jours. C'était 48 × 5 × 30 tant que le
    // compte additionnait les paires par axe sans retirer les doublons, et avant
    // que la Lune ne vise l'ensemble du thème pour le score global du jour.
    /*
     * Compté sur **ce thème-ci** et non sur la liste générique : depuis que les
     * maîtres de maison entrent dans les poids, le nombre de paires dépend du
     * signe ascendant. Le chiffre montré à l'écran de calcul est présenté comme
     * un fait — il doit donc être celui du thème calculé, pas une moyenne.
     */
    expect(payload.stats.comparisonsTested).toBe(comparisonsTested(30, referenceChart()));
  });

  it('porte les jours rares, avec l\'âge à la dernière occurrence', () => {
    const jupiter = payload.rare.find((r) => r.notation.startsWith('♃'));
    expect(jupiter).toBeDefined();
    expect(jupiter!.previousAge).toBe(21);
    expect(jupiter!.nextYear).toBe(2038);
  });

  /*
   * Le corollaire de l'heure obligatoire : tout rapport porte désormais ses
   * angles. C'est ce que l'heure exacte achète, et c'est tout l'argument de vente
   * du produit — sur ce thème, la calculer sur midi déplaçait l'Ascendant du
   * Verseau à la Balance.
   */
  it('porte toujours un Ascendant et un Milieu du Ciel exacts', () => {
    expect(payload.birth.precision).toBe('exact');
    expect(payload.chart.asc).toMatch(/\d+°\d+' \w+/);
    expect(payload.chart.mc).toMatch(/\d+°\d+' \w+/);
  });

  it('ordonne les axes selon ce qui compte pour la personne', () => {
    expect(payload.axisOrder[0]).toBe('business');
    const love = buildReading(ReadingRequest.parse({ ...NOMINAL, priorityAxis: 'love' }));
    expect(love.axisOrder[0]).toBe('love');
    expect(love.axisOrder).toHaveLength(3);
  });
});

describe('dates civiles et fuseau de résidence', () => {
  it.each(['2026-02-31', '2025-02-29', '2026-04-31', '2026-00-10'])('refuse la date impossible %s', (date) => {
    for (const field of ['birthDate', 'startDate']) {
      expect(ReadingRequest.safeParse({ ...NOMINAL, [field]: date }).success).toBe(false);
    }
  });

  it('accepte le 29 février pendant une année bissextile', () => {
    expect(ReadingRequest.safeParse({ ...NOMINAL, birthDate: '2000-02-29' }).success).toBe(true);
  });

  it('refuse un fuseau inconnu avant le calcul', () => {
    expect(ReadingRequest.safeParse({ ...NOMINAL, zone: 'Paris/inconnu' }).success).toBe(false);
    expect(ReadingRequest.safeParse({ ...NOMINAL, zone: 'Europe/Paris' }).success).toBe(true);
  });
});
