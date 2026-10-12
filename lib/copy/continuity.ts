import type { AxisDay, DayAspect } from '@/lib/astro/types';

/**
 * Ce qui commence, se prolonge, culmine ou s'atténue.
 *
 * Un produit qu'on ouvre chaque matin ne peut pas réécrire le monde chaque
 * matin. Si un transit dure trois semaines, le dire trois semaines de suite est
 * la vérité ; fabriquer une nouveauté quotidienne serait le mensonge. Ce module
 * calcule, **à partir des seuls aspects réellement trouvés**, où en est la
 * journée dans son propre mouvement.
 *
 * Tout y est déterministe : deux ouvertures de la même journée donnent le même
 * texte. Rien n'est tiré au sort, rien ne dépend de l'heure d'affichage.
 */

export type Movement = 'commence' | 'se-prolonge' | 'culmine' | 's-attenue';

/** Écart de score au-delà duquel la journée mérite d'être comparée à la veille. */
export const NOTABLE_CHANGE = 12;
/** Nombre de jours à partir duquel une tendance cesse d'être une nouvelle. */
export const PERSISTENT_RUN = 3;

export interface DayContinuity {
  /** Où en est l'aspect dominant de sa propre trajectoire. */
  movement: Movement | null;
  /** Depuis combien de jours l'aspect dominant est là, ce jour compris. */
  runDays: number;
  /** Écart signé avec la veille, arrondi. `null` le premier jour de la série. */
  changeFromYesterday: number | null;
  /** L'écart mérite-t-il d'être signalé ? */
  notable: boolean;
}

/** Identité d'un aspect : la même planète, le même angle, le même point natal. */
export function eventKey(aspect: DayAspect | undefined): string | null {
  return aspect ? `${aspect.transit}|${aspect.aspect}|${aspect.natal}` : null;
}

/**
 * Mouvement de l'aspect dominant du jour.
 *
 * On lit l'orbe — l'écart à l'angle exact — de part et d'autre. Il se resserre
 * avant l'exact, il s'ouvre après. `peaking` marque le jour de l'exact, calculé
 * par le moteur et non redéduit ici.
 */
export function movementOf(
  today: DayAspect | undefined,
  yesterday: DayAspect | undefined,
  tomorrow: DayAspect | undefined,
  /**
   * Le lendemain est-il calculé ?
   *
   * Au dernier jour de la fenêtre il ne l'est pas, et confondre « l'aspect
   * s'arrête » avec « on ne sait pas » ferait dire « ça se relâche » au dernier
   * jour de chaque rapport, tous les jours, pour tout le monde. Ne pas savoir ne
   * se raconte pas.
   */
  tomorrowKnown = true,
): Movement | null {
  if (!today) return null;
  const key = eventKey(today);
  const hier = eventKey(yesterday) === key ? yesterday : undefined;
  const demain = eventKey(tomorrow) === key ? tomorrow : undefined;

  if (today.peaking) return 'culmine';
  if (!hier) return 'commence';
  if (!tomorrowKnown) return 'se-prolonge';
  if (!demain) return 's-attenue';
  return today.orb < hier.orb ? 'se-prolonge' : 's-attenue';
}

/** Depuis combien de jours le même aspect domine, ce jour compris. */
export function runLength(days: AxisDay[], index: number): number {
  const key = eventKey(days[index]?.explaining[0]);
  if (!key) return 0;
  let run = 1;
  for (let d = index - 1; d >= 0 && eventKey(days[d].explaining[0]) === key; d -= 1) run += 1;
  return run;
}

export function continuityOf(days: AxisDay[], index: number): DayContinuity {
  const today = days[index];
  const dominant = today?.explaining[0];
  const key = eventKey(dominant);
  const sameEvent = (day: AxisDay | undefined) =>
    day?.aspects.find((a) => eventKey(a) === key);

  const change = index > 0 ? Math.round(today.score) - Math.round(days[index - 1].score) : null;

  return {
    movement: movementOf(
      dominant, sameEvent(days[index - 1]), sameEvent(days[index + 1]), index + 1 < days.length,
    ),
    runDays: runLength(days, index),
    changeFromYesterday: change,
    notable: change !== null && Math.abs(change) >= NOTABLE_CHANGE,
  };
}

/**
 * La clause de continuité, en clair.
 *
 * Courte par construction : elle s'ajoute à une phrase qui doit tenir sous
 * quarante-cinq mots. Elle ne se déclenche que si elle a quelque chose à dire —
 * une tendance qui dure, un mouvement net, ou un écart qui saute aux yeux. Une
 * journée ordinaire n'a pas de clause, et c'est très bien.
 */
export function continuityClause(c: DayContinuity): string | null {
  if (c.runDays >= PERSISTENT_RUN && c.movement !== 'culmine') {
    return `Ça dure depuis ${c.runDays} jours.`;
  }
  if (c.notable) {
    return c.changeFromYesterday! > 0 ? 'Nettement mieux qu’hier.' : 'Nettement moins qu’hier.';
  }
  switch (c.movement) {
    case 'commence': return 'Ça commence aujourd’hui.';
    case 'culmine': return 'C’est aujourd’hui le plus net.';
    case 's-attenue': return 'Ça se relâche.';
    default: return null;
  }
}
