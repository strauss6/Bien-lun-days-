import type { AxisId, Season } from '@/lib/astro/types';
import { SEASON_COLORS, washOver } from './tokens';

/**
 * Géométrie du ruban.
 *
 * Séparée du composant pour être testable sans rendu : c'est ici que se joue la
 * lisibilité de l'objet central du produit. Les trois axes se distinguent par
 * **la position et le mode de tracé**, jamais par la teinte — la couleur reste
 * réservée aux saisons, et le ruban doit rester lisible imprimé en noir et blanc
 * comme en cas de daltonisme.
 */

export const RIBBON_WIDTH = 372;
/**
 * Gouttière de gauche réservée aux noms d'axes.
 *
 * Sans elle, le libellé se superpose aux colonnes des premiers jours et le
 * curseur traverse la première lettre. C'est le rendu qui l'a montré, pas les
 * tests : une capture de conformité vaut une suite d'assertions sur la géométrie.
 */
export const LABEL_GUTTER = 48;
export const PLOT_WIDTH = RIBBON_WIDTH - LABEL_GUTTER;
export const BAND_HEIGHT = 62;
/** Ligne de base : au-dessus, les jours favorables ; en dessous, ceux à éviter. */
export const BASELINE = 38;
const COLUMN_RATIO = 0.56;
const MIN_MARK = 0.8;
/** Hauteur d'un tiret de l'axe Énergie : sa graduation se compte en unités. */
const DASH = 2.2;
const DASH_PITCH = 4;

export interface Mark {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export function columnWidth(days: number): number {
  return (PLOT_WIDTH / days) * COLUMN_RATIO;
}

export function columnCenter(day: number, days: number): number {
  return LABEL_GUTTER + (day + 0.5) * (PLOT_WIDTH / days);
}

function columnLeft(day: number, days: number): number {
  return columnCenter(day, days) - columnWidth(days) / 2;
}

/**
 * Hauteur et opacité d'un jour.
 *
 * Double encodage volontaire : un ruban réduit à 40 px de haut dans une vignette
 * de partage doit rester lisible, et l'opacité seule ne suffit pas à cette taille.
 */
function shape(score: number) {
  const rising = score > 50;
  const intensity = Math.abs(score - 50) / 50;
  const span = rising ? BASELINE - 6 : BAND_HEIGHT - BASELINE - 6;
  const height = Math.max(intensity * span, MIN_MARK);
  return {
    rising,
    intensity,
    height,
    y: rising ? BASELINE - height : BASELINE,
    opacity: rising ? 0.4 + 0.6 * intensity : 0.22 + 0.45 * intensity,
  };
}

export function bandMarks(scores: number[], days: number, axis: AxisId): Mark[] {
  const w = columnWidth(days);
  const out: Mark[] = [];

  scores.forEach((score, day) => {
    const { height, y, opacity, rising } = shape(score);
    const x = columnLeft(day, days);

    if (axis === 'business') {
      // Colonne pleine : le trait le plus appuyé des trois.
      out.push({ x, y, width: w, height, opacity });
      return;
    }

    if (axis === 'love') {
      // Double filet : deux traits fins accolés, la trame se lit comme un tissu.
      const thin = Math.max(w * 0.28, 0.9);
      out.push({ x, y, width: thin, height, opacity });
      out.push({ x: x + w - thin, y, width: thin, height, opacity });
      return;
    }

    // Pile de tirets : la hauteur se compte en unités, comme une graduation.
    const units = Math.max(1, Math.round(height / DASH_PITCH));
    for (let u = 0; u < units; u += 1) {
      const dy = rising ? BASELINE - (u + 1) * DASH_PITCH + (DASH_PITCH - DASH) : BASELINE + u * DASH_PITCH;
      out.push({ x, y: Math.max(0, dy), width: w, height: DASH, opacity });
    }
  });

  return out;
}

export interface SeasonStop {
  offset: number;
  color: string;
}

/**
 * Arrêts du dégradé de fond.
 *
 * La transition est centrée sur le changement de saison réel — l'équinoxe ou le
 * solstice calculé, pas le premier du mois — et étalée sur quelques jours pour
 * qu'on lise un glissement et non une frontière.
 */
export function seasonStops(seasons: Season[]): SeasonStop[] {
  const spread = 6;
  const colorOf = (s: Season) => washOver(SEASON_COLORS[s]);
  const stops: SeasonStop[] = [{ offset: 0, color: colorOf(seasons[0]) }];

  let current = seasons[0];
  seasons.forEach((season, i) => {
    if (season === current) return;
    const at = (i / seasons.length) * 100;
    stops.push({ offset: Math.max(0, at - spread), color: colorOf(current) });
    stops.push({ offset: Math.min(100, at + spread), color: colorOf(season) });
    current = season;
  });

  stops.push({ offset: 100, color: colorOf(current) });
  return stops;
}

export interface Tick {
  day: number;
  x: number;
  labelled: boolean;
  label: string | null;
}

/** Une graduation par jour, appuyée et étiquetée une semaine sur sept. */
export function tickPositions(days: number): Tick[] {
  return Array.from({ length: days }, (_, day) => {
    const labelled = day % 7 === 0;
    return {
      day,
      x: columnCenter(day, days),
      labelled,
      label: labelled ? (day === 0 ? 'AUJ.' : `+${day}`) : null,
    };
  });
}
