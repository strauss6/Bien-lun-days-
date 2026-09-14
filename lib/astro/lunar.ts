import type { DayAspect, GridCell, PointId } from './types';
import { LUNAR_NATALS, type TransitGrid, pairKey } from './transits';
import { PEAK_BONUS, polarity } from './scoring';

/**
 * Le score global du jour, porté par la Lune.
 *
 * **Pourquoi la Lune.** Les trois axes mesurent des domaines — ce qui se négocie,
 * ce qui se dit, ce qui se pousse — et ils sont portés par des planètes lentes
 * dont un même aspect dure des semaines. La journée, elle, a une aiguille des
 * heures : la Lune fait le tour du zodiaque en vingt-sept jours et croise donc
 * l'intégralité du thème chaque mois. C'est la seule planète dont le passage se
 * mesure en heures, et c'est ce qui fait qu'un 11 septembre ne ressemble pas à un
 * 12 septembre.
 *
 * **Sur tout le thème, pas sur un quart.** Le score global suit la Lune sur les
 * quatorze points natals, là où chaque axe n'en regarde que quatre. Une journée
 * ne se juge pas sur un domaine.
 *
 * **Trois quarts Lune, un quart les axes.** Un score global purement lunaire
 * pourrait afficher 20 un jour où les trois axes sont à 85 : l'utilisateur y
 * lirait une panne, pas une nuance. Le quart restant est la moyenne des trois
 * axes déjà calibrés — ils sont sur la même échelle 3–97, donc le mélange est
 * légitime et reste stable d'une vue à l'autre.
 */

/**
 * Poids de chaque point natal quand la Lune vient le toucher.
 *
 * Les luminaires et l'Ascendant d'abord : c'est ce qui se ressent dans la
 * journée. Les planètes lentes du thème comptent peu — la Lune qui passe sur un
 * Pluton natal ne fait pas une journée, elle fait une heure.
 */
export const LUNAR_WEIGHTS: Record<PointId, number> = {
  sun: 1.0,
  moon: 1.0,
  asc: 0.9,
  venus: 0.7,
  mars: 0.7,
  mc: 0.7,
  mercury: 0.6,
  jupiter: 0.6,
  saturn: 0.6,
  dsc: 0.5,
  ic: 0.5,
  uranus: 0.3,
  neptune: 0.3,
  pluto: 0.3,
};

/** Part de la Lune dans le score global. Le reste est la moyenne des trois axes. */
export const LUNAR_SHARE = 0.75;

/**
 * Poids lunaires effectifs.
 *
 * Sans heure de naissance, les quatre axes du thème ne sont pas calculables et
 * la Lune natale n'est connue qu'à ±6° : on les retire ou on les dégrade, comme
 * partout ailleurs dans le moteur, plutôt que de simuler une précision absente.
 */
export function effectiveLunarWeights(anglesReliable: boolean): Partial<Record<PointId, number>> {
  if (anglesReliable) return LUNAR_WEIGHTS;
  const out: Partial<Record<PointId, number>> = {};
  for (const point of LUNAR_NATALS) {
    if (point === 'asc' || point === 'mc' || point === 'dsc' || point === 'ic') continue;
    out[point] = point === 'moon' ? LUNAR_WEIGHTS[point] * 0.5 : LUNAR_WEIGHTS[point];
  }
  return out;
}

/**
 * Série brute de la Lune sur toute la fenêtre élargie.
 *
 * Même forme que `accumulate` pour les axes, et pour la même raison : la valeur
 * lissée d'un jour ne doit pas dépendre de la fenêtre où on le regarde.
 */
export function lunarSeries(
  grid: TransitGrid,
  weights: Partial<Record<PointId, number>>,
): { raw: number[]; perDay: DayAspect[][] } {
  const span = grid.days + 2 * grid.pad;
  const raw = new Array<number>(span).fill(0);
  const perDay: DayAspect[][] = Array.from({ length: span }, () => []);

  for (const natal of LUNAR_NATALS) {
    const w = weights[natal];
    if (!w) continue;
    const series = grid.cells.get(pairKey('moon', natal));
    if (!series) continue;
    for (let d = 0; d < span; d += 1) {
      const cell: GridCell | null = series[d];
      if (!cell) continue;
      const contribution =
        w * polarity('moon', cell.aspect) * cell.exactness * (1 + (cell.peaking ? PEAK_BONUS : 0));
      raw[d] += contribution;
      perDay[d].push({ ...cell, transit: 'moon', natal, contribution });
    }
  }

  for (const day of perDay) day.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return { raw, perDay };
}

/**
 * Score global du jour.
 *
 * Les deux entrées sont déjà sur l'échelle 3–97 et déjà stables : le mélange
 * l'est donc aussi. L'arrondi est fait ici, une fois, pour que l'interface
 * n'ait jamais deux arrondis différents du même jour.
 */
export function overallScore(lunar: number, axisScores: number[]): number {
  const moyenne = axisScores.reduce((s, v) => s + v, 0) / axisScores.length;
  return Math.round(LUNAR_SHARE * lunar + (1 - LUNAR_SHARE) * moyenne);
}

/** Le contact lunaire du jour le plus fort en valeur absolue, s'il y en a un. */
export function dominantLunarAspect(aspects: DayAspect[]): DayAspect | null {
  return aspects[0] ?? null;
}
