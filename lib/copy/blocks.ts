import type { AspectId, AxisId, PlanetId, PointId } from '../astro/types';

/**
 * Briques d'interprétation.
 *
 * Écrire 555 textes à la main est un travail de six semaines. Écrire les briques
 * dont ils sont faits en est un d'une demi-journée : ce que signifie chaque
 * planète *quand elle passe*, ce que fait chaque aspect, ce que représente chaque
 * point *natal*, et ce que chaque axe demande. Le modèle compose ensuite les
 * feuilles à partir des briques et d'exemples rédigés en entier, et le rédacteur
 * corrige au lieu d'écrire.
 *
 * Les valeurs ci-dessous sont des amorces de travail, pas le corpus final :
 * elles servent à cadrer la feuille de rédaction et à faire tourner la
 * composition avant que le rédacteur ait rendu ses textes.
 */

export interface Block<K extends string> {
  key: K;
  label: string;
  /** Question posée au rédacteur. */
  prompt: string;
  /** Amorce, à remplacer par le texte du rédacteur. */
  draft: string;
}

export const TRANSIT_BLOCKS: Array<Block<PlanetId>> = [
  { key: 'sun', label: 'Soleil en transit', prompt: 'Que met en lumière le Soleil quand il passe sur un point du thème ?', draft: 'Met en lumière. Ce qui était latent devient visible, pour une journée.' },
  { key: 'moon', label: 'Lune en transit', prompt: 'Que fait la Lune, qui repasse chaque mois ?', draft: 'Colore l\'humeur du jour. Rapide, sans lendemain.' },
  { key: 'mercury', label: 'Mercure en transit', prompt: 'Que déclenche Mercure ?', draft: 'Fait circuler l\'information : conversations, papiers, décisions à écrire.' },
  { key: 'venus', label: 'Vénus en transit', prompt: 'Que fait Vénus quand elle touche un point du thème ?', draft: 'Rend la négociation facile, l\'accord évident, le prix acceptable.' },
  { key: 'mars', label: 'Mars en transit', prompt: 'Que fait Mars ?', draft: 'Met en mouvement, avec friction. Rien ne se fait sans pousser.' },
  { key: 'jupiter', label: 'Jupiter en transit', prompt: 'Que fait Jupiter, qui revient tous les douze ans ?', draft: 'Ouvre. Ce qu\'on entreprend prend de l\'ampleur ; ce qu\'on néglige aussi.' },
  { key: 'saturn', label: 'Saturne en transit', prompt: 'Que fait Saturne, en bien comme en mal ?', draft: 'Structure, ou pèse. Construit dans le temps quand il aide, retarde quand il contrarie.' },
  { key: 'uranus', label: 'Uranus en transit', prompt: 'Que fait Uranus, une fois par vie sur un point donné ?', draft: 'Fait bifurquer. Ce qui vient n\'était pas au programme.' },
  { key: 'neptune', label: 'Neptune en transit', prompt: 'Que fait Neptune ?', draft: 'Dissout les contours. Inspire ou brouille, rarement les deux à la fois.' },
  { key: 'pluto', label: 'Pluton en transit', prompt: 'Que fait Pluton, qui ne passe qu\'une fois ?', draft: 'Transforme sans retour possible. On ne remet pas les choses comme avant.' },
];

export const ASPECT_BLOCKS: Array<Block<AspectId>> = [
  { key: 'conjunction', label: 'Conjonction (0°)', prompt: 'Que veut dire « la planète arrive dessus » ?', draft: 'Fusion. La planète prend le point en charge, pour le meilleur ou le pire selon laquelle.' },
  { key: 'sextile', label: 'Sextile (60°)', prompt: 'En quoi un sextile diffère d\'un trigone ?', draft: 'Occasion offerte, mais qui demande d\'être saisie. Rien ne tombe tout seul.' },
  { key: 'square', label: 'Carré (90°)', prompt: 'Qu\'impose un carré ?', draft: 'Obstacle qui force à trancher. Ce qui bloque indique quoi corriger.' },
  { key: 'trine', label: 'Trigone (120°)', prompt: 'Que donne un trigone ?', draft: 'Fluidité. Les choses se font sans résistance, parfois sans effort suffisant.' },
  { key: 'opposition', label: 'Opposition (180°)', prompt: 'Que met en face une opposition ?', draft: 'Face-à-face. Quelqu\'un ou quelque chose d\'extérieur impose l\'arbitrage.' },
];

