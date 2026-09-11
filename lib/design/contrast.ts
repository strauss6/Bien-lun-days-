/**
 * Contraste, au sens de la norme.
 *
 * Le produit affiche des nombres colorés sur du blanc. Une teinte qui plaît en
 * aplat sur un ruban ne tient pas forcément comme texte : `#FF9500`, l'orangé
 * d'Apple, sort à 2,2:1 sur blanc — illisible au soleil, illisible pour un œil
 * vieillissant. C'est ce module qui l'a montré, et c'est pour ça que la famille
 * Énergie du produit est plus sombre. On mesure au lieu de supposer.
 *
 * Formule WCAG 2.1, à la lettre : luminance relative puis rapport (L+0,05).
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative d'une couleur `#rrggbb`. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste entre deux couleurs, de 1 à 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Seuil AA pour du texte courant. */
export const AA_TEXT = 4.5;
/** Seuil AA pour du grand texte — 24 px, ou 18,66 px en gras. */
export const AA_LARGE = 3;
