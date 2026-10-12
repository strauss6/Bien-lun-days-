/**
 * Jetons de couleur.
 *
 * **Direction révisée le 10 septembre 2026.** La première version faisait vivre
 * l'interface sur deux valeurs, papier et encre, avec la couleur réservée aux
 * saisons. À l'écran, l'ensemble lisait gris : les trois bandes du ruban étaient
 * toutes à l'encre, et un produit qui parle de journées ne peut pas être terne.
 *
 * Nouveau système : **une couleur vive par axe, en dégradé**, sur un fond blanc
 * froid. C'est la grammaire des graphiques d'Apple — une teinte par série, un
 * dégradé dans sa propre famille, beaucoup de blanc autour — et c'est ce qui
 * donne l'impression d'instrument moderne plutôt que d'imprimé.
 *
 * Les axes se distinguent donc désormais par la teinte **et** par le tracé. Les
 * saisons gardent leur couleur, mais réduites à un bandeau fin au-dessus du
 * ruban : elles disent le passage du temps sans concurrencer les axes.
 */

export const PAPER = '#F6F7F9';
export const INK = '#0F1419';
/** Fond des surfaces posées sur le papier — cartes, ruban. */
export const SURFACE = '#FFFFFF';

export interface AxisPalette {
  /**
   * Extrémité profonde du dégradé, et teinte du grand nombre de la carte.
   *
   * Elle porte donc du texte, et doit tenir le seuil du grand texte — 3:1 — sur
   * le blanc des cartes comme sur le papier. C'est la raison pour laquelle
   * l'orangé de l'axe Énergie n'est pas celui d'Apple : `#FF9500` sort à 2,2:1,
   * illisible en caractères. `#D46700` tient 3,7:1 et reste franchement orange.
   */
  deep: string;
  /** Extrémité lumineuse : les scores moyens. */
  bright: string;
  /** Teinte du texte sur fond clair, assez foncée pour rester lisible. */
  text: string;
}

/**
 * Trois familles franchement séparées sur la roue — 232°, 340°, 40° — pour que
 * les bandes se distinguent d'un coup d'œil, y compris en vignette de partage.
 */
export const AXIS_COLORS = {
  business: { deep: '#1E4FFF', bright: '#22D3EE', text: '#1338B8' },
  love: { deep: '#FF2D6F', bright: '#FF9A5B', text: '#C21048' },
  energy: { deep: '#D46700', bright: '#FFC24B', text: '#9A5B00' },
} as const satisfies Record<string, AxisPalette>;

export const SEASON_COLORS = {
  spring: '#34C759',
  summer: '#FFC300',
  autumn: '#FF6B3D',
  winter: '#0A9BE8',
} as const;

export const SEASON_LABELS = {
  spring: 'Printemps', summer: 'Été', autumn: 'Automne', winter: 'Hiver',
} as const;

export type SeasonKey = keyof typeof SEASON_COLORS;

/** Saison d'un signe : celle que le Soleil traverse en le parcourant. */
export const SIGN_SEASON: SeasonKey[] = [
  'spring', 'spring', 'spring',
  'summer', 'summer', 'summer',
  'autumn', 'autumn', 'autumn',
  'winter', 'winter', 'winter',
];

/** Opacité du bandeau de saison : présent, jamais dominant. */
export const SEASON_STRIP_ALPHA = 0.9;

export function mix(hex: string, alpha: number, base = PAPER): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(base);
  const [r2, g2, b2] = parse(hex);
  const blend = (a: number, b: number) => Math.round(a * (1 - alpha) + b * alpha);
  return `#${[blend(r1, r2), blend(g1, g2), blend(b1, b2)]
    .map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
