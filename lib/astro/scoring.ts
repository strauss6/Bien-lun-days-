import type {
  AspectId, AxisDay, AxisId, AxisReading, DayAspect, NatalChart, PlanetId, PointId, Reading,
} from './types';
import { AXIS_IDS, AXIS_NATALS, AXIS_TRANSITS, buildTransitGrid, pairKey } from './transits';

/** Poids des planètes en transit, par axe. */
export const TRANSIT_WEIGHTS: Record<AxisId, Partial<Record<PlanetId, number>>> = {
  business: { jupiter: 1.0, saturn: 0.9, mercury: 0.6, sun: 0.7 },
  love: { venus: 1.0, mars: 0.7, jupiter: 0.65, sun: 0.55, moon: 0.45 },
  energy: { mars: 1.0, saturn: 0.85, sun: 0.8, moon: 0.5 },
};

/** Poids des points natals visés, par axe. */
export const NATAL_WEIGHTS: Record<AxisId, Partial<Record<PointId, number>>> = {
  business: { sun: 1.0, mc: 0.95, mercury: 0.7, jupiter: 0.6 },
  love: { venus: 1.0, moon: 0.8, dsc: 0.75, mars: 0.7, sun: 0.6 },
  energy: { asc: 1.0, sun: 0.85, mars: 0.8, moon: 0.55 },
};

/** Planètes dont la conjonction pèse contre, et dont les aspects harmoniques pèsent moins. */
const MALEFIC: ReadonlySet<PlanetId> = new Set<PlanetId>(['saturn', 'mars']);

/** Planètes dont les aspects durs relèvent de l'excès plutôt que de l'obstacle. */
const SOFT_HARD: Partial<Record<PlanetId, number>> = { jupiter: -0.5, venus: -0.6 };

/**
 * Polarité d'un aspect, modulée par la nature de la planète en transit.
 *
 * Une conjonction n'a pas de signe en soi : elle vaut ce que vaut la planète qui
 * arrive. Saturne ou Mars sur un point natal pèsent contre, Jupiter ou Vénus pour.
 */
export function polarity(transit: PlanetId, aspect: AspectId): number {
  const malefic = MALEFIC.has(transit);
  switch (aspect) {
    case 'trine': return malefic ? 0.6 : 1.0;
    case 'sextile': return malefic ? 0.45 : 0.7;
    case 'conjunction': return malefic ? -0.8 : 0.9;
    case 'square': return SOFT_HARD[transit] ?? -1.0;
    case 'opposition': return SOFT_HARD[transit] ?? -0.9;
  }
}

/** Majoration du jour où l'aspect est au plus près de l'exact. */
export const PEAK_BONUS = 0.15;

/**
 * Poids de la Lune dans le choix des dates du rapport.
 *
 * La Lune repasse sur chaque point natal tous les mois : ses aspects donnent au
 * ruban son grain quotidien — c'est voulu — mais ils ne doivent pas décider des
 * cinq meilleures dates sur 90 jours, sinon le rapport promet une date rare et
 * livre un événement mensuel. Elle est donc divisée par quatre dans la série qui
 * sert au classement, et gardée entière dans celle qui est affichée.
 */
export const MOON_SELECTION_FACTOR = 0.25;

/** Seuils de citation d'une date, sur l'échelle normalisée 3–97. */
export const BEST_THRESHOLD = 55;
export const WORST_THRESHOLD = 45;

/** En dessous de ce nombre, un axe paraît vide : on relâche la diversité des événements. */
export const MIN_DATES = 3;

/**
 * Aspect à citer pour justifier une date.
 *
 * Un bon jour doit être expliqué par son meilleur aspect harmonique, un mauvais
 * par son aspect dur le plus fort. Trier par proximité à l'exact ne suffit pas :
 * un carré très serré peut être l'aspect le plus net d'une journée par ailleurs
 * excellente, et le rapport justifierait alors un pic par un aspect négatif.
 */
export function primaryAspect(day: AxisDay, direction: 'best' | 'worst'): DayAspect | null {
  const wanted = day.aspects.filter((a) => (direction === 'best' ? a.contribution > 0 : a.contribution < 0));
  return wanted[0] ?? day.aspects[0] ?? null;
}

/**
 * Poids natals effectifs.
 *
 * Sans heure de naissance, l'Ascendant, le MC et le Descendant ne sont pas
 * exploitables (±180°) et la Lune n'est connue qu'à ±6°. On les retire ou on
 * les dégrade plutôt que de simuler une précision qu'on n'a pas.
 */
export function effectiveNatalWeights(axis: AxisId, anglesReliable: boolean): Partial<Record<PointId, number>> {
  const base = NATAL_WEIGHTS[axis];
  if (anglesReliable) return base;
  const out: Partial<Record<PointId, number>> = {};
  for (const [point, weight] of Object.entries(base) as Array<[PointId, number]>) {
    if (point === 'asc' || point === 'mc' || point === 'dsc' || point === 'ic') continue;
    out[point] = point === 'moon' ? weight * 0.5 : weight;
  }
  return out;
}

