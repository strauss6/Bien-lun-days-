import type { AxisId } from '@/lib/astro/types';
import type { City } from '@/lib/cities/search';
import type { ReadingInput } from '@/lib/api/reading';

/**
 * Le quiz, une question par écran.
 *
 * La logique de validation vit ici, en fonctions pures, pour être testée sans
 * rendu : c'est elle qui décide si l'on peut passer à l'écran suivant, et le
 * composant ne fait que l'appeler.
 */

export type StepId = 'firstName' | 'birthDate' | 'birthTime' | 'city' | 'priorityAxis';

export interface QuizDraft {
  firstName: string;
  birthDate: string;
  birthTime: string;
  /** `false` quand la personne coche « je ne la connais pas ». */
  timeKnown: boolean;
  city: City | null;
  priorityAxis: AxisId | null;
}

export interface QuizStep {
  id: StepId;
  question: string;
  /** Une seule ligne sous le champ, quand elle mérite d'exister. */
  hint?: string;
}

export const QUIZ_STEPS: QuizStep[] = [
  { id: 'firstName', question: 'Comment tu t’appelles ?' },
  { id: 'birthDate', question: 'Tu es né quel jour ?' },
  {
    id: 'birthTime',
    question: 'À quelle heure ?',
    hint: 'Deux heures d’écart changent tout le thème. C’est ici que 99 % de l’astrologie s’arrête.',
  },
  { id: 'city', question: 'Dans quelle ville ?' },
  { id: 'priorityAxis', question: 'Qu’est-ce qui compte le plus en ce moment ?' },
];

export function blankDraft(): QuizDraft {
  return { firstName: '', birthDate: '', birthTime: '', timeKnown: true, city: null, priorityAxis: null };
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRealPastDate(value: string, today = new Date().toISOString().slice(0, 10)): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [, y, mo, d] = m;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  // `new Date` accepte le 31 février en le décalant : on vérifie l'aller-retour.
  if (date.getUTCMonth() + 1 !== Number(mo) || date.getUTCDate() !== Number(d)) return false;
  if (Number(y) < 1900) return false;
  return value <= today;
}

export function isStepComplete(step: StepId, draft: QuizDraft, today?: string): boolean {
  switch (step) {
    case 'firstName':
      return draft.firstName.trim().length > 0;
    case 'birthDate':
      return isRealPastDate(draft.birthDate, today);
    // Le seul écran où ne pas savoir est une réponse valide.
    case 'birthTime':
      return draft.timeKnown ? TIME_RE.test(draft.birthTime) : true;
    case 'city':
      return draft.city !== null;
    case 'priorityAxis':
      return draft.priorityAxis !== null;
  }
}

export function isDraftComplete(draft: QuizDraft, today?: string): boolean {
  return QUIZ_STEPS.every((s) => isStepComplete(s.id, draft, today));
}

/** Brouillon → demande de calcul. Sans heure connue, le champ part à `null`. */
export function toReadingRequest(draft: QuizDraft, startDate: string): ReadingInput {
  if (!draft.city || !draft.priorityAxis) throw new Error('Brouillon incomplet.');
  return {
    firstName: draft.firstName.trim(),
    birthDate: draft.birthDate,
    birthTime: draft.timeKnown ? draft.birthTime : null,
    timeKnown: draft.timeKnown,
    lat: draft.city.lat,
    lng: draft.city.lng,
    city: draft.city.name,
    country: draft.city.country,
    priorityAxis: draft.priorityAxis,
    startDate,
  };
}

export const AXIS_CHOICES: Array<{ id: AxisId; label: string; blurb: string }> = [
  { id: 'business', label: 'Business', blurb: 'Négocier, lancer, signer, demander.' },
  { id: 'love', label: 'Amour', blurb: 'Rencontrer, se déclarer, réconcilier.' },
  { id: 'energy', label: 'Énergie', blurb: 'Pousser fort, ou lever le pied.' },
];

export const DRAFT_STORAGE_KEY = 'bien-lune:draft';
