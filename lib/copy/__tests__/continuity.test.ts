import { describe, expect, it } from 'vitest';
import {
  NOTABLE_CHANGE, PERSISTENT_RUN, continuityClause, continuityOf, movementOf, runLength,
} from '../continuity';
import type { AxisDay, DayAspect } from '@/lib/astro/types';

const aspect = (over: Partial<DayAspect> = {}): DayAspect => ({
  transit: 'jupiter', aspect: 'trine', natal: 'sun',
  orb: 2, exactness: 0.8, peaking: false, retrograde: false, contribution: 1,
  ...over,
} as DayAspect);

const day = (score: number, explaining: DayAspect[]): AxisDay => ({
  day: 0, date: '2026-09-11', score, raw: 0, significance: score,
  aspects: explaining, explaining: explaining.slice(0, 2),
} as AxisDay);

describe('mouvement d’un aspect', () => {
  it('commence quand la veille ne le portait pas', () => {
    expect(movementOf(aspect(), undefined, aspect({ orb: 1 }))).toBe('commence');
  });

  it('culmine le jour de l’exact, tel que le moteur l’a marqué', () => {
    expect(movementOf(aspect({ peaking: true }), aspect({ orb: 3 }), aspect({ orb: 1 }))).toBe('culmine');
  });

  it('se prolonge tant que l’orbe se resserre', () => {
    expect(movementOf(aspect({ orb: 2 }), aspect({ orb: 3 }), aspect({ orb: 1 }))).toBe('se-prolonge');
  });

  it('s’atténue quand l’orbe s’ouvre, ou quand le lendemain ne le porte plus', () => {
    expect(movementOf(aspect({ orb: 3 }), aspect({ orb: 2 }), aspect({ orb: 4 }))).toBe('s-attenue');
    expect(movementOf(aspect(), aspect({ orb: 1 }), undefined)).toBe('s-attenue');
  });

  it('ne dit rien d’un jour sans aspect', () => {
    expect(movementOf(undefined, aspect(), aspect())).toBeNull();
  });

  /*
   * Le piège que le brief nomme : deux aspects différents à la suite ne sont pas
   * le même événement qui se prolonge. Sans comparaison d'identité, un carré de
   * Mars succédant à un trigone de Jupiter passerait pour « ça continue ».
   */
  it('ne confond pas deux aspects différents qui se suivent', () => {
    expect(movementOf(aspect(), aspect({ transit: 'mars', aspect: 'square' }), undefined))
      .toBe('commence');
  });
});

describe('durée d’une tendance', () => {
  const même = [day(60, [aspect()]), day(62, [aspect()]), day(65, [aspect()]), day(63, [aspect()])];

  it('compte les jours consécutifs du même aspect', () => {
    expect(runLength(même, 0)).toBe(1);
    expect(runLength(même, 3)).toBe(4);
  });

  it('repart à un quand l’aspect change', () => {
    const suite = [...même, day(40, [aspect({ transit: 'saturn', aspect: 'square' })])];
    expect(runLength(suite, 4)).toBe(1);
  });
});

describe('ce que le produit dit du jour', () => {
  it('assume une tendance qui dure au lieu d’inventer du neuf', () => {
    const jours = Array.from({ length: 5 }, (_, i) => day(60 + i, [aspect()]));
    const c = continuityOf(jours, 4);
    expect(c.runDays).toBe(5);
    expect(c.runDays).toBeGreaterThanOrEqual(PERSISTENT_RUN);
    expect(continuityClause(c)).toBe('Ça dure depuis 5 jours.');
  });

  it('signale un écart net avec la veille', () => {
    const jours = [day(40, [aspect()]), day(40 + NOTABLE_CHANGE, [aspect({ transit: 'venus' })])];
    const c = continuityOf(jours, 1);
    expect(c.changeFromYesterday).toBe(NOTABLE_CHANGE);
    expect(c.notable).toBe(true);
    expect(continuityClause(c)).toBe('Nettement mieux qu’hier.');
  });

  it('se tait quand il n’y a rien à signaler', () => {
    const jours = [day(50, [aspect({ orb: 3 })]), day(52, [aspect({ orb: 2 })]), day(53, [aspect({ orb: 1 })])];
    const c = continuityOf(jours, 1);
    expect(c.notable).toBe(false);
    // L'orbe se resserre : l'aspect se prolonge, et se prolonger sans durer
    // encore ne mérite aucune phrase.
    expect(continuityClause(c)).toBeNull();
  });

  it('n’invente aucun écart le premier jour de la série', () => {
    expect(continuityOf([day(50, [aspect()])], 0).changeFromYesterday).toBeNull();
  });

  /*
   * Le dernier jour de la fenêtre n'a pas de lendemain calculé. Sans garde, tout
   * rapport se terminait sur « ça se relâche » — une phrase fausse, écrite pour
   * tout le monde le même jour, c'est-à-dire exactement le texte générique que
   * la direction produit interdit.
   */
  it('ne conclut pas à l’essoufflement faute de lendemain calculé', () => {
    const jours = [day(50, [aspect({ orb: 3 })]), day(55, [aspect({ orb: 2 })])];
    expect(continuityOf(jours, 1).movement).toBe('se-prolonge');
    expect(movementOf(aspect({ orb: 2 }), aspect({ orb: 3 }), undefined, false)).toBe('se-prolonge');
  });
});
