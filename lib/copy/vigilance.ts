import type { PointId } from '@/lib/astro/types';
import { HOUSE_TOPICS } from '@/lib/astro/rulers';
import { empreinte } from './phrase';

/**
 * Ce à quoi faire attention, et pourquoi ça se contre.
 *
 * ## La règle, mot pour mot
 *
 * Le rédacteur du corpus, le 11 octobre 2026, lisant un Saturne opposé à un
 * Jupiter natal logé en maison 9 : « ça veut dire tout simplement qu'il faut en
 * même temps faire attention à tout ce qui est d'ordre juridique, administratif.
 * Mais si tu fais attention, c'est bien, tu vas pouvoir **contrer** l'aspect qui
 * montre ces difficultés, sur ce plan. »
 *
 * Trois choses dans cette phrase, et le produit n'en disait aucune.
 *
 * **Un aspect difficile nomme un domaine**, et ce domaine est celui de la maison
 * où loge le point natal touché. C'est la même règle que « le domaine dépend de
 * la maison touchée », appliquée non plus au poids mais au texte.
 *
 * **Il se contre.** Ce n'est pas un pronostic, c'est un avertissement : la
 * vigilance annule la difficulté. Un score bas assorti d'un geste précis n'est
 * plus le même objet qu'un score bas tout seul.
 *
 * **« Sur ce plan. »** La difficulté est circonscrite à un domaine, elle ne
 * déteint pas sur la journée entière.
 *
 * ## Provenance
 *
 * La maison 9 est de lui, dans ces mots. Les onze autres sont de nous, écrites
 * sur le même gabarit depuis le domaine de chaque maison. Elles sont à lui faire
 * relire — c'est une liste courte et c'est le genre de texte qu'il corrige vite.
 */

export type VigilanceSource = 'direct' | 'inféré';

export interface Vigilance {
  house: number;
  /** Le geste concret. Jamais un pronostic, jamais un renoncement. */
  watch: string;
  source: VigilanceSource;
}

export const VIGILANCES: Record<number, Vigilance> = {
  1: { house: 1, source: 'inféré', watch: 'ne force pas ton image : on te lira plus sévèrement que d’habitude' },
  2: { house: 2, source: 'inféré', watch: 'regarde tes chiffres avant de t’engager, pas après' },
  3: { house: 3, source: 'inféré', watch: 'relis ce que tu écris, et vérifie ce qu’on te rapporte' },
  4: { house: 4, source: 'inféré', watch: 'les sujets de famille et de logement demandent plus de soin qu’ils n’en ont l’air' },
  5: { house: 5, source: 'inféré', watch: 'ne mise pas sur un coup : ce qui se construit tient, ce qui se tente glisse' },
  6: { house: 6, source: 'inféré', watch: 'allège la charge du quotidien avant qu’elle ne décide pour toi' },
  7: { house: 7, source: 'inféré', watch: 'relis ce que tu signes à deux, ligne à ligne' },
  // ✳ Rédacteur, 11 octobre 2026, mot pour mot.
  9: { house: 9, source: 'direct', watch: 'fais attention à tout ce qui est d’ordre juridique et administratif' },
  8: { house: 8, source: 'inféré', watch: 'les engagements financiers partagés demandent d’être écrits' },
  10: { house: 10, source: 'inféré', watch: 'ce qui se dit de toi compte plus que d’habitude : ne laisse pas traîner' },
  11: { house: 11, source: 'inféré', watch: 'une promesse de réseau n’est pas un engagement : fais confirmer' },
  12: { house: 12, source: 'inféré', watch: 'ce qui se décide sans toi mérite que tu demandes où ça en est' },
};

/**
 * Trois façons de dire qu'une vigilance suffit.
 *
 * Sa phrase est la première, presque telle quelle. Les deux autres la varient,
 * parce que la même formule sur trois axes du même écran se lit comme un
 * formulaire — reproche du 15 septembre, qui vaut partout.
 */
const CONTRES = [
  'Si tu y fais attention, tu contres la difficulté sur ce plan.',
  'C’est une vigilance, pas un verdict : qui regarde passe au travers.',
  'L’aspect montre où ça résiste ; la vigilance suffit à le désamorcer.',
];

/**
 * Ce à quoi faire attention, pour un point natal logé dans une maison donnée.
 *
 * `null` quand la maison est inconnue — on ne meuble pas. Reste sous les
 * quarante-cinq mots du budget de densité.
 */
export function vigilanceFor(natal: PointId, house: number): string | null {
  const v = VIGILANCES[house];
  if (!v) return null;
  const contre = CONTRES[empreinte(`${natal}|${house}`) % CONTRES.length];
  return `${majuscule(v.watch)}. ${contre}`;
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Le domaine de la maison, pour nommer le plan dont on parle. */
export function houseTopic(house: number): string | null {
  return HOUSE_TOPICS[house] ?? null;
}
