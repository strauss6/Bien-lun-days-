import type { AspectId, NatalChart, PlanetId, PointId } from './types';
import { ASPECTS } from './aspects';
import { longitudeOf } from './ephemeris';
import { separation } from './angles';
import { computeLongTransits, ORBITAL_YEARS } from './backdrop';
import { addCivilDays } from './zone';
import { DEFAULT_WINDOW_DAYS } from './transits';

/**
 * Rareté d'un aspect, et ce qu'elle permet de dire.
 *
 * Un aspect est d'autant plus marquant que la planète en transit est lente. Pour
 * les plus lentes, on peut dire quelque chose qu'aucun horoscope ne dit : quand
 * c'est arrivé la dernière fois, et quel âge la personne avait alors.
 *
 * Deux règles d'honnêteté gouvernent ce fichier, parce que c'est ici que le
 * produit est le plus tentant à embellir :
 *
 * 1. **Les passages rétrogrades d'un même transit sont un seul événement.** Une
 *    planète lente repasse deux ou trois fois sur le même degré en quelques mois.
 *    Les compter séparément fait dire « la dernière fois, tu avais 31 ans » d'un
 *    Pluton sur l'Ascendant qui n'est arrivé qu'une fois dans la vie.
 * 2. **Rien n'est extrapolé.** Si le balayage ne trouve aucune occurrence entre la
 *    naissance et aujourd'hui, on l'écrit — `firstInLifetime` — au lieu de
 *    calculer une date théorique.
 */

export type RarityClass = 'never' | 'yearly' | 'notable' | 'rare' | 'very-rare' | 'exceptional';

/** Classement par période orbitale, tel que fixé par le brief. */
export const RARITY_OF: Record<PlanetId, RarityClass> = {
  moon: 'never',
  sun: 'yearly',
  mercury: 'yearly',
  venus: 'yearly',
  mars: 'notable',
  jupiter: 'rare',
  saturn: 'very-rare',
  uranus: 'exceptional',
  neptune: 'exceptional',
  pluto: 'exceptional',
};

export const RARITY_LABELS: Record<RarityClass, string> = {
  never: 'plusieurs fois par mois',
  yearly: 'une fois par an',
  notable: 'tous les deux ans',
  rare: 'une fois tous les douze ans',
  'very-rare': 'une fois tous les vingt-neuf ans',
  exceptional: 'une ou deux fois dans une vie',
};

export function rarityOfBody(transit: PlanetId): RarityClass {
  return RARITY_OF[transit];
}

/** Seuls « rare » et au-dessus sont mis en avant. La Lune ne l'est jamais. */
export function isHighlightable(transit: PlanetId): boolean {
  const r = RARITY_OF[transit];
  return r === 'rare' || r === 'very-rare' || r === 'exceptional';
}

export interface RareEvent {
  transit: PlanetId;
  aspect: AspectId;
  natal: PointId;
  rarity: RarityClass;
  recurrenceYears: number;
  /** Orbe le plus serré atteint pendant la fenêtre. */
  orbInWindow: number;
  /** Jour d'exactitude s'il tombe dans la fenêtre, `null` sinon. */
  exactDate: string | null;
  /** Occurrence précédente **dans la vie de la personne**, et l'âge qu'elle avait. */
  previous: { date: string; age: number } | null;
  /** Occurrence suivante. `null` au-delà de la portée du balayage. */
  next: { date: string; year: number } | null;
  /** Rien avant dans cette vie : à dire tel quel, jamais à combler. */
  firstInLifetime: boolean;
}

/** Amplitude du balayage vers l'avenir, en années. Vers le passé, on s'arrête à la naissance. */
const SCAN_FORWARD_YEARS = 60;
const MONTH_MS = 30.44 * 86_400_000;
const DAY_MS = 86_400_000;

/** Orbe en deçà duquel on considère l'aspect exact. */
const EXACT_ORB = 0.35;

/**
 * Fenêtre de regroupement des passages rétrogrades, en années.
 *
 * Elle doit couvrir toute la boucle de rétrogradation d'une planète sans jamais
 * atteindre sa révolution suivante. Jupiter boucle en quelques mois et revient en
 * douze ans ; Pluton peut s'étaler sur trois ans et ne revient jamais.
 */
function groupingYears(transit: PlanetId): number {
  const years = ORBITAL_YEARS[transit];
  if (years > 60) return 6;
  if (years > 20) return 4;
  return 2;
}

