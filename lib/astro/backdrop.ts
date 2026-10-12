import type { AspectId, NatalChart, PlanetId, PointId } from './types';
import { ASPECTS, ASPECT_IDS } from './aspects';
import { longitudeOf } from './ephemeris';
import { separation } from './angles';
import { addCivilDays } from './zone';
import { DEFAULT_WINDOW_DAYS } from './transits';

/**
 * Transits longs.
 *
 * Le score sur 90 jours repose volontairement sur les planètes rapides : les
 * lentes produisent des plateaux, pas des pics. Mais ce sont elles qui portent
 * les événements marquants d'une vie — Pluton ne passe qu'une fois sur un point
 * natal, jamais deux. Ils sont donc calculés à part, avec leur date d'exactitude
 * réelle même si elle tombe hors de la fenêtre, et leur périodicité.
 */

export const LONG_BODIES: PlanetId[] = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

/** Période orbitale en années : un transit à un point fixe revient une fois par révolution. */
export const ORBITAL_YEARS: Record<PlanetId, number> = {
  moon: 0.0748, mercury: 0.241, venus: 0.615, sun: 1, mars: 1.881,
  jupiter: 11.862, saturn: 29.457, uranus: 84.02, neptune: 164.8, pluto: 247.9,
};

export type Rarity = 'yearly' | 'decade' | 'generation' | 'once';

export function rarityOf(transit: PlanetId): Rarity {
  const years = ORBITAL_YEARS[transit];
  if (years < 3) return 'yearly';
  if (years < 20) return 'decade';
  if (years < 60) return 'generation';
  return 'once';
}

export const RARITY_LABELS: Record<Rarity, string> = {
  yearly: 'chaque année',
  decade: 'une fois tous les douze ans',
  generation: 'une fois tous les vingt-neuf ans',
  once: 'une seule fois dans une vie',
};

export interface LongTransit {
  transit: PlanetId;
  aspect: AspectId;
  natal: PointId;
  /** Orbe au premier jour de la fenêtre. */
  orbAtStart: number;
  /** Orbe le plus serré atteint *pendant* la fenêtre : c'est lui qui dit la force réelle. */
  orbInWindow: number;
  /** Jour de l'exactitude, `YYYY-MM-DD`, cherché sur ±4 ans. `null` si hors portée. */
  exactDate: string | null;
  /** Orbe minimal atteint sur la plage explorée. */
  minOrb: number;
  recurrenceYears: number;
  rarity: Rarity;
  /** `true` si l'aspect est dans son orbe pendant la fenêtre de 90 jours. */
  activeInWindow: boolean;
}

const DEFAULT_SEARCH_YEARS = 4;

/**
 * Transits longs actifs sur la fenêtre, ordonnés du plus rare au plus courant,
 * puis du plus serré au plus large.
 *
 * L'échantillonnage journalier est calculé une seule fois par planète sur toute
 * la plage explorée, puis réutilisé pour toutes les combinaisons : cinq planètes
 * sur neuf ans, soit ~16 000 positions, contre plusieurs centaines de milliers
 * si chaque recherche repartait de zéro.
 */
export function computeLongTransits(options: {
  chart: NatalChart;
  startDate: string;
  days?: number;
  targets?: PointId[];
  /**
   * Amplitude de la recherche de la date d'exactitude, en années de part et
   * d'autre de la fenêtre. Réduite pour les simulations de masse, où seule
   * compte la présence de l'aspect et non sa date exacte.
   */
  searchYears?: number;
}): LongTransit[] {
  const { chart, startDate } = options;
  const days = options.days ?? DEFAULT_WINDOW_DAYS;
  const searchYears = options.searchYears ?? DEFAULT_SEARCH_YEARS;
  const targets = options.targets
    ?? (['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'asc', 'mc'] as PointId[])
      .filter((p) => chart.anglesReliable || (p !== 'asc' && p !== 'mc'));

  const spanDays = Math.round(searchYears * 2 * 365.25) + days;
  const firstDate = addCivilDays(startDate, -Math.round(searchYears * 365.25));
  const baseMs = Date.UTC(
    Number(firstDate.slice(0, 4)), Number(firstDate.slice(5, 7)) - 1, Number(firstDate.slice(8, 10)), 12,
  );

  const track = new Map<PlanetId, number[]>();
  for (const body of LONG_BODIES) {
    const series = new Array<number>(spanDays);
    for (let i = 0; i < spanDays; i += 1) {
      series[i] = longitudeOf(body, new Date(baseMs + i * 86_400_000));
    }
    track.set(body, series);
  }

  const windowStart = Math.round(searchYears * 365.25);
  const out: LongTransit[] = [];

  for (const body of LONG_BODIES) {
    const series = track.get(body)!;
    for (const natal of targets) {
      const natalLon = chart.points[natal].lon;
      for (const aspect of ASPECT_IDS) {
        const { angle, orb } = ASPECTS[aspect];

        let minOrb = Infinity;
        let minIndex = -1;
        let orbInWindow = Infinity;
        for (let i = 0; i < spanDays; i += 1) {
          const delta = Math.abs(separation(series[i], natalLon) - angle);
          if (delta < minOrb) { minOrb = delta; minIndex = i; }
          if (i >= windowStart && i < windowStart + days && delta < orbInWindow) {
            orbInWindow = delta;
          }
        }
        if (orbInWindow > orb) continue;

        const orbAtStart = Math.abs(separation(series[windowStart], natalLon) - angle);
        out.push({
          transit: body,
          aspect,
          natal,
          orbAtStart,
          orbInWindow,
          minOrb,
          exactDate: minOrb < 0.25 ? addCivilDays(firstDate, minIndex) : null,
          recurrenceYears: ORBITAL_YEARS[body],
          rarity: rarityOf(body),
          activeInWindow: true,
        });
      }
    }
  }

  return out.sort((a, b) =>
    (b.recurrenceYears - a.recurrenceYears) || (a.orbInWindow - b.orbInWindow));
}
