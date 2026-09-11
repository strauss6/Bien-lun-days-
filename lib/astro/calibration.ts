import type { AxisId, NatalChart } from './types';
import { AXIS_IDS, buildTransitGrid } from './transits';
import {
  SCORE_CEILING, SCORE_FLOOR, accumulate, effectiveNatalWeights, effectiveTransitWeights,
  median, medianAbsoluteDeviation, smooth,
} from './scoring';

/**
 * Étalonnage des scores.
 *
 * **Le problème.** Jusqu'au 11 septembre 2026, l'échelle était dérivée de la
 * fenêtre affichée : médiane, écart et bornes calculés sur les trente jours
 * qu'on regardait. Un même jour changeait donc de score selon qu'on l'ouvrait
 * dans la vue du jour, dans les trois jours ou dans le mois — et il changeait
 * encore le lendemain, la fenêtre ayant glissé d'un cran. Pour un produit qu'on
 * ouvre tous les matins, c'est disqualifiant : le score cesse d'être une mesure
 * et devient un artefact d'affichage.
 *
 * **Le choix.** L'échelle est calculée une fois par thème, sur une **période de
 * référence fixe**, et ne dépend plus jamais de ce qui est affiché. Elle reste
 * propre à la personne — la règle du projet n'a pas changé, une échelle absolue
 * rendrait la moitié des rapports plats — mais elle est désormais **la même pour
 * toutes les vues et tous les jours**.
 *
 * **La période de référence.** 780 jours à partir d'une époque fixe. 780 jours,
 * c'est un cycle synodique de Mars complet : sur une période plus courte, l'axe
 * Énergie serait étalonné sur une demi-révolution de sa planète dominante et un
 * profil sortirait systématiquement haut ou bas. Sur cette durée, le Soleil, la
 * Lune, Mercure, Vénus et Mars couvrent tous leurs positions relatives.
 *
 * **Ce que ce choix coûte.** Jupiter et Saturne, eux, ne bouclent pas en 780
 * jours : l'étalonnage voit une seule de leurs configurations. Quelqu'un qui
 * traverse en 2031 un carré durable de Saturne verra ses scores Business
 * durablement bas, mesurés contre une distribution de 2026. C'est assumé, et
 * c'est même la lecture juste : une période difficile *est* une période
 * difficile, et la fabriquer plate pour flatter serait mentir. C'est aussi ce
 * qui permet au produit de dire « ça dure » au lieu d'inventer une nouveauté
 * chaque matin.
 *
 * **Les bornes sont des percentiles, pas des extrêmes.** Deux ans de journées
 * contiennent des valeurs aberrantes ; caler 3 et 97 dessus écraserait toutes
 * les autres au milieu et le ruban serait plat. On cale sur les centiles 2 et
 * 98, et on borne au-delà : environ 4 % des jours d'une vie touchent le plancher
 * ou le plafond, ce qui est exactement ce qu'on veut d'un jour exceptionnel.
 *
 * **Version.** `SCORE_METHOD` accompagne chaque rapport. Un résultat enregistré
 * avec une autre méthode se recalcule au lieu de se mélanger silencieusement.
 */

/**
 * Identité de la méthode de score.
 *
 * À changer dès que l'étalonnage, les poids, les orbes ou la courbe de
 * compression bougent : c'est ce qui distingue « ce rapport est à jour » de
 * « ce rapport a été calculé autrement ».
 */
export const SCORE_METHOD = 'stable-780-v1';

/** Début de la période de référence. Fixe : il ne suit pas la date du jour. */
export const CALIBRATION_EPOCH = '2026-01-01';
/** Un cycle synodique de Mars — 779,94 jours, arrondi. */
export const CALIBRATION_DAYS = 780;
/** Centiles servant de bornes basse et haute. */
export const CALIBRATION_LOW_PERCENTILE = 2;
export const CALIBRATION_HIGH_PERCENTILE = 98;
/** Largeur de la compression, en écarts robustes. */
export const COMPRESSION_WIDTH = 2.2;

export interface Scale {
  /** Centre de la distribution de la personne. */
  median: number;
  /** Écart robuste — MAD normalisée. */
  scale: number;
  /** Bornes de la valeur comprimée, aux centiles de référence. */
  lo: number;
  hi: number;
}

