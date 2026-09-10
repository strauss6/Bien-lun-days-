import { describe, expect, it } from 'vitest';
import { computeLongTransits, rarityOf, ORBITAL_YEARS } from '../backdrop';
import { chartRuler, rulerOfHouse, rulerOfSign, signOfHouse } from '../rulers';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import { ASPECTS } from '../aspects';
import { REFERENCE_BIRTH, referenceChart } from './fixtures';

const BIRTH = REFERENCE_BIRTH;
const chart = referenceChart();
const long = computeLongTransits({ chart, startDate: '2026-09-10' });

describe('transits longs', () => {
  it('ne retient que des aspects réellement dans l\'orbe pendant la fenêtre', () => {
    expect(long.length).toBeGreaterThan(5);
    for (const t of long) {
      expect(t.orbInWindow).toBeLessThanOrEqual(ASPECTS[t.aspect].orb);
    }
  });

  it('classe du plus rare au plus courant', () => {
    for (let i = 1; i < long.length; i += 1) {
      expect(long[i - 1].recurrenceYears).toBeGreaterThanOrEqual(long[i].recurrenceYears);
    }
  });

  /**
   * Contrôle croisé avec la lecture faite indépendamment par un astrologue sur
   * ce thème : Pluton arrive sur l'Ascendant, Saturne est en trigone au Soleil,
   * Jupiter en conjonction au Soleil. Les trois doivent sortir du moteur seul.
   */
  it('retrouve les trois transits identifiés par un astrologue sur ce thème', () => {
    const find = (transit: string, aspect: string, natal: string) =>
      long.find((t) => t.transit === transit && t.aspect === aspect && t.natal === natal);

    // L'orbe dépend de la minute de naissance — 2°19' à 20h40, 0°55' à 20h50 —
    // ce qui est exactement la thèse du produit. L'aspect, lui, tient dans les
    // deux cas : c'est pour ça qu'on l'assortit à l'orbe de la conjonction.
    const pluto = find('pluto', 'conjunction', 'asc');
    expect(pluto).toBeDefined();
    expect(pluto!.orbInWindow).toBeLessThan(ASPECTS.conjunction.orb);
    expect(pluto!.orbInWindow).toBeLessThan(3);
    expect(pluto!.rarity).toBe('once');

    const saturn = find('saturn', 'trine', 'sun');
    expect(saturn).toBeDefined();
    expect(saturn!.orbInWindow).toBeLessThan(2);

    const jupiter = find('jupiter', 'conjunction', 'sun');
    expect(jupiter).toBeDefined();
    expect(jupiter!.exactDate).toBe('2026-09-03');
  });

  it('sans heure de naissance, ne parle jamais des axes', () => {
    const noon = computeNatalChart(resolveBirthInstant({ ...BIRTH, time: null }), BIRTH.lat, BIRTH.lng);
    const t = computeLongTransits({ chart: noon, startDate: '2026-09-10' });
    expect(t.some((x) => x.natal === 'asc' || x.natal === 'mc')).toBe(false);
  });

  it('la rareté suit la période orbitale', () => {
    expect(rarityOf('pluto')).toBe('once');
    expect(rarityOf('uranus')).toBe('once');
    expect(rarityOf('saturn')).toBe('generation');
    expect(rarityOf('jupiter')).toBe('decade');
    expect(ORBITAL_YEARS.pluto).toBeGreaterThan(ORBITAL_YEARS.neptune);
  });
});

describe('maîtrises', () => {
  /**
   * Mêmes attributions que celles employées par l'astrologue sur ce thème :
   * maître du thème Uranus, maison XI Jupiter, maison X Pluton, maison IV Vénus.
   */
  it('retrouve les maîtrises citées dans la lecture de référence', () => {
    expect(chartRuler(chart)).toBe('uranus');
    expect(rulerOfHouse(chart, 11)).toBe('jupiter');
    expect(rulerOfHouse(chart, 10)).toBe('pluto');
    expect(rulerOfHouse(chart, 4)).toBe('venus');
    expect(rulerOfHouse(chart, 7)).toBe('sun');
  });

  it('le jeu traditionnel diffère uniquement sur les trois modernes', () => {
    expect(rulerOfSign(10, 'modern')).toBe('uranus');      // Verseau
    expect(rulerOfSign(10, 'traditional')).toBe('saturn');
    expect(rulerOfSign(7, 'modern')).toBe('pluto');        // Scorpion
    expect(rulerOfSign(7, 'traditional')).toBe('mars');
    expect(rulerOfSign(4, 'modern')).toBe('sun');          // Lion, identique
    expect(rulerOfSign(4, 'traditional')).toBe('sun');
  });

  it('les douze maisons couvrent les douze signes, sans trou ni doublon', () => {
    const signs = Array.from({ length: 12 }, (_, i) => signOfHouse(chart, i + 1));
    expect(new Set(signs).size).toBe(12);
  });
});
