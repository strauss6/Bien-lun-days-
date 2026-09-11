import type { AxisId, Season } from '@/lib/astro/types';
import { SEASON_COLORS } from './tokens';

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
  /** Rayon des extrémités : les colonnes sont des pilules, pas des barres. */
  radius: number;
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
    // Le dégradé porte déjà l'essentiel : l'opacité ne sert qu'à retenir les jours ternes.
    opacity: rising ? 0.55 + 0.45 * intensity : 0.3 + 0.5 * intensity,
  };
}

export function bandMarks(scores: number[], days: number, axis: AxisId): Mark[] {
  const w = columnWidth(days);
  const out: Mark[] = [];

  scores.forEach((score, day) => {
    const { height, y, opacity, rising } = shape(score);
    const x = columnLeft(day, days);

    if (axis === 'business') {
      // Colonne pleine, extrémités arrondies : la barre la plus franche des trois.
      out.push({ x, y, width: w, height, opacity, radius: w / 2 });
      return;
    }

    if (axis === 'love') {
      // Double filet : deux traits fins accolés, la trame se lit comme un tissu.
      const thin = Math.max(w * 0.3, 1);
      out.push({ x, y, width: thin, height, opacity, radius: thin / 2 });
      out.push({ x: x + w - thin, y, width: thin, height, opacity, radius: thin / 2 });
      return;
    }

    // Pile de tirets : la hauteur se compte en unités, comme une graduation.
    const units = Math.max(1, Math.round(height / DASH_PITCH));
    for (let u = 0; u < units; u += 1) {
      const dy = rising ? BASELINE - (u + 1) * DASH_PITCH + (DASH_PITCH - DASH) : BASELINE + u * DASH_PITCH;
      out.push({ x, y: Math.max(0, dy), width: w, height: DASH, opacity, radius: DASH / 2 });
    }
  });

  return out;
}

export interface SeasonStop {
  offset: number;
  color: string;
}

/**
 * Arrêts du dégradé du bandeau de saison.
 *
 * La transition est centrée sur le changement de saison réel — l'équinoxe ou le
 * solstice calculé, pas le premier du mois — et étalée sur quelques jours pour
 * qu'on lise un glissement et non une frontière. Le bandeau est fin et posé
 * au-dessus des bandes : il dit le passage du temps sans concurrencer les axes.
 */
export function seasonStops(seasons: Season[]): SeasonStop[] {
  const spread = 6;
  const colorOf = (s: Season) => SEASON_COLORS[s];
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

/**
 * Une graduation par jour, appuyée et étiquetée une semaine sur sept.
 *
 * Le premier jour se nomme selon ce que la fenêtre représente : « AUJ. » dans le
 * produit, où elle commence aujourd'hui, « J1 » sur une démonstration à dates
 * fixes, où prétendre qu'il s'agit d'aujourd'hui devient faux dès le lendemain.
 */
export function tickPositions(days: number, firstLabel = 'AUJ.'): Tick[] {
  return Array.from({ length: days }, (_, day) => {
    const labelled = day % 7 === 0;
    return {
      day,
      x: columnCenter(day, days),
      labelled,
      label: labelled ? (day === 0 ? firstLabel : `+${day}`) : null,
    };
  });
}

/**
 * Score à partir duquel un jour porte un glyphe sur le ruban.
 *
 * Vit ici et non dans le composant : le scrub au doigt doit vibrer exactement
 * là où l'œil voit un pic, et deux constantes séparées finissent toujours par
 * diverger.
 */
export const PEAK_SCORE = 88;

/**
 * Jour visé par une abscisse, dans le repère du `viewBox`.
 *
 * Inverse de `columnCenter`, mais découpé en **cases** et non en centres : le
 * doigt qui glisse doit changer de jour à mi-chemin entre deux colonnes, pas
 * quand il touche le centre de la suivante. Hors de la zone de tracé, on borne
 * au lieu de refuser — le doigt qui déborde à gauche veut le premier jour.
 */
export function dayAtX(x: number, days: number): number {
  const pitch = PLOT_WIDTH / days;
  const raw = Math.floor((x - LABEL_GUTTER) / pitch);
  return Math.min(days - 1, Math.max(0, raw));
}
