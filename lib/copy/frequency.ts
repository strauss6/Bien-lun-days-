import { resolveBirthInstant } from '../astro/time';
import { computeNatalChart } from '../astro/natal';
import { computeReading, primaryAspect } from '../astro/scoring';
import { computeLongTransits } from '../astro/backdrop';
import { AXIS_IDS } from '../astro/transits';
import { addCivilDays } from '../astro/zone';
import { allSlots, slotKey, type CopySlot } from './slots';

/**
 * Fréquence réelle d'apparition de chaque emplacement de texte.
 *
 * On simule des rapports sur des thèmes tirés au hasard dans le marché visé, et
 * on compte la part des clients qui liront chaque texte. C'est ce classement qui
 * dicte l'ordre de rédaction : personne n'écrit 555 textes dans un ordre arbitraire.
 */

/** Villes du marché visé : France d'abord, puis francophonie. */
export const MARKET_CITIES: Array<[string, number, number]> = [
  ['Paris', 48.8566, 2.3522], ['Marseille', 43.2965, 5.3698], ['Lyon', 45.764, 4.8357],
  ['Toulouse', 43.6047, 1.4442], ['Nice', 43.7102, 7.262], ['Nantes', 47.2184, -1.5536],
  ['Strasbourg', 48.5734, 7.7521], ['Montpellier', 43.6108, 3.8767], ['Bordeaux', 44.8378, -0.5792],
  ['Lille', 50.6292, 3.0573], ['Rennes', 48.1173, -1.6778], ['Reims', 49.2583, 4.0317],
  ['Fort-de-France', 14.6161, -61.0588], ['Saint-Denis', -20.8823, 55.4504],
  ['Bruxelles', 50.8503, 4.3517], ['Genève', 46.2044, 6.1432], ['Montréal', 45.5019, -73.5674],
  ['Casablanca', 33.5731, -7.5898], ['Alger', 36.7538, 3.0588], ['Dakar', 14.7167, -17.4677],
];

/** Générateur déterministe : la feuille de rédaction doit être reproductible. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RankedSlot {
  slot: CopySlot;
  /** Part des rapports où ce texte est cité comme date du top 5 ou des 3 à éviter. */
  cited: number;
  /** Part des rapports où il apparaît, ne serait-ce que dans le calendrier. */
  seen: number;
  /** Part des rapports où il apparaît comme transit long. */
  long: number;
  priority: number;
}

export function rankSlots(options: {
  charts?: number;
  seed?: number;
  fromDate?: string;
  onProgress?: (done: number, total: number) => void;
}): RankedSlot[] {
  const charts = options.charts ?? 600;
  const rand = mulberry32(options.seed ?? 20260910);
  const fromDate = options.fromDate ?? '2026-09-10';
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];

  const slots = allSlots();
  const stats = new Map<string, { cited: number; seen: number; long: number }>();
  for (const s of slots) stats.set(s.key, { cited: 0, seen: 0, long: 0 });

  for (let i = 0; i < charts; i += 1) {
    const year = 1955 + Math.floor(rand() * 54);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const time = `${String(Math.floor(rand() * 24)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}`;
    const [, lat, lng] = pick(MARKET_CITIES);
    const startDate = addCivilDays(fromDate, Math.floor(rand() * 365));

    const chart = computeNatalChart(resolveBirthInstant({ date, time, lat, lng }), lat, lng);
    const reading = computeReading({ chart, zone: 'Europe/Paris', startDate });

    // Compté par rapport et non par jour : la statistique doit se lire
    // « part des clients qui liront ce texte », pas « nombre d'occurrences ».
    const seenHere = new Set<string>();
    const citedHere = new Set<string>();
    for (const axis of AXIS_IDS) {
      const { days, best, worst } = reading.axes[axis];
      for (const d of days) {
        for (const a of d.aspects) seenHere.add(slotKey(axis, a.transit, a.aspect, a.natal));
      }
      for (const [list, dir] of [[best, 'best'], [worst, 'worst']] as const) {
        for (const d of list) {
          const a = primaryAspect(days[d], dir);
          if (a) citedHere.add(slotKey(axis, a.transit, a.aspect, a.natal));
        }
      }
    }
    const longHere = new Set<string>();
    for (const t of computeLongTransits({ chart, startDate, searchYears: 0.5 })) {
      longHere.add(slotKey('long', t.transit, t.aspect, t.natal));
    }

    const bump = (key: string, field: 'cited' | 'seen' | 'long') => {
      const entry = stats.get(key);
      if (entry) entry[field] += 1;
    };
    for (const k of seenHere) bump(k, 'seen');
    for (const k of citedHere) bump(k, 'cited');
    for (const k of longHere) bump(k, 'long');

    options.onProgress?.(i + 1, charts);
  }

  return slots
    .map((slot) => {
      const s = stats.get(slot.key)!;
      const cited = s.cited / charts;
      const seen = s.seen / charts;
      const long = s.long / charts;
      // Un texte cité comme date, ou porté par un transit long, est lu
      // attentivement ; un texte simplement présent au calendrier est survolé.
      return { slot, cited, seen, long, priority: cited * 3 + long * 3 + seen * 0.5 };
    })
    .sort((a, b) => b.priority - a.priority);
}

/** Nombre d'emplacements à écrire pour couvrir une part donnée de ce qui est lu. */
export function coverageCurve(ranked: RankedSlot[], targets = [50, 60, 70, 80, 90, 95, 99]): Record<number, number> {
  const mass = ranked.map((r) => r.cited + r.long);
  const total = mass.reduce((a, b) => a + b, 0);
  const out: Record<number, number> = {};
  let acc = 0;
  for (const [i, m] of mass.entries()) {
    acc += m;
    for (const t of targets) if (!out[t] && acc / total >= t / 100) out[t] = i + 1;
  }
  for (const t of targets) out[t] ??= ranked.length;
  return out;
}
