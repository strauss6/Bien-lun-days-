import type { AxisId } from '@/lib/astro/types';

/**
 * Phrases de jour, par gabarit déterministe.
 *
 * Elles citent les deux aspects retenus puis disent quoi en faire. Aucun appel
 * réseau : le chemin complet ne doit pas dépendre d'une clé d'API — voir
 * QUESTIONS.md Q6. La génération par le modèle viendra en surcouche sur le même
 * contrat, et remplira la même table de cache.
 *
 * Trois règles y sont tenues par construction :
 * — jamais de formule de voyance ;
 * — l'axe Énergie ne parle que de rythme, jamais de santé ;
 * — quarante-cinq mots au maximum, budget de densité oblige.
 */

export interface PhraseAspect {
  phrase: string;
  sign: '+' | '−';
}

/** Verbe d'action de chaque axe, selon que le jour porte ou résiste. */
const VERDICTS: Record<AxisId, { good: string; bad: string }> = {
  business: {
    good: 'C’est un jour pour demander, pas pour attendre.',
    bad: 'Ne signe rien aujourd’hui. Prépare, envoie demain.',
  },
  love: {
    good: 'Dis-le. Ce que tu formules aujourd’hui passe mieux qu’hier.',
    bad: 'Ne force pas la conversation aujourd’hui. Elle ira mieux plus tard.',
  },
  energy: {
    // Rythme et élan uniquement. Jamais un symptôme, jamais un conseil de santé.
    good: 'Pousse fort. Le rythme te porte.',
    bad: 'Lève le pied. Garde le nerf pour un autre jour.',
  },
};

const OPENERS = {
  bothGood: 'Deux ouvertures le même jour.',
  bothBad: 'Deux résistances le même jour.',
  mixed: 'Une ouverture et une résistance.',
  singleGood: 'Une seule chose, mais elle porte.',
  singleBad: 'Une seule chose, et elle pèse.',
};

export const MAX_WORDS = 45;

export function buildPhrase(axis: AxisId, aspects: PhraseAspect[]): string {
  if (!aspects.length) {
    return 'Rien de marquant ce jour-là. C’est une journée ordinaire, et c’est une information.';
  }

  const positive = aspects[0].sign === '+';
  const cited = aspects.map((a) => a.phrase).join(', et ');
  const opener = aspects.length > 1
    ? (aspects[0].sign === aspects[1].sign
      ? (positive ? OPENERS.bothGood : OPENERS.bothBad)
      : OPENERS.mixed)
    : (positive ? OPENERS.singleGood : OPENERS.singleBad);

  const verdict = positive ? VERDICTS[axis].good : VERDICTS[axis].bad;
  return `${cited}. ${opener} ${verdict}`;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Lexique interdit sur l'axe Énergie, vérifié en sortie. */
export const MEDICAL_TERMS = [
  'opération', 'chirurgie', 'médecin', 'symptôme', 'diagnostic', 'traitement',
  'médicament', 'maladie', 'douleur', 'consultation', 'hôpital', 'ordonnance',
  'guérison', 'santé', 'thérapie',
];

/** Formules de voyance interdites partout. */
export const FORBIDDEN_PHRASES = [
  'les astres', 'l’univers t’envoie', 'l\'univers t\'envoie', 'énergies négatives',
  'vibrations', 'le destin', 'les planètes te',
];

export function violatesContentRules(axis: AxisId, text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_PHRASES) {
    if (lower.includes(term)) return `formule de voyance : « ${term} »`;
  }
  if (axis === 'energy') {
    for (const term of MEDICAL_TERMS) {
      if (lower.includes(term)) return `terme médical sur l’axe Énergie : « ${term} »`;
    }
  }
  return null;
}