export function effectiveTransitWeights(axis: AxisId, anglesReliable: boolean): Partial<Record<PlanetId, number>> {
  const base = TRANSIT_WEIGHTS[axis];
  if (anglesReliable) return base;
  return { ...base, ...(base.moon ? { moon: base.moon * 0.5 } : {}) };
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function medianAbsoluteDeviation(values: number[], center = median(values)): number {
  return median(values.map((v) => Math.abs(v - center)));
}

/** Lissage sur trois jours, bords renormalisés. Tue le bruit lunaire d'un jour isolé. */
export function smooth(series: number[]): number[] {
  return series.map((_, i) => {
    const prev = i > 0 ? series[i - 1] : null;
    const next = i < series.length - 1 ? series[i + 1] : null;
    let sum = series[i] * 0.5;
    let weight = 0.5;
    if (prev !== null) { sum += prev * 0.25; weight += 0.25; }
    if (next !== null) { sum += next * 0.25; weight += 0.25; }
    return sum / weight;
  });
}

export const SCORE_FLOOR = 3;
export const SCORE_CEILING = 97;

/**
 * Normalisation sur la distribution propre de la personne.
 *
 * Une échelle absolue rendrait la moitié des rapports plats. Le rang percentile
 * garantirait l'amplitude mais écraserait la forme — un vrai pic deviendrait un
 * plateau. On centre donc sur la médiane avec un écart robuste (MAD), on comprime
 * par une tangente hyperbolique, puis on étale entre 3 et 97 : amplitude garantie,
 * forme conservée.
 */
export function normalize(raw: number[]): number[] {
  return normalizeSmoothed(smooth(raw));
}

/** Même normalisation, sur une série déjà lissée (la marge de calcul a été retirée). */
export function normalizeSmoothed(s: number[]): number[] {
  const med = median(s);
  const mad = 1.4826 * medianAbsoluteDeviation(s, med);
  const scale = mad > 1e-9 ? mad : Math.max(1e-9, Math.max(...s.map((v) => Math.abs(v - med))));
  const compressed = s.map((v) => Math.tanh((v - med) / (2.2 * scale)));
  const lo = Math.min(...compressed);
  const hi = Math.max(...compressed);
  const span = hi - lo;
  if (span < 1e-9) return s.map(() => (SCORE_FLOOR + SCORE_CEILING) / 2);
  return compressed.map(
    (c) => SCORE_FLOOR + (SCORE_CEILING - SCORE_FLOOR) * ((c - lo) / span),
  );
}

/**
 * Meilleurs ou pires jours, espacés d'au moins `minGap` jours.
 *
 * Sans cette contrainte, un seul transit exact livrerait cinq dates consécutives
 * et le rapport paraîtrait vide.
 */
export function selectDates(
  scores: number[],
  options: {
    count: number;
    order: 'best' | 'worst';
    minGap?: number;
    /**
     * Identité de l'événement astrologique qui explique ce jour. Deux dates du
     * rapport ne peuvent pas partager le même événement : Vénus reste dans
     * l'orbe d'un trigone pendant deux semaines, et sans cette contrainte les
     * cinq « meilleures dates » sont cinq fois le même transit.
     */
    eventKey?: (day: number) => string | null;
    /**
     * Score minimum (`best`) ou maximum (`worst`) pour qu'une date soit citée.
     * Une fenêtre calme ne doit pas produire un « meilleur jour » médiocre :
     * mieux vaut quatre dates fortes que cinq dont une tiède.
     */
    threshold?: number;
  },
): number[] {
  const minGap = options.minGap ?? 3;
  const ranked = scores
    .map((score, day) => ({ score, day }))
    .sort((a, b) => (options.order === 'best' ? b.score - a.score : a.score - b.score));

  const picked: number[] = [];
  const usedEvents = new Set<string>();
  const spaced = (day: number) => picked.every((p) => Math.abs(p - day) >= minGap);

  const passesThreshold = (day: number) => options.threshold === undefined
    || (options.order === 'best' ? scores[day] >= options.threshold : scores[day] <= options.threshold);

  for (const { day } of ranked) {
    if (picked.length >= options.count) break;
    if (!spaced(day) || !passesThreshold(day)) continue;
    const key = options.eventKey?.(day) ?? null;
    if (key !== null && usedEvents.has(key)) continue;
    if (key !== null) usedEvents.add(key);
    picked.push(day);
  }

  // Repli : on complète avec un événement déjà cité plutôt que de descendre
  // sous trois dates, mais on ne descend jamais sous le seuil de qualité.
  if (picked.length < MIN_DATES) {
    for (const { day } of ranked) {
      if (picked.length >= MIN_DATES) break;
      if (!picked.includes(day) && spaced(day)) picked.push(day);
    }
  }

  return picked.sort((a, b) => a - b);
}

/** Identité d'un événement : la paire visée et l'aspect formé, sans la date. */
export function eventKeyOf(aspect: DayAspect | null): string | null {
  return aspect ? `${aspect.transit}|${aspect.aspect}|${aspect.natal}` : null;
}

export interface ScoreOptions {
  chart: NatalChart;
  /** Fuseau de résidence — celui dans lequel « le jour » a un sens pour l'utilisateur. */
  zone: string;
  startDate: string;
  days?: number;
}

export function computeReading(options: ScoreOptions): Reading {
  const { chart, zone, startDate } = options;
  const days = options.days ?? 90;
  const grid = buildTransitGrid({ chart, zone, startDate, days });
  const reliable = chart.anglesReliable;

  const axes = {} as Record<AxisId, AxisReading>;

  for (const axis of AXIS_IDS) {
    const transitWeights = effectiveTransitWeights(axis, reliable);
    const natalWeights = effectiveNatalWeights(axis, reliable);

    // Calcul sur la fenêtre élargie de la marge, pour que le lissage ait des
    // voisins réels aux deux bords. Sans ça, le premier et le dernier jour sont
    // moins lissés que les autres et se retrouvent surreprésentés dans les extrêmes.
    const span = grid.days + 2 * grid.pad;
    const raw = new Array<number>(span).fill(0);
    const rawSelection = new Array<number>(span).fill(0);
    const perDay: DayAspect[][] = Array.from({ length: span }, () => []);

    for (const transit of AXIS_TRANSITS[axis]) {
      const tw = transitWeights[transit];
      if (!tw) continue;
      for (const natal of AXIS_NATALS[axis]) {
        const nw = natalWeights[natal];
        if (!nw) continue;
        const series = grid.cells.get(pairKey(transit, natal));
        if (!series) continue;
        for (let d = 0; d < span; d += 1) {
          const cell = series[d];
          if (!cell) continue;
          const contribution =
            tw * nw * polarity(transit, cell.aspect) * cell.exactness * (1 + (cell.peaking ? PEAK_BONUS : 0));
          raw[d] += contribution;
          rawSelection[d] += transit === 'moon' ? contribution * MOON_SELECTION_FACTOR : contribution;
          perDay[d].push({ ...cell, transit, natal, contribution });
        }
      }
    }

    const window = <T,>(series: T[]): T[] => series.slice(grid.pad, grid.pad + grid.days);
    const scores = normalizeSmoothed(window(smooth(raw)));
    const significance = normalizeSmoothed(window(smooth(rawSelection)));
    const rawWindow = window(raw);
    const aspectsWindow = window(perDay);

    const dayList: AxisDay[] = window(grid.dates).map((date, d) => ({
      day: d,
      date,
      score: scores[d],
      raw: rawWindow[d],
      significance: significance[d],
      aspects: aspectsWindow[d].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    }));

    axes[axis] = {
      axis,
      days: dayList,
      best: selectDates(significance, {
        count: 5, order: 'best', threshold: BEST_THRESHOLD,
        eventKey: (d) => eventKeyOf(primaryAspect(dayList[d], 'best')),
      }),
      worst: selectDates(significance, {
        count: 3, order: 'worst', threshold: WORST_THRESHOLD,
        eventKey: (d) => eventKeyOf(primaryAspect(dayList[d], 'worst')),
      }),
      backdrop: findBackdrop(axis, dayList, transitWeights, natalWeights),
    };
  }

  return {
    chart,
    startDate,
    days,
    zone,
    axes,
    seasons: grid.seasons.slice(grid.pad, grid.pad + grid.days),
    stats: {
      comparisonsTested: grid.comparisonsTested,
      aspectDays: grid.aspectDays,
      aspectEvents: grid.aspectEvents,
    },
  };
}

const SLOW: ReadonlySet<PlanetId> = new Set<PlanetId>(['saturn', 'jupiter']);

/**
 * Transit lent dominant sur la fenêtre.
 *
 * L'étalement de la normalisation absorbe l'offset constant qu'un transit de
 * Saturne ou de Jupiter produit sur les 90 jours. L'information ne doit pas
 * disparaître pour autant : on la restitue à part, en tête de l'axe.
 */
function findBackdrop(
  axis: AxisId,
  dayList: AxisDay[],
  transitWeights: Partial<Record<PlanetId, number>>,
  natalWeights: Partial<Record<PointId, number>>,
): DayAspect | null {
  const tally = new Map<string, { count: number; best: DayAspect; weight: number }>();
  for (const day of dayList) {
    for (const a of day.aspects) {
      if (!SLOW.has(a.transit)) continue;
      const key = `${a.transit}|${a.aspect}|${a.natal}`;
      const weight = (transitWeights[a.transit] ?? 0) * (natalWeights[a.natal] ?? 0);
      const entry = tally.get(key);
      if (!entry) {
        tally.set(key, { count: 1, best: a, weight });
      } else {
        entry.count += 1;
        if (a.orb < entry.best.orb) entry.best = a;
      }
    }
  }
  let winner: { count: number; best: DayAspect; weight: number } | null = null;
  for (const entry of tally.values()) {
    const score = entry.count * entry.weight;
    if (!winner || score > winner.count * winner.weight) winner = entry;
  }
  return winner ? winner.best : null;
}
