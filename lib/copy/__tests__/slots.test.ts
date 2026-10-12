import { describe, expect, it } from 'vitest';
import { allSlots, slotCounts, slotKey, LONG_TARGETS } from '../slots';
import { blockCount, ASPECT_BLOCKS, NATAL_BLOCKS, TRANSIT_BLOCKS, AXIS_BLOCKS } from '../blocks';
import { violatesContentRules } from '../phrase';
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

/**
 * Ce que le corpus n'a pas le droit de contenir.
 *
 * Le rédacteur a fourni, pour Mars, sa signification en astrologie médicale : les
 * défenses de l'organisme face à la maladie. C'est peut-être exact et c'est sans
 * emploi ici — la règle interdit à l'axe Énergie de parler de santé, et une
 * brique est une définition qui finira dans un texte affiché. Le filtre de sortie
 * l'arrêterait, mais mieux vaut qu'il n'ait rien à arrêter.
 */
describe('le corpus respecte les règles de contenu', () => {
  const toutes = [...TRANSIT_BLOCKS, ...ASPECT_BLOCKS, ...NATAL_BLOCKS, ...AXIS_BLOCKS];

  it('ne fait jamais parler l’axe Énergie ni Mars de santé', () => {
    for (const b of toutes) {
      if (b.key !== 'energy' && b.key !== 'mars') continue;
      expect(violatesContentRules('energy', b.draft), `${b.label} : ${b.draft}`).toBeNull();
    }
  });

  it('n’emploie aucune formule de voyance, nulle part', () => {
    for (const b of toutes) {
      expect(violatesContentRules('business', b.draft), b.label).toBeNull();
    }
  });

  /*
   * Consigne de ton du rédacteur : « j'aime pas dire pas bon, on dit plutôt
   * difficile ». Et rien n'est une fatalité : « l'aspect montre qu'il y a
   * difficulté ; à nous de la vaincre ».
   */
  it('dit « difficile », jamais « mauvais », et ne condamne rien', () => {
    for (const b of toutes) {
      const texte = b.draft.toLowerCase();
      for (const mot of ['mauvais', 'néfaste', 'funeste', 'insurmontable', 'irrémédiable']) {
        expect(texte, b.label).not.toContain(mot);
      }
    }
  });

  it('reste court : une brique tient en quarante mots', () => {
    for (const b of toutes) {
      expect(b.draft.trim().split(/\s+/).length, b.label).toBeLessThanOrEqual(45);
    }
  });
});

/**
 * La provenance des briques, tenue à jour.
 *
 * « Les trente-deux briques sont écrites » est vrai et trompeur : douze portent
 * les mots du rédacteur, quinze transposent un mot-clé de planète d'une question
 * vers une autre, et cinq n'ont aucune réponse derrière elles. Le compte est figé
 * ici pour qu'une livraison future le fasse bouger visiblement, au lieu de laisser
 * croire que le corpus est plus solide qu'il n'est.
 */
describe('provenance du corpus', () => {
  const toutes = [...TRANSIT_BLOCKS, ...ASPECT_BLOCKS, ...NATAL_BLOCKS, ...AXIS_BLOCKS];
  const par = (s: string) => toutes.filter((b) => b.source === s).length;

  it('compte douze briques directes, quinze dérivées, cinq inférées', () => {
    expect(par('direct')).toBe(12);
    expect(par('dérivé')).toBe(15);
    expect(par('inféré')).toBe(5);
    expect(toutes).toHaveLength(32);
  });

  /*
   * Les trois axes et les quatre angles durs sont ceux que le produit affiche le
   * plus. Les axes ont été demandés et répondus ; c'est la garantie minimale.
   */
  it('les trois axes portent une réponse directe', () => {
    for (const b of AXIS_BLOCKS) expect(b.source, b.label).toBe('direct');
  });

  /*
   * Le point faible nommé : une planète sert la même matière à deux questions
   * différentes. Le test ne l'interdit pas — il le rend visible, et il tombera
   * le jour où l'une des deux sera vraiment écrite.
   */
  it('nomme les planètes dont le transit et le natal partagent la même source', () => {
    const partagees = TRANSIT_BLOCKS
      .filter((t) => t.source === 'dérivé')
      .filter((t) => NATAL_BLOCKS.find((n) => n.key === t.key)?.source === 'dérivé')
      .map((t) => t.key);
    expect(partagees.sort()).toEqual(
      ['jupiter', 'mars', 'mercury', 'neptune', 'pluto', 'saturn', 'uranus'],
    );
  });
});
