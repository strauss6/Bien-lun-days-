import { describe, expect, it } from 'vitest';
import {
  MAX_WORDS, buildPhrase, violatesContentRules, wordCount,
} from '../phrase';
import { computeReading } from '@/lib/astro/scoring';
import { AXIS_IDS } from '@/lib/astro/transits';
import { transitPhrase } from '@/lib/astro/labels';
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

  it('distingue un jour porteur d\'un jour qui résiste', () => {
    expect(buildPhrase('business', [good, good])).toContain('demander');
    expect(buildPhrase('business', [bad, bad])).toContain('Ne signe rien');
    expect(buildPhrase('love', [bad, bad])).toContain('Ne force pas');
    expect(buildPhrase('energy', [good, good])).toContain('Pousse fort');
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
