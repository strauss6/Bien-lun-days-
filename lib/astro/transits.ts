import type { AxisId, GridCell, NatalChart, PlanetId, PointId, Season } from './types';
import { findAspect } from './aspects';
import { longitudeOf, longitudeAndSpeed } from './ephemeris';
import { addCivilDays, localHourInstant, localNoonInstant } from './zone';
import { signOf } from './angles';

/**
 * Planètes en transit retenues par axe.
 *
 * L'axe Amour porte le Soleil en plus de Vénus, Mars, Jupiter et la Lune, et
 * vise aussi le Mars natal. Ce n'est pas un élargissement gratuit : sur 90 jours
 * Vénus parcourt ~110°, Mars ~50° et Jupiter ~8°, ce qui ne produit pas cinq
 * événements *distincts* vers quatre points natals — deux thèmes de contrôle sur
 * huit ne pouvaient pas livrer cinq dates Amour. Le Soleil sur le Vénus ou le
 * Descendant natal est par ailleurs une configuration relationnelle classique,
 * et le couple Vénus–Mars est le cœur du sujet.
 */
export const AXIS_TRANSITS: Record<AxisId, PlanetId[]> = {
  business: ['jupiter', 'saturn', 'mercury', 'sun'],
  love: ['venus', 'mars', 'jupiter', 'moon', 'sun'],
  energy: ['mars', 'saturn', 'sun', 'moon'],
};

/** Points natals visés par axe. */
export const AXIS_NATALS: Record<AxisId, PointId[]> = {
  business: ['sun', 'mc', 'mercury', 'jupiter'],
  love: ['venus', 'moon', 'dsc', 'sun', 'mars'],
  energy: ['asc', 'sun', 'mars', 'moon'],
};

export const AXIS_LABELS: Record<AxisId, string> = {
  business: 'Business',
  love: 'Amour',
  energy: 'Énergie',
};

export const AXIS_IDS: AxisId[] = ['business', 'love', 'energy'];

export function pairKey(transit: PlanetId, natal: PointId): string {
  return `${transit}|${natal}`;
}

/** Toutes les paires (transit, point natal) utilisées par au moins un axe. */
export function allPairs(): Array<{ transit: PlanetId; natal: PointId }> {
  const seen = new Set<string>();
  const out: Array<{ transit: PlanetId; natal: PointId }> = [];
  for (const axis of AXIS_IDS) {
    for (const transit of AXIS_TRANSITS[axis]) {
      for (const natal of AXIS_NATALS[axis]) {
        const key = pairKey(transit, natal);
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ transit, natal });
        }
      }
    }
  }
  return out;
}

/** Nombre de combinaisons réellement testées — le chiffre affiché à l'écran de calcul. */
export function comparisonsTested(days: number): number {
  let pairsPerAxis = 0;
  for (const axis of AXIS_IDS) {
    pairsPerAxis += AXIS_TRANSITS[axis].length * AXIS_NATALS[axis].length;
  }
  return pairsPerAxis * 5 * days;
}

export interface TransitGrid {
  /** Nombre de jours restitués à l'utilisateur. */
  days: number;
  /** Marge de calcul de chaque côté de la fenêtre : le lissage a besoin de voisins réels. */
  pad: number;
  /** Dates locales `YYYY-MM-DD`, une par jour. */
  dates: string[];
  /** Instant échantillonné, midi local. */
  samples: number[];
  /** Longitude du Soleil chaque jour — sert à la teinte saisonnière du ruban. */
  sunLon: number[];
  seasons: Season[];
  /** Une série de 90 cases par paire. */
  cells: Map<string, Array<GridCell | null>>;
  comparisonsTested: number;
  aspectDays: number;
  aspectEvents: number;
}

const SEASON_OF_SIGN: Season[] = [
  'spring', 'spring', 'spring',
  'summer', 'summer', 'summer',
  'autumn', 'autumn', 'autumn',
  'winter', 'winter', 'winter',
];

