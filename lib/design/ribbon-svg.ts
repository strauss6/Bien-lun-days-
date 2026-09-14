import { AXIS_IDS } from '../astro/transits';
import type { AxisId } from '../astro/types';
import {
  BAND_HEIGHT, LABEL_GUTTER, PLOT_WIDTH, RIBBON_WIDTH, bandMarks, seasonStops,
} from './ribbon-geometry';
import { AXIS_COLORS } from './tokens';
import type { RibbonShareDay } from './share-code';

/**
 * Le ruban en SVG pur, sans React.
 *
 * Le composant de l'écran est interactif : gestes, curseur, révélation, glyphes.
 * L'image de partage n'a rien de tout ça — elle a besoin d'une chaîne de
 * caractères. Ce module la produit, **à partir des mêmes fonctions de géométrie**
 * que l'écran : `bandMarks` place les marques ici comme là-bas, `seasonStops`
 * calcule le même dégradé. Une correction de géométrie corrige les deux, et un
 * test vérifie que les marques tombent aux mêmes abscisses.
 *
 * Une seule différence, et c'est un **cadrage**, pas une autre géométrie : la
 * gouttière réservée aux noms d'axes est coupée. L'image de partage ne porte
 * aucun libellé — un prénom, la marque, rien d'autre —, et laisser la gouttière
 * vide décalait tout le ruban vers la droite dans un cadre par ailleurs
 * symétrique. Les marques restent aux abscisses de l'écran ; seule la fenêtre
 * du `viewBox` change.
 */

const SEASON_STRIP = 5;
const BANDS_TOP = SEASON_STRIP + 8;
export const RIBBON_HEIGHT = BANDS_TOP + BAND_HEIGHT * AXIS_IDS.length;
/** Largeur de l'image : la zone de tracé seule, gouttière coupée. */
export const RIBBON_SHARE_WIDTH = PLOT_WIDTH;

export function ribbonSvg(days: RibbonShareDay[]): string {
  const n = days.length;
  const stops = seasonStops(days.map((d) => d.season));

  const gradients = [
    `<linearGradient id="saison" x1="0" x2="1">${stops
      .map((s) => `<stop offset="${s.offset}%" stop-color="${s.color}"/>`).join('')}</linearGradient>`,
    ...AXIS_IDS.map((axis: AxisId) =>
      `<linearGradient id="${axis}" x1="0" y1="0" x2="0" y2="1">`
      + `<stop offset="0%" stop-color="${AXIS_COLORS[axis].deep}"/>`
      + `<stop offset="100%" stop-color="${AXIS_COLORS[axis].bright}"/>`
      + `</linearGradient>`),
  ].join('');

  const bands = AXIS_IDS.map((axis: AxisId, band) => {
    const marks = bandMarks(days.map((d) => d.scores[axis]), n, axis)
      .map((m) => `<rect x="${m.x.toFixed(2)}" y="${m.y.toFixed(2)}" width="${m.width.toFixed(2)}"`
        + ` height="${m.height.toFixed(2)}" rx="${m.radius.toFixed(2)}"`
        + ` fill="url(#${axis})" fill-opacity="${m.opacity.toFixed(3)}"/>`)
      .join('');
    return `<g transform="translate(0 ${BANDS_TOP + band * BAND_HEIGHT})">${marks}</g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg"`
    + ` viewBox="${LABEL_GUTTER} 0 ${PLOT_WIDTH} ${RIBBON_HEIGHT}"`
    + ` width="${PLOT_WIDTH}" height="${RIBBON_HEIGHT}">`
    + `<defs>${gradients}</defs>`
    + `<rect x="${LABEL_GUTTER}" y="0" width="${RIBBON_WIDTH - LABEL_GUTTER}" height="${SEASON_STRIP}"`
    + ` rx="${SEASON_STRIP / 2}" fill="url(#saison)"/>`
    + bands
    + `</svg>`;
}

/** Le même ruban, prêt à être posé dans un `<img src>`. */
export function ribbonDataUri(days: RibbonShareDay[]): string {
  return `data:image/svg+xml;base64,${btoa(ribbonSvg(days))}`;
}
