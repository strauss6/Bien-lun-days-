import { describe, expect, it } from 'vitest';
import { RELATION_BLOCKS, linkAdvice, linkTitle, tensionNote } from '../relation';
import { ASPECT_IDS } from '@/lib/astro/aspects';
import { ANGLE_IDS, PLANETS } from '@/lib/astro/natal';
import type { SynastryLink } from '@/lib/astro/synastry';
import type { AspectId, PlanetId, PointId } from '@/lib/astro/types';

const NOM = 'Marie';
const RECEVEURS: PointId[] = [...PLANETS, ...ANGLE_IDS];

const lien = (
  actor: PlanetId,
  receiver: PointId,
  aspect: AspectId,
  direction: 'a-to-b' | 'b-to-a',
  strength: number,
): SynastryLink => ({
  direction, actor, receiver, aspect, orb: 1, exactness: 0.8, strength,
  majorTension: false, mutual: actor === receiver,
});

/** Toutes les combinaisons que le moteur peut produire, dans les deux sens. */
function tousLesTextes(): Array<{ titre: string; conseil: string; l: SynastryLink }> {
  const out = [];
  for (const actor of PLANETS) {
    for (const receiver of RECEVEURS) {
      for (const aspect of ASPECT_IDS) {
        for (const direction of ['a-to-b', 'b-to-a'] as const) {
          // Un angle n'agit jamais : il ne peut être que receveur.
          if (direction === 'b-to-a' && actor === receiver) continue;
          for (const strength of [0.5, -0.5]) {
            const l = lien(actor, receiver, aspect, direction, strength);
            out.push({ titre: linkTitle(l, NOM), conseil: linkAdvice(l, NOM), l });
          }
        }
      }
    }
  }
  return out;
}

const textes = tousLesTextes();

describe('les briques de relation', () => {
  it('couvre les dix planètes, en trois voix', () => {
    expect(RELATION_BLOCKS.map((b) => b.key).sort()).toEqual([...PLANETS].sort());
    for (const b of RELATION_BLOCKS) {
      for (const champ of [b.yours.carries, b.yours.rubs, b.yours.doThis, b.yours.avoidThis,
        b.theirs.carries, b.theirs.rubs, b.theirs.doThis, b.theirs.avoidThis,
        b.both.carries, b.both.rubs]) {
        expect(champ.length, `${b.key} : champ vide`).toBeGreaterThan(10);
      }
    }
  });

  /*
   * La provenance se déclare. Aucune brique n'est `direct` : le rédacteur n'a pas
   * été interrogé planète par planète sur la relation. Le jour où il le sera, ce
   * test changera — et c'est justement à ça qu'il sert.
   */
  it('ne se présente jamais comme de la parole d’auteur', () => {
    expect(RELATION_BLOCKS.every((b) => b.source !== 'direct')).toBe(true);
    expect(RELATION_BLOCKS.filter((b) => b.source === 'dérivé').map((b) => b.key)).toEqual(['saturn']);
  });
});

describe('les textes de comparaison', () => {
  it('sont tous produits, et tiennent dans le budget de densité', () => {
    for (const { titre, conseil } of textes) {
      expect(titre.length).toBeGreaterThan(5);
      expect(conseil.length).toBeGreaterThan(20);
      expect(conseil.trim().split(/\s+/).length, conseil).toBeLessThanOrEqual(45);
    }
  });

  /*
   * Le genre n'est demandé à personne, donc il n'est écrit nulle part — ni celui
   * du lecteur, ni celui de l'autre. Pas de pronom de troisième personne, et
   * aucun accord qui trancherait à notre place.
   */
  it('ne présument du genre de personne', () => {
    for (const { titre, conseil } of textes) {
      const texte = `${titre} ${conseil}`;
      expect(texte, texte).not.toMatch(/\b(il|elle|ils|elles|lui)\b/i);
      expect(texte, texte).not.toMatch(/\b(seule?|connue?|prête?|sûre?)\b/i);
      // Le point médian est une réponse au problème, pas celle de ce produit.
      expect(texte, texte).not.toMatch(/·/);
    }
  });

  /*
   * Les règles de contenu du projet, appliquées à la relation : rien n'est une
   * fatalité, aucun texte ne conseille de renoncer à quelqu'un, et « mauvais » ne
   * s'écrit pas.
   */
  it('n’annoncent aucune fatalité et ne conseillent jamais de renoncer', () => {
    for (const { titre, conseil } of textes) {
      const texte = `${titre} ${conseil}`;
      expect(texte, texte).not.toMatch(/\b(mauvais|néfaste|funeste|insurmontable|irrémédiable|rédhibitoire)/i);
      expect(texte, texte).not.toMatch(/\b(quitte|quitter|romps|rompre|fuis|fuir|éloigne-toi|passe ton chemin)\b/i);
      expect(texte, texte).not.toMatch(/\b(incompatible|voué|condamné)/i);
    }
  });

  it('ne donnent jamais de conseil médical ni de formule de voyance', () => {
    for (const { conseil } of textes) {
      expect(conseil, conseil).not.toMatch(/\b(symptôme|traitement|diagnostic|opération|maladie)\b/i);
      expect(conseil, conseil).not.toMatch(/les astres|l’univers t’envoie|énergies négatives/i);
    }
  });

  /* Le défaut du 17 septembre : le conseil désignait la mauvaise personne. */
  it('désignent la bonne personne selon qui agit', () => {
    const mien = linkAdvice(lien('pluto', 'moon', 'trine', 'b-to-a', 0.5), NOM);
    expect(mien).toContain('ta sensibilité');
    expect(mien).not.toContain(`la sensibilité de ${NOM}`);

    const sien = linkAdvice(lien('sun', 'moon', 'trine', 'a-to-b', 0.5), NOM);
    expect(sien).toContain(`la sensibilité de ${NOM}`);
    expect(sien).not.toContain('ta sensibilité');
  });

  it('accordent les articles au genre du point', () => {
    expect(linkTitle(lien('sun', 'moon', 'trine', 'a-to-b', 1), NOM)).toContain('à la Lune');
    expect(linkTitle(lien('sun', 'moon', 'trine', 'b-to-a', 1), NOM)).toContain('à ta Lune');
    expect(linkTitle(lien('sun', 'asc', 'trine', 'a-to-b', 1), NOM)).toContain('à l’Ascendant');
    expect(linkTitle(lien('uranus', 'moon', 'trine', 'b-to-a', 1), NOM)).toMatch(/^L’Uranus/);
    expect(linkTitle(lien('sun', 'sun', 'conjunction', 'a-to-b', 1), NOM)).toBe('Vos deux Soleil en conjonction');
  });

  it('sont déterministes', () => {
    expect(tousLesTextes().map((t) => t.conseil)).toEqual(textes.map((t) => t.conseil));
  });

  it('varient la jointure au lieu de la répéter six fois', () => {
    const jointures = new Set(
      textes.filter((t) => !t.l.mutual).map((t) => (/,\s(et ça [^]+?)\s/.exec(t.conseil) ?? [])[1]),
    );
    expect(jointures.size).toBeGreaterThanOrEqual(3);
  });

  it('la note de tension nomme l’exigence sans annoncer de rupture', () => {
    const note = tensionNote(lien('saturn', 'sun', 'opposition', 'a-to-b', -1), NOM);
    expect(note).toContain('la plus exigeante');
    expect(note).toMatch(/se travaille/);
    expect(note).not.toMatch(/rédhibitoire|impossible|fuir|quitter/i);
  });
});
