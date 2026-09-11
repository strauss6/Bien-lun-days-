import type { AspectId } from '@/lib/astro/types';

/**
 * Les cinq aspects, en polylignes.
 *
 * Ils étaient jusqu'ici composés en Unicode. Une capture l'a montré : `☌` n'existe
 * pas dans Geist Mono, et la police de repli lui substitue un signe qui ressemble
 * à Mars — « Jupiter conjonction Soleil » se lisait « Jupiter Mars Soleil ». Les
 * dessiner soi-même supprime la dépendance à la couverture d'une police et les
 * aligne sur les douze signes : même grille de 24×24, même trait, aucune courbe.
 */

function polygon(cx: number, cy: number, r: number, sides = 14, phase = -Math.PI / 2): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = phase + (i / sides) * Math.PI * 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

export const ASPECT_PATHS: Record<AspectId, string[]> = {
  // Conjonction : le disque et son rayon — les deux corps au même degré.
  conjunction: [polygon(10, 14.5, 4.4), 'M13.1 11.4 L19 5.5'],
  // Sextile : trois axes croisés, soixante degrés entre chacun.
  sextile: [
    'M12 5 L12 19',
    'M6 8.5 L18 15.5',
    'M6 15.5 L18 8.5',
  ],
  // Carré : quatre-vingt-dix degrés.
  square: ['M5.8 5.8 L18.2 5.8 L18.2 18.2 L5.8 18.2 Z'],
  // Trigone : cent vingt degrés.
  trine: ['M12 4.6 L19.4 18.4 L4.6 18.4 Z'],
  // Opposition : deux corps face à face.
  opposition: [polygon(7, 12, 2.8, 12), polygon(17, 12, 2.8, 12), 'M9.9 12 L14.1 12'],
};

export const ASPECT_STROKE = 1.25;
