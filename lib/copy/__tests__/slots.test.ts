import { describe, expect, it } from 'vitest';
import { allSlots, slotCounts, slotKey, LONG_TARGETS } from '../slots';
import { blockCount, ASPECT_BLOCKS, NATAL_BLOCKS, TRANSIT_BLOCKS, AXIS_BLOCKS } from '../blocks';
import { selectExemplars } from '../exemplars';
import { AXIS_IDS, AXIS_NATALS, AXIS_TRANSITS } from '../../astro/transits';
import { ASPECT_IDS } from '../../astro/aspects';
import { LONG_BODIES } from '../../astro/backdrop';
import { PLANETS, ANGLE_IDS } from '../../astro/natal';

describe('emplacements de texte', () => {
  const slots = allSlots();

  it('couvre exactement les combinaisons que le moteur peut produire', () => {
    let expected = 0;
    for (const axis of AXIS_IDS) {
      expected += AXIS_TRANSITS[axis].length * AXIS_NATALS[axis].length * ASPECT_IDS.length;
    }
    expected += LONG_BODIES.length * LONG_TARGETS.length * ASPECT_IDS.length;
    expect(slots).toHaveLength(expected);
    expect(slotCounts().total).toBe(expected);
  });

  it('n\'a aucune clé en double', () => {
    expect(new Set(slots.map((s) => s.key)).size).toBe(slots.length);
  });

  it('la clé encode le périmètre, faute de quoi un même aspect aurait un seul texte pour deux axes', () => {
    expect(slotKey('business', 'sun', 'square', 'sun')).not.toBe(slotKey('energy', 'sun', 'square', 'sun'));
    expect(slots.some((s) => s.key === 'business:sun:square:sun')).toBe(true);
    expect(slots.some((s) => s.key === 'energy:sun:square:sun')).toBe(true);
  });

  it('donne une périodicité aux seuls transits longs', () => {
    for (const s of slots) {
      if (s.scope === 'long') expect(s.recurrence).toBeTruthy();
      else expect(s.recurrence).toBeNull();
    }
  });
});

describe('briques', () => {
  it('couvre chaque planète, chaque aspect, chaque point natal et chaque axe', () => {
    expect(TRANSIT_BLOCKS.map((b) => b.key).sort()).toEqual([...PLANETS].sort());
    expect(ASPECT_BLOCKS.map((b) => b.key).sort()).toEqual([...ASPECT_IDS].sort());
    expect(NATAL_BLOCKS.map((b) => b.key).sort()).toEqual([...PLANETS, ...ANGLE_IDS].sort());
    expect(AXIS_BLOCKS.map((b) => b.key).sort()).toEqual([...AXIS_IDS].sort());
    expect(blockCount()).toBe(32);
  });

  it('chaque brique porte une question et une amorce', () => {
    for (const b of [...TRANSIT_BLOCKS, ...ASPECT_BLOCKS, ...NATAL_BLOCKS, ...AXIS_BLOCKS]) {
      expect(b.prompt.length).toBeGreaterThan(10);
      expect(b.draft.length).toBeGreaterThan(10);
    }
  });

  it('l\'axe Énergie porte la règle d\'interdiction médicale dans sa brique', () => {
    const energy = AXIS_BLOCKS.find((b) => b.key === 'energy')!;
    expect(energy.prompt.toLowerCase()).toContain('santé');
  });
});

describe('choix des exemples', () => {
  const ranked = allSlots().map((slot, i) => ({ slot, priority: 1 / (i + 1) }));
  const exemplars = selectExemplars(ranked, 60);

  it('rend le nombre demandé, sans doublon', () => {
    expect(exemplars).toHaveLength(60);
    expect(new Set(exemplars.map((s) => s.key)).size).toBe(60);
  });

  /**
   * Les exemples servent de modèle au modèle qui composera les 495 autres :
   * leur seule justification est de couvrir un maximum de combinaisons.
   */
  it('couvre toutes les planètes, tous les aspects et tous les périmètres', () => {
    expect(new Set(exemplars.map((s) => s.aspect)).size).toBe(ASPECT_IDS.length);
    expect(new Set(exemplars.map((s) => s.scope)).size).toBe(4);
    const transits = new Set(exemplars.map((s) => s.transit));
    for (const p of PLANETS) expect(transits.has(p)).toBe(true);
    const natals = new Set(exemplars.map((s) => s.natal));
    expect(natals.size).toBeGreaterThanOrEqual(9);
  });

  it('couvre la majorité des couples planète × aspect possibles', () => {
    const pairs = new Set(exemplars.map((s) => `${s.transit}|${s.aspect}`));
    expect(pairs.size).toBeGreaterThanOrEqual(45);
  });
});
