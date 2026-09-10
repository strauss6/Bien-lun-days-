/**
 * Jetons de couleur.
 *
 * Deux valeurs portent l'interface entière ; les quatre autres n'existent que
 * pour dire quelle saison le Soleil traverse. Aucune couleur de marque, aucune
 * couleur d'état : la seule vivacité chromatique du produit vient du calendrier.
 */
export const PAPER = '#EFF0EE';
export const INK = '#131518';

export const SEASON_COLORS = {
  spring: '#2C7A3F',
  summer: '#C08E00',
  autumn: '#A5282C',
  winter: '#1C5A96',
} as const;

/** Le jaune ne tient pas le contraste en texte : variante assombrie pour le texte. */
export const SUMMER_TEXT = '#8A6600';

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

/** Teinte de fond du ruban : la saison à 7 % sur le papier. */
export const RIBBON_WASH_ALPHA = 0.07;

export function washOver(hex: string, alpha = RIBBON_WASH_ALPHA, base = PAPER): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(base);
  const [r2, g2, b2] = parse(hex);
  const mix = (a: number, b: number) => Math.round(a * (1 - alpha) + b * alpha);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
