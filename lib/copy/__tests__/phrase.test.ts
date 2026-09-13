import { describe, expect, it } from 'vitest';
import {
  MAX_WORDS, buildPhrase, violatesContentRules, wordCount,
} from '../phrase';
import { computeReading } from '@/lib/astro/scoring';
import { AXIS_IDS } from '@/lib/astro/transits';
import { ASPECT_PLAIN, transitPhrase } from '@/lib/astro/labels';
import { ASPECT_IDS } from '@/lib/astro/aspects';
import { referenceChart } from '@/lib/astro/__tests__/fixtures';

const good = { phrase: 'Jupiter en trigone à ton Soleil', sign: '+' as const };
const bad = { phrase: 'Saturne en carré à ton Soleil', sign: '−' as const };

describe('construction de la phrase', () => {
  it('cite les deux aspects puis dit quoi faire', () => {
    const p = buildPhrase('business', [good, bad]);
    expect(p).toContain('Jupiter en trigone à ton Soleil');
    expect(p).toContain('Saturne en carré à ton Soleil');
    expect(p).toContain('Une ouverture et une résistance');
  });

  /*
   * Ce test recopiait les verdicts mot pour mot — « demander », « Ne signe rien ».
   * Il tombait donc à chaque livraison du rédacteur, alors que rien n'était
   * cassé. Il vérifie maintenant ce qui doit rester vrai quel que soit le texte :
   * un jour porteur ne se lit pas comme un jour qui résiste, les deux passent le
   * filtre de contenu, et le verdict demande toujours de faire quelque chose.
   */
  it('distingue un jour porteur d\'un jour qui résiste', () => {
    for (const axis of ['business', 'love', 'energy'] as const) {
      const porteur = buildPhrase(axis, [good, good]);
      const resiste = buildPhrase(axis, [bad, bad]);
      expect(porteur).not.toBe(resiste);
      expect(violatesContentRules(axis, porteur)).toBeNull();
      expect(violatesContentRules(axis, resiste)).toBeNull();
      // Un verdict est une consigne, pas un constat : il porte un impératif.
      for (const texte of [porteur, resiste]) {
        expect(texte).toMatch(/\b(Va|Sors|Dis|Lève|Redouble|Ne |Garde|Prépare|Partage|Tu seras)\b/);
      }
    }
  });

  /*
   * Consigne de ton explicite du rédacteur : « j'aime pas dire pas bon, on dit
   * plutôt difficile ». Un jour qui résiste n'est jamais annoncé comme mauvais,
   * ni comme une fatalité — l'aspect montre la difficulté, il ne la rend pas
   * insurmontable.
   */
  it('ne condamne jamais une journée', () => {
    for (const axis of ['business', 'love', 'energy'] as const) {
      const texte = buildPhrase(axis, [bad, bad]).toLowerCase();
      for (const mot of ['mauvais', 'néfaste', 'catastroph', 'impossible', 'évite tout']) {
        expect(texte).not.toContain(mot);
      }
    }
  });

  it('dit franchement quand une journée n\'a rien de marquant', () => {
    const p = buildPhrase('love', []);
    expect(p).toContain('ordinaire');
    expect(violatesContentRules('love', p)).toBeNull();
  });
});

describe('règles de contenu', () => {
  it('repère les formules de voyance', () => {
    expect(violatesContentRules('business', 'Les astres te sourient.')).toContain('voyance');
    expect(violatesContentRules('love', 'L’univers t’envoie un signe.')).toContain('voyance');
  });

  /** L'axe Énergie parle de rythme et d'élan, jamais de santé. */
  it('repère tout terme médical sur l\'axe Énergie', () => {
    for (const text of [
      'Bon jour pour une opération.',
      'Va voir un médecin.',
      'Attention à la douleur.',
      'Un bon jour pour ta santé.',
    ]) {
      expect(violatesContentRules('energy', text), text).toContain('Énergie');
    }
    // Le même mot sur un autre axe n'est pas interdit.
    expect(violatesContentRules('business', 'Bon jour pour une opération.')).toBeNull();
  });
});

describe('sur les vraies données, sur les trente jours', () => {
  const reading = computeReading({
    chart: referenceChart(), zone: 'Europe/Paris', startDate: '2026-09-10',
  });

  it('aucune phrase ne dépasse le budget de mots ni ne casse une règle', () => {
    for (const axis of AXIS_IDS) {
      for (const day of reading.axes[axis].days) {
        const aspects = day.explaining.map((a) => ({
          phrase: transitPhrase(a.transit, a.aspect, a.natal),
          sign: a.contribution >= 0 ? '+' as const : '−' as const,
        }));
        const text = buildPhrase(axis, aspects);
        expect(wordCount(text), text).toBeLessThanOrEqual(MAX_WORDS);
        expect(violatesContentRules(axis, text), text).toBeNull();
      }
    }
  });
});

/**
 * Le budget de densité se compte là où il se lit.
 *
 * La phrase et la traduction de l'aspect s'affichent dans le même bloc sur
 * l'écran du jour : c'est donc leur **somme** qui doit tenir sous quarante-cinq
 * mots. Chacun tenait son budget de son côté, et l'écran est quand même passé à
 * quarante-six le jour où les traductions se sont allongées.
 */
describe('budget de densité, phrase et traduction ensemble', () => {
  const long = { phrase: 'Jupiter en conjonction à ton Milieu du Ciel', sign: '+' as const };
  const long2 = { phrase: 'Saturne en opposition à ton Descendant', sign: '−' as const };

  it('tient sous quarante-cinq mots pour chacun des cinq aspects', () => {
    for (const aspect of ASPECT_IDS) {
      const gloss = ASPECT_PLAIN[aspect];
      const reserve = wordCount(gloss) + 2;
      for (const continuity of [null, 'Ça dure depuis 6 jours.']) {
        for (const axis of ['business', 'love', 'energy'] as const) {
          const phrase = buildPhrase(axis, [long, long2], continuity, reserve);
          const total = wordCount(phrase) + wordCount(gloss);
          expect(total, `${axis} / ${aspect} : ${phrase} — ${gloss}`).toBeLessThanOrEqual(MAX_WORDS);
        }
      }
    }
  });

  it('ne coupe jamais au point de perdre la consigne', () => {
    // Une réserve absurde ne doit pas rendre une phrase vide de sens : les
    // aspects cités et le verdict sont le minimum vital.
    const phrase = buildPhrase('business', [long, long2], 'Ça dure depuis 6 jours.', 40);
    expect(phrase).toContain('Jupiter en conjonction à ton Milieu du Ciel');
    expect(phrase.length).toBeGreaterThan(60);
  });
});
