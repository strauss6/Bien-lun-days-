import type { PlanetId, PointId } from './types';
import { signOf } from './angles';
import type { NatalChart } from './types';

/**
 * Maîtrises des signes.
 *
 * Deux jeux, parce que les deux servent. Le traditionnel est cohérent avec les
 * maisons en signes entiers ; le moderne est celui que pratiquent les
 * astrologues francophones contemporains — Uranus maître du Verseau, Neptune
 * des Poissons, Pluton du Scorpion. On expose les deux et on retient le moderne
 * par défaut.
 */
export const TRADITIONAL_RULERS: PlanetId[] = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter',
];

export const MODERN_RULERS: PlanetId[] = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune',
];

export type RulerSet = 'modern' | 'traditional';

export function rulerOfSign(sign: number, set: RulerSet = 'modern'): PlanetId {
  return (set === 'modern' ? MODERN_RULERS : TRADITIONAL_RULERS)[sign % 12];
}

/**
 * Maître d'une maison en signes entiers : la planète qui gouverne le signe
 * occupant cette maison. C'est le raisonnement de base d'une lecture — pour
 * parler de la famille on regarde le maître de la maison IV et ses aspects,
 * pas seulement les planètes qui s'y trouvent.
 */
export function rulerOfHouse(chart: NatalChart, house: number, set: RulerSet = 'modern'): PlanetId {
  const ascSign = signOf(chart.points.asc.lon);
  return rulerOfSign((ascSign + house - 1) % 12, set);
}

/** Le signe occupant une maison donnée. */
export function signOfHouse(chart: NatalChart, house: number): number {
  return (signOf(chart.points.asc.lon) + house - 1) % 12;
}

/** Domaine de vie de chaque maison, en clair. */
export const HOUSE_TOPICS: Record<number, string> = {
  1: 'toi, ton allure, ta façon d\'entrer dans une pièce',
  2: 'ton argent, ce que tu produis',
  3: 'ce que tu apprends et transmets, ton entourage proche',
  4: 'ta famille, ton point d\'ancrage',
  5: 'ce que tu crées, tes enfants, ce que tu joues',
  6: 'ton travail au quotidien, ton hygiène',
  7: 'tes associations, tes contrats, ton couple',
  8: 'ce que tu transformes, l\'argent des autres',
  9: 'ce que tu explores, l\'étranger, la conviction',
  10: 'ta carrière, ta réputation',
  11: 'tes amis, tes réseaux, tes soutiens',
  12: 'ce que tu ne montres pas',
};

/** Maître de l'Ascendant : la planète qui gouverne toute la lecture. */
export function chartRuler(chart: NatalChart, set: RulerSet = 'modern'): PointId {
  return rulerOfSign(signOf(chart.points.asc.lon), set);
}