export interface Calibration {
  method: string;
  /** Une échelle pour le score affiché, une pour la série qui sert au classement. */
  axes: Record<AxisId, { score: Scale; selection: Scale }>;
}

/** Compression : centre, réduit, puis écrase les queues sans les couper. */
export function compress(value: number, { median: med, scale }: Scale): number {
  return Math.tanh((value - med) / (COMPRESSION_WIDTH * scale));
}

/** Valeur comprimée ramenée sur l'échelle 3–97, bornée aux extrêmes. */
export function applyScale(value: number, s: Scale): number {
  const span = s.hi - s.lo;
  if (span < 1e-9) return (SCORE_FLOOR + SCORE_CEILING) / 2;
  const t = (compress(value, s) - s.lo) / span;
  return SCORE_FLOOR + (SCORE_CEILING - SCORE_FLOOR) * Math.min(1, Math.max(0, t));
}

export function applyCalibration(series: number[], s: Scale): number[] {
  return series.map((v) => applyScale(v, s));
}

function percentile(sorted: number[], p: number): number {
  const i = ((sorted.length - 1) * p) / 100;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function scaleOf(smoothed: number[]): Scale {
  const med = median(smoothed);
  const mad = 1.4826 * medianAbsoluteDeviation(smoothed, med);
  const spread = mad > 1e-9
    ? mad
    : Math.max(1e-9, Math.max(...smoothed.map((v) => Math.abs(v - med))));
  const base: Scale = { median: med, scale: spread, lo: 0, hi: 0 };
  const compressed = smoothed.map((v) => compress(v, base)).sort((a, b) => a - b);
  return {
    ...base,
    lo: percentile(compressed, CALIBRATION_LOW_PERCENTILE),
    hi: percentile(compressed, CALIBRATION_HIGH_PERCENTILE),
  };
}

/**
 * Étalonne un thème sur la période de référence.
 *
 * Coûte environ un quart de seconde. Le fuseau n'entre que dans le découpage des
 * journées civiles : il ne déplace pas la distribution, mais on le garde dans la
 * clé de cache pour que deux profils de fuseaux différents ne se partagent pas
 * un étalonnage à une demi-journée près.
 */
export function computeCalibration(chart: NatalChart, zone: string): Calibration {
  const grid = buildTransitGrid({
    chart, zone, startDate: CALIBRATION_EPOCH, days: CALIBRATION_DAYS,
  });
  const reliable = chart.anglesReliable;
  const axes = {} as Calibration['axes'];

  for (const axis of AXIS_IDS) {
    const { raw, rawSelection } = accumulate(
      grid, axis, effectiveTransitWeights(axis, reliable), effectiveNatalWeights(axis, reliable),
    );
    // La marge de lissage est gardée ici : sur 780 jours, deux valeurs de bord
    // ne changent rien à la distribution, et les retirer coûterait une copie.
    axes[axis] = { score: scaleOf(smooth(raw)), selection: scaleOf(smooth(rawSelection)) };
  }

  return { method: SCORE_METHOD, axes };
}

/*
 * Mémoire de l'étalonnage, par thème.
 *
 * Un quart de seconde par thème, et le même thème revient à chaque requête d'un
 * même utilisateur. La clé décrit le thème et non la personne : deux profils
 * identiques partagent légitimement la même échelle.
 */
const cache = new Map<string, Calibration>();
const MAX_CACHED = 200;

function keyOf(chart: NatalChart, zone: string): string {
  return `${SCORE_METHOD}|${zone}|${chart.anglesReliable}|`
    + Object.entries(chart.points)
      .map(([id, point]) => `${id}:${point.lon.toFixed(4)}`)
      .join(',');
}

export function calibrationFor(chart: NatalChart, zone: string): Calibration {
  const key = keyOf(chart, zone);
  const hit = cache.get(key);
  if (hit) return hit;
  const fresh = computeCalibration(chart, zone);
  // Éviction la plus simple qui tienne : le cache sert un pic de requêtes, pas
  // une population. Une politique LRU coûterait plus à maintenir qu'à gagner.
  if (cache.size >= MAX_CACHED) cache.clear();
  cache.set(key, fresh);
  return fresh;
}
