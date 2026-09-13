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

/**
 * Ce que chaque axe demande de faire, selon que le jour porte ou résiste.
 *
 * **Rédigé par le rédacteur du corpus, le 13 septembre 2026.** Trois choses en
 * sont sorties.
 *
 * Un bon jour ne se contente pas d'être bon : il faut aller le chercher. « Si on
 * ne fait rien et qu'on reste chez soi, il ne se passera rien de spécial. » Les
 * verdicts favorables sont donc tous des verbes d'action, jamais des constats.
 *
 * Un jour difficile n'est jamais une fatalité. « L'aspect montre qu'il y a une
 * difficulté ; à nous de la vaincre. » Les verdicts défavorables demandent donc
 * de la vigilance ou de l'attente, jamais du renoncement, et n'annoncent aucune
 * catastrophe.
 *
 * L'axe Énergie a reçu une matière que le produit **n'emploiera pas** : en
 * astrologie médicale, Mars gouverne les défenses de l'organisme. C'est peut-être
 * vrai et c'est sans intérêt ici — la règle interdit à cet axe de parler de santé,
 * et le filtre de sortie l'arrêterait de toute façon. Il ne parle que de rythme,
 * d'élan et de capacité à pousser.
 */
const VERDICTS: Record<AxisId, { good: string; bad: string }> = {
  business: {
    good: 'Va chercher l’occasion. Elle ne viendra pas te trouver assis.',
    bad: 'Redouble de vigilance. Mieux vaut laisser passer que forcer.',
  },
  love: {
    good: 'Sors, partage, dis ce que tu as à dire. C’est un jour qui relie.',
    bad: 'Tu seras vite contrarié sur ce terrain. Ne force aucune conversation.',
  },
  energy: {
    // Rythme et élan uniquement. Jamais un symptôme, jamais un conseil de santé.
    good: 'Va te dépenser. Tu tiendras l’effort mieux qu’hier.',
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

export function buildPhrase(
  axis: AxisId,
  aspects: PhraseAspect[],
  /**
   * Où en est la journée dans son propre mouvement — voir `continuity.ts`.
   * Absente, la phrase reste celle d'avant : le produit lit encore, il ne
   * raconte simplement pas la suite.
   */
  continuity?: string | null,
  /**
   * Mots déjà réservés sur le budget de l'écran par du texte courant affiché
   * **avec** cette phrase — en pratique la traduction de l'aspect, qui vit dans
   * le même bloc juste en dessous.
   *
   * Sans cette réserve, chacun tenait son budget de son côté et l'écran passait
   * à quarante-six mots pour un plafond de quarante-cinq : personne n'était
   * fautif, et la règle était quand même enfreinte. Le budget se compte là où il
   * se lit, en un seul endroit.
   */
  reserve = 0,
): string {
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

  /*
   * Quarante-cinq mots, budget de densité. La clause de continuité est ce que
   * la nouvelle direction produit demande d'ajouter — « ça dure depuis quatre
   * jours » vaut mieux qu'une fausse nouveauté — mais elle ne peut pas faire
   * déborder l'écran. Quand il faut couper, c'est l'ouverture qui saute : elle
   * commente la forme, la continuité apporte un fait.
   */
  const budget = MAX_WORDS - reserve;
  const full = continuity
    ? `${cited}. ${opener} ${continuity} ${verdict}`
    : `${cited}. ${opener} ${verdict}`;
  if (wordCount(full) <= budget) return full;

  const trimmed = continuity ? `${cited}. ${continuity} ${verdict}` : `${cited}. ${verdict}`;
  if (wordCount(trimmed) <= budget) return trimmed;

  // Dernier recours : les aspects cités et la consigne. On ne coupe jamais
  // en deçà — un jour sans consigne ne dit plus rien.
  return `${cited}. ${verdict}`;
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