/**
 * Grille des transits sur la fenêtre.
 *
 * Échantillonnage à midi local pour les planètes lentes. La Lune avance de 13°
 * par jour : un seul échantillon à midi manquerait un aspect exact à 20 h, on
 * la prend donc à 0 h, midi et 24 h et on retient le meilleur orbe du jour.
 */
export function buildTransitGrid(options: {
  chart: NatalChart;
  zone: string;
  startDate: string;
  days?: number;
  pad?: number;
}): TransitGrid {
  const { chart, zone, startDate } = options;
  const days = options.days ?? 90;
  const pad = options.pad ?? 1;
  const spanDays = days + 2 * pad;
  const firstDate = addCivilDays(startDate, -pad);
  const pairs = allPairs();
  const transitBodies = Array.from(new Set(pairs.map((p) => p.transit)));

  const dates: string[] = [];
  const samples: number[] = [];
  const sunLon: number[] = [];
  const seasons: Season[] = [];
  const cells = new Map<string, Array<GridCell | null>>();
  for (const p of pairs) cells.set(pairKey(p.transit, p.natal), new Array(spanDays).fill(null));

  for (let d = 0; d < spanDays; d += 1) {
    const date = addCivilDays(firstDate, d);
    const noon = localNoonInstant(zone, date);
    dates.push(date);
    samples.push(noon);

    // Longitudes du jour. La Lune est échantillonnée trois fois.
    const lon: Partial<Record<PlanetId, number[]>> = {};
    const retro: Partial<Record<PlanetId, boolean>> = {};
    for (const body of transitBodies) {
      if (body === 'moon') {
        lon.moon = [
          longitudeOf('moon', new Date(localHourInstant(zone, date, 0))),
          longitudeOf('moon', new Date(noon)),
          longitudeOf('moon', new Date(localHourInstant(zone, addCivilDays(date, 1), 0))),
        ];
        retro.moon = false;
      } else {
        const { lon: l, speed } = longitudeAndSpeed(body, new Date(noon));
        lon[body] = [l];
        retro[body] = speed < 0;
      }
    }
    sunLon.push(lon.sun ? lon.sun[0] : longitudeOf('sun', new Date(noon)));
    seasons.push(SEASON_OF_SIGN[signOf(sunLon[d])]);

    for (const { transit, natal } of pairs) {
      const natalLon = chart.points[natal].lon;
      let best: GridCell | null = null;
      for (const l of lon[transit] as number[]) {
        const hit = findAspect(l, natalLon);
        if (hit && (best === null || hit.orb < best.orb)) {
          best = { ...hit, retrograde: retro[transit] ?? false, peaking: false };
        }
      }
      cells.get(pairKey(transit, natal))![d] = best;
    }
  }

  // Second passage : le jour de l'exact est un minimum local d'orbe. C'est ce
  // qui empêche un transit lent de trois semaines de produire un plateau.
  let aspectDays = 0;
  let aspectEvents = 0;
  for (const series of cells.values()) {
    for (let d = 0; d < spanDays; d += 1) {
      const cell = series[d];
      if (!cell) continue;
      const inWindow = d >= pad && d < pad + days;
      if (inWindow) aspectDays += 1;
      const prev = series[d - 1];
      const next = series[d + 1];
      if (inWindow && (!prev || prev.aspect !== cell.aspect)) aspectEvents += 1;
      const beforeOrb = prev && prev.aspect === cell.aspect ? prev.orb : Infinity;
      const afterOrb = next && next.aspect === cell.aspect ? next.orb : Infinity;
      cell.peaking = cell.orb < beforeOrb && cell.orb <= afterOrb;
    }
  }

  return {
    days, pad, dates, samples, sunLon, seasons, cells,
    comparisonsTested: comparisonsTested(days),
    aspectDays,
    aspectEvents,
  };
}