export const NATAL_BLOCKS: Array<Block<PointId>> = [
  { key: 'sun', label: 'Soleil natal', prompt: 'Que touche-t-on en touchant le Soleil natal ?', draft: 'Ce que tu es au centre : ta direction, ton autorité, ce que tu incarnes.' },
  { key: 'moon', label: 'Lune natale', prompt: 'Que représente la Lune natale ?', draft: 'Ton rythme intime, ce dont tu as besoin pour tenir.' },
  { key: 'mercury', label: 'Mercure natal', prompt: 'Que représente Mercure natal ?', draft: 'Ta façon de penser, de parler, de contracter.' },
  { key: 'venus', label: 'Vénus natale', prompt: 'Que représente Vénus natale ?', draft: 'Ce que tu aimes et ce que tu vaux — affectif et tarif, même planète.' },
  { key: 'mars', label: 'Mars natal', prompt: 'Que représente Mars natal ?', draft: 'Ta manière d\'attaquer, ton moteur, ta colère utile.' },
  { key: 'jupiter', label: 'Jupiter natal', prompt: 'Que représente Jupiter natal ?', draft: 'Là où tu grandis, et où tu en fais trop.' },
  { key: 'saturn', label: 'Saturne natal', prompt: 'Que représente Saturne natal ?', draft: 'Ce que tu construis lentement, et ce qui te freine depuis toujours.' },
  { key: 'uranus', label: 'Uranus natal', prompt: 'Que représente Uranus natal ?', draft: 'Ton besoin d\'indépendance, ton originalité.' },
  { key: 'neptune', label: 'Neptune natal', prompt: 'Que représente Neptune natal ?', draft: 'Ton imaginaire, tes illusions.' },
  { key: 'pluto', label: 'Pluton natal', prompt: 'Que représente Pluton natal ?', draft: 'Ta capacité à repartir de zéro.' },
  { key: 'asc', label: 'Ascendant', prompt: 'Que touche-t-on en touchant l\'Ascendant ?', draft: 'Ton allure, ta façon d\'entrer dans une pièce, le corps.' },
  { key: 'mc', label: 'Milieu du Ciel', prompt: 'Que représente le Milieu du Ciel ?', draft: 'Ta carrière, ta réputation, ce pour quoi on te connaît.' },
  { key: 'dsc', label: 'Descendant', prompt: 'Que représente le Descendant ?', draft: 'L\'autre : associé, conjoint, partie adverse. Tout ce qui se signe à deux.' },
  { key: 'ic', label: 'Fond du Ciel', prompt: 'Que représente le Fond du Ciel ?', draft: 'Ta base, ta famille, ce d\'où tu viens.' },
];

export const AXIS_BLOCKS: Array<Block<AxisId>> = [
  { key: 'business', label: 'Axe Business', prompt: 'Qu\'est-ce qu\'un bon jour Business demande de faire, concrètement ?', draft: 'Négocier, lancer, signer, demander. Une action, pas une intention.' },
  { key: 'love', label: 'Axe Amour', prompt: 'Qu\'est-ce qu\'un bon jour Amour demande de faire ?', draft: 'Rencontrer, se déclarer, réconcilier. Jamais de promesse sur autrui.' },
  { key: 'energy', label: 'Axe Énergie', prompt: 'Qu\'est-ce qu\'un jour Énergie dit — sans jamais parler de santé ?', draft: 'Pousser fort, ou lever le pied. Rythme et élan, jamais un symptôme ni un traitement.' },
];

export function blockCount(): number {
  return TRANSIT_BLOCKS.length + ASPECT_BLOCKS.length + NATAL_BLOCKS.length + AXIS_BLOCKS.length;
}