/** Suite d'exactitudes distinctes, du plus ancien au plus récent. */
function exactMoments(transit: PlanetId, natalLon: number, aspect: AspectId, fromMs: number, toMs: number): number[] {
  const angle = ASPECTS[aspect].angle;
  const steps = Math.ceil((toMs - fromMs) / MONTH_MS);
  const orbAt = (t: number) => Math.abs(separation(longitudeOf(transit, new Date(t)), natalLon) - angle);

  const coarse: number[] = [];
  let prev = orbAt(fromMs);
  let cur = orbAt(fromMs + MONTH_MS);
  for (let i = 1; i < steps; i += 1) {
    const t = fromMs + i * MONTH_MS;
    const nextOrb = orbAt(t + MONTH_MS);
    // Minimum local sur la grille mensuelle, avec une marge large : la valeur
    // exacte sera cherchée au jour près juste en dessous.
    if (cur <= prev && cur <= nextOrb && cur < 15) coarse.push(t);
    prev = cur;
    cur = nextOrb;
  }

  const exact: number[] = [];
  for (const t0 of coarse) {
    let best = { t: t0, orb: orbAt(t0) };
    for (let d = -45; d <= 45; d += 1) {
      const t = t0 + d * DAY_MS;
      if (t < fromMs || t > toMs) continue;
      const orb = orbAt(t);
      if (orb < best.orb) best = { t, orb };
    }
    if (best.orb < EXACT_ORB) exact.push(best.t);
  }

  // Regroupement : les passages rétrogrades d'un même transit sont un seul événement.
  const gap = groupingYears(transit) * 365.25 * DAY_MS;
  const events: number[] = [];
  for (const t of exact) {
    if (!events.length || t - events[events.length - 1] > gap) events.push(t);
    else events[events.length - 1] = t; // on retient le passage le plus proche de l'exact
  }
  return events;
}

const cache = new Map<string, RareEvent[]>();

export function computeRareEvents(options: {
  chart: NatalChart;
  startDate: string;
  days?: number;
}): RareEvent[] {
  const { chart, startDate } = options;
  const days = options.days ?? DEFAULT_WINDOW_DAYS;
  const key = `${chart.birth.utcMs}|${chart.lat}|${chart.lng}|${startDate}|${days}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const nowMs = Date.UTC(
    Number(startDate.slice(0, 4)), Number(startDate.slice(5, 7)) - 1, Number(startDate.slice(8, 10)), 12,
  );
  const endMs = nowMs + SCAN_FORWARD_YEARS * 365.25 * DAY_MS;

  const active = computeLongTransits({ chart, startDate, days })
    .filter((t) => isHighlightable(t.transit));

  const windowEnd = addCivilDays(startDate, days - 1);

  const out: RareEvent[] = active.map((t) => {
    const natalLon = chart.points[t.natal].lon;
    // On ne cherche jamais avant la naissance : une occurrence antérieure n'aurait
    // pas d'âge à afficher, et le produit parle de la vie de la personne.
    const moments = exactMoments(t.transit, natalLon, t.aspect, chart.birth.utcMs, endMs);

    const groupWindow = groupingYears(t.transit) * 365.25 * DAY_MS;
    const previousMs = moments.filter((m) => m < nowMs - groupWindow).pop() ?? null;
    const nextMs = moments.find((m) => m > nowMs + groupWindow) ?? null;

    const inWindow = t.exactDate !== null && t.exactDate >= startDate && t.exactDate <= windowEnd;

    return {
      transit: t.transit,
      aspect: t.aspect,
      natal: t.natal,
      rarity: rarityOfBody(t.transit),
      recurrenceYears: ORBITAL_YEARS[t.transit],
      orbInWindow: t.orbInWindow,
      exactDate: inWindow ? t.exactDate : null,
      previous: previousMs === null ? null : {
        date: new Date(previousMs).toISOString().slice(0, 10),
        age: Math.floor((previousMs - chart.birth.utcMs) / (365.2425 * DAY_MS)),
      },
      next: nextMs === null ? null : {
        date: new Date(nextMs).toISOString().slice(0, 10),
        year: new Date(nextMs).getUTCFullYear(),
      },
      firstInLifetime: previousMs === null,
    };
  });

  out.sort((a, b) => (b.recurrenceYears - a.recurrenceYears) || (a.orbInWindow - b.orbInWindow));
  cache.set(key, out);
  return out;
}
