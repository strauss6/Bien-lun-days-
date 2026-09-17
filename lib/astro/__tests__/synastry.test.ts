import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ACTOR_WEIGHT, RECEIVER_WEIGHT, computeSynastry, geometricPair, isMajorTension } from '../synastry';
import { referenceChart } from './fixtures';
import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import { ANGLE_IDS, PLANETS } from '../natal';
import type { BirthInput } from '../types';

const a = referenceChart();

/** Une deuxième personne, née ailleurs et un autre jour. */
const AUTRE: BirthInput = { date: '1996-02-14', time: '07:15', lat: 43.2965, lng: 5.3698 };
const b = computeNatalChart(resolveBirthInstant(AUTRE), AUTRE.lat, AUTRE.lng);

const sansHeure = computeNatalChart(
  resolveBirthInstant({ ...AUTRE, time: null }),
  AUTRE.lat,
  AUTRE.lng,
);

const duo = computeSynastry(a, b);

describe('la croix de deux thèmes', () => {
  it('regarde les deux sens, parce qu’ils ne disent pas la même chose', () => {
    expect(duo.links.some((l) => l.direction === 'a-to-b')).toBe(true);
    expect(duo.links.some((l) => l.direction === 'b-to-a')).toBe(true);
  });

  it('couvre les dix planètes vers les quatorze points, angles compris', () => {
    expect(duo.anglesUsed).toBe(true);
    const recus = new Set(duo.links.map((l) => l.receiver));
    // Tous les points ne forment pas forcément un aspect ; les angles doivent
    // au moins être candidats, sinon la comparaison rate l'Ascendant.
    expect(Object.keys(RECEIVER_WEIGHT).sort()).toEqual([...PLANETS, ...ANGLE_IDS].sort());
    expect(Object.keys(ACTOR_WEIGHT).sort()).toEqual([...PLANETS].sort());
    expect(recus.size).toBeGreaterThan(4);
  });

  it('est symétrique dans l’ordre des personnes', () => {
    /*
     * Le ciel ne sait pas qui a ouvert l'application. Inverser les deux personnes
     * doit rendre exactement les mêmes liens, avec le sens de lecture retourné —
     * sauf pour les configurations mutuelles, qui n'ont pas de sens de lecture.
     */
    const inverse = computeSynastry(b, a);
    const cle = (l: { actor: string; receiver: string; aspect: string; direction: string; mutual: boolean }) =>
      `${l.mutual ? '=' : l.direction === 'a-to-b' ? 'X' : 'Y'}|${l.actor}|${l.receiver}|${l.aspect}`;
    const gauche = duo.links.map((l) =>
      cle({ ...l, direction: l.direction === 'a-to-b' ? 'b-to-a' : 'a-to-b' }));
    expect(new Set(inverse.links.map(cle))).toEqual(new Set(gauche));
  });

  it('nomme les configurations mutuelles au lieu de leur inventer un sens', () => {
    for (const lien of duo.links) {
      expect(lien.mutual).toBe(lien.actor === lien.receiver);
      // Convention : une mutuelle n'est émise qu'une fois, côté A.
      if (lien.mutual) expect(lien.direction).toBe('a-to-b');
    }
  });

  /* Les deux défauts de géométrie corrigés le 17 septembre. */
  it('ne compte jamais un axe par ses deux extrémités', () => {
    for (const lien of duo.links) {
      const miroir = { asc: 'dsc', dsc: 'asc', mc: 'ic', ic: 'mc' }[lien.receiver as string];
      if (!miroir) continue;
      const jumeau = duo.links.find(
        (l) => l !== lien && l.actor === lien.actor && l.direction === lien.direction && l.receiver === miroir,
      );
      expect(jumeau, `${lien.actor} compté sur ${lien.receiver} et sur ${miroir}`).toBeUndefined();
    }
    // Et une opposition à l'Ascendant se dit conjonction au Descendant.
    expect(duo.links.some((l) => l.receiver === 'asc' && l.aspect === 'opposition')).toBe(false);
    expect(duo.links.some((l) => l.receiver === 'mc' && l.aspect === 'opposition')).toBe(false);
  });

  it('ne garde qu’un lien par paire de points', () => {
    const cles = duo.links.map(geometricPair);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('ne se contredit pas : un même contact n’est jamais dans les deux colonnes', () => {
    const portent = new Set(duo.supports.map(geometricPair));
    for (const f of duo.frictions) expect(portent.has(geometricPair(f))).toBe(false);
  });

  it('classe ce qui porte et ce qui frotte, trois de chaque au plus', () => {
    expect(duo.supports.length).toBeLessThanOrEqual(3);
    expect(duo.frictions.length).toBeLessThanOrEqual(3);
    expect(duo.supports.every((l) => l.strength > 0)).toBe(true);
    expect(duo.frictions.every((l) => l.strength < 0)).toBe(true);
    // Le plus fort d'abord, dans les deux listes.
    for (const liste of [duo.supports, duo.frictions]) {
      const forces = liste.map((l) => Math.abs(l.strength));
      expect([...forces].sort((x, y) => y - x)).toEqual(forces);
    }
  });

  /*
   * La règle du rédacteur, mot pour mot : « le Saturne de l'un opposé au Pluton,
   * au Saturne ou au Soleil de l'autre ; Saturne, Pluton ou Uranus en aspect
   * difficile au Soleil de l'autre. »
   */
  it('signale exactement les configurations que le rédacteur nomme', () => {
    expect(isMajorTension('saturn', 'opposition', 'pluto')).toBe(true);
    expect(isMajorTension('saturn', 'opposition', 'saturn')).toBe(true);
    expect(isMajorTension('saturn', 'opposition', 'sun')).toBe(true);
    expect(isMajorTension('pluto', 'square', 'sun')).toBe(true);
    expect(isMajorTension('uranus', 'opposition', 'sun')).toBe(true);

    // Et rien d'autre : ni les angles doux, ni les mêmes planètes ailleurs.
    expect(isMajorTension('saturn', 'trine', 'sun')).toBe(false);
    expect(isMajorTension('saturn', 'opposition', 'moon')).toBe(false);
    expect(isMajorTension('pluto', 'square', 'moon')).toBe(false);
    expect(isMajorTension('venus', 'square', 'sun')).toBe(false);
    expect(isMajorTension('neptune', 'square', 'sun')).toBe(false);
  });

  it('les tensions majeures sont bien dans les liens, toutes', () => {
    expect(duo.tensions.every((l) => duo.links.includes(l))).toBe(true);
    expect(duo.tensions).toEqual(duo.links.filter((l) => l.majorTension));
  });

  /*
   * « Ce ne sont pas les signes, ce sont surtout les planètes d'un thème par
   * rapport à l'autre. » Le signe solaire est précisément ce que le produit
   * combat : le moteur de comparaison ne doit pas le lire du tout.
   */
  it('ne lit jamais le signe', () => {
    const source = readFileSync(new URL('../synastry.ts', import.meta.url), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/\.sign\b/);
    expect(code).not.toMatch(/degInSign/);
  });

  it('est déterministe', () => {
    expect(computeSynastry(a, b)).toEqual(computeSynastry(a, b));
  });

  /*
   * Une heure de naissance manquante rend l'Ascendant inexploitable. La règle du
   * produit veut qu'une limite qui change un résultat soit dite ; encore faut-il
   * que le moteur la remonte.
   */
  it('sans heure de naissance, écarte les angles et le signale', () => {
    const ampute = computeSynastry(a, sansHeure);
    expect(ampute.anglesUsed).toBe(false);
    expect(ampute.links.some((l) => (ANGLE_IDS as string[]).includes(l.receiver))).toBe(false);
  });

  it('un thème comparé à lui-même ne rend que des conjonctions à zéro degré', () => {
    const miroir = computeSynastry(a, a);
    const propres = miroir.links.filter((l) => l.actor === l.receiver);
    expect(propres.length).toBeGreaterThan(0);
    for (const l of propres) {
      expect(l.aspect).toBe('conjunction');
      expect(l.orb).toBeLessThan(1e-6);
    }
  });

  it('porte sa version de méthode', () => {
    expect(duo.method).toBe('croix-v1');
  });
});

describe('le thème de référence comparé à une autre personne', () => {
  it('trouve de quoi remplir les deux listes', () => {
    expect(duo.supports.length).toBe(3);
    expect(duo.frictions.length).toBe(3);
  });

  it('ne dépend pas de la date du jour', () => {
    // Aucun appel à l'horloge : le même couple donne le même résultat demain.
    const source = readFileSync(new URL('../synastry.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Date\.now|new Date\(\)/);
  });
});

/** Ce que le moteur trouve réellement, gardé sous les yeux. */
it('sortie lisible pour la revue', () => {
  const ligne = (l: typeof duo.links[number]) =>
    `${l.direction === 'a-to-b' ? 'A→B' : 'B→A'} ${l.actor} ${l.aspect} ${l.receiver} `
    + `orbe ${l.orb.toFixed(2)}° force ${l.strength.toFixed(3)}${l.majorTension ? ' ⚠' : ''}`;
  expect(duo.supports.map(ligne).concat(duo.frictions.map(ligne)).length).toBe(6);
});
