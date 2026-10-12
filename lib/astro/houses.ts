import type { AxisId, NatalChart, PlanetId, PointId } from './types';
import { HOUSE_TOPICS, rulerOfHouse } from './rulers';

/**
 * Les maisons, enfin branchées sur les scores.
 *
 * ## Le constat qui a déclenché ce fichier
 *
 * Le moteur calculait les douze maisons depuis le début, les rangeait dans le
 * thème, et ne les relisait **jamais**. Le mot `house` n'apparaissait nulle part
 * dans le calcul des scores, et `rulers.ts` n'était appelé que par un test.
 *
 * Conséquence mesurée le 11 octobre 2026 sur un thème réel : l'axe Business
 * sortait à 7 sur 100 parce que Saturne opposait un Jupiter natal — un Jupiter
 * **en maison 9**, l'étranger et la conviction, pas la carrière. Pendant ce temps
 * Jupiter en transit traversait la maison 7 du même thème, « tout contrat signé
 * avec quelqu'un d'autre », pendant neuf mois. L'astrologue qui avait lu ce thème
 * annonçait une bonne année ; le moteur annonçait une année à 7 sur 100. Les deux
 * ne mesuraient pas la même chose.
 *
 * C'est aussi une faille de promesse : le produit se vend sur l'heure exacte de
 * naissance, or **le seul vrai bénéfice de l'heure exacte, ce sont l'Ascendant et
 * les maisons**. Les calculer puis les ignorer, c'est demander l'information la
 * plus difficile à obtenir et en jeter l'essentiel.
 *
 * ## Ce que dit le rédacteur du corpus, et ce qu'on en fait
 *
 * Trois choses, toutes de lui, consignées dans `docs/05-corpus-livraison-1.md`.
 *
 * **« Le domaine dépend de la maison touchée. »** Dit du carré, vrai de tout
 * aspect. Un aspect sur un point natal logé dans une maison étrangère à l'axe ne
 * doit pas peser autant que sur un point logé dans sa maison principale. C'est
 * `houseAffinity`.
 *
 * **« Si la maison 7 tombe en Cancer, son maître est la Lune ; un bon aspect à la
 * Lune est alors un bon aspect sur un partenariat. »** Une couche d'indirection
 * entre un point natal et un domaine, **propre à chaque personne** — et c'est
 * exactement ce qui manquait à un produit dont les poids étaient les mêmes pour
 * tout le monde. C'est `houseRulerWeights`.
 *
 * **« Quatre maisons sont importantes : 1, 4, 7, 10 »**, assortie de sa mise en
 * garde : « il ne faut pas qu'il se fie **qu'à** l'Ascendant, ou à la maison 10,
 * ou à la 7, ou à la 4. Ce sont les quatre importantes, mais il y en a d'autres,
 * et il faut les prendre en compte. » D'où des maisons secondaires par axe, à
 * poids réduit, marquées comme inférées.
 */

/** Même convention de provenance que `lib/copy/blocks.ts` : à relire avant de s'y fier. */
export type HouseSource = 'direct' | 'inféré';

export interface AxisHouse {
  house: number;
  /** Part de l'axe que cette maison porte, 1 pour la principale. */
  weight: number;
  source: HouseSource;
  /** Pourquoi cette maison, et d'où vient la phrase. */
  why: string;
}

/**
 * Les maisons que chaque axe interroge.
 *
 * `direct` : la maison et son domaine sont de la main du rédacteur. `inféré` :
 * nous l'avons rattachée à l'axe, sur la foi de son tableau des douze maisons et
 * de sa consigne de ne pas s'en tenir aux quatre angulaires. Cinq des neuf
 * entrées sont inférées, et c'est la première chose à lui faire relire.
 */
export const AXIS_HOUSES: Record<AxisId, AxisHouse[]> = {
  business: [
    { house: 10, weight: 1.0, source: 'direct', why: 'le travail, la réputation' },
    { house: 7, weight: 0.6, source: 'direct', why: 'tout contrat signé avec quelqu’un d’autre' },
    { house: 2, weight: 0.5, source: 'inféré', why: 'ton argent, ce que tu produis' },
    { house: 6, weight: 0.35, source: 'inféré', why: 'ton travail au quotidien' },
  ],
  love: [
    { house: 7, weight: 1.0, source: 'direct', why: 'les associés, les partenaires, le couple' },
    { house: 4, weight: 0.5, source: 'direct', why: 'la famille — « l’affectif avec toute personne, famille comprise »' },
    { house: 5, weight: 0.45, source: 'inféré', why: 'ce que tu crées, ce que tu joues' },
  ],
  energy: [
    { house: 1, weight: 1.0, source: 'direct', why: 'l’allure, la façon d’entrer dans une pièce' },
    { house: 6, weight: 0.5, source: 'inféré', why: 'ton travail au quotidien, ton hygiène' },
    { house: 8, weight: 0.3, source: 'inféré', why: 'ce que tu transformes' },
  ],
};

/**
 * Poids d'un maître de maison, rapporté aux points natals fixes de l'axe.
 *
 * Les poids fixes culminent à 1. Un maître de maison principale en vaut la
 * moitié : il personnalise la lecture sans renverser les ancrages que le moteur
 * tenait jusqu'ici et sur lesquels tout l'étalonnage a été vérifié. C'est un
 * choix de dosage, pas une déduction — à faire trancher par le rédacteur.
 */
export const RULER_SHARE = 0.5;

/**
 * Plancher d'affinité : ce qu'il reste à un aspect dont le point natal est logé
 * dans une maison étrangère à l'axe.
 *
 * À 0,7, la maison module d'au plus 30 %. Volontairement prudent : la maison
 * nuance le domaine d'un aspect, elle ne l'annule pas — un Saturne exact sur un
 * Soleil reste un Saturne exact sur un Soleil, où qu'il tombe.
 */
export const HOUSE_FLOOR = 0.7;

/** Poids de maison pour un axe, 0 si l'axe ne l'interroge pas. */
export function houseWeight(axis: AxisId, house: number): number {
  return AXIS_HOUSES[axis].find((h) => h.house === house)?.weight ?? 0;
}

/**
 * Les maîtres des maisons de l'axe, avec leur poids de point natal.
 *
 * Deux maisons du même axe peuvent avoir le même maître — maison 10 en Scorpion
 * et maison 2 en Scorpion n'arrive pas, mais maison 10 en Bélier et maison 2 en
 * Scorpion partagent Mars en maîtrise traditionnelle. Les poids s'additionnent
 * alors, ce qui est le résultat juste : cette planète porte deux domaines.
 */
export function houseRulerWeights(chart: NatalChart, axis: AxisId): Partial<Record<PointId, number>> {
  const out: Partial<Record<PointId, number>> = {};
  for (const { house, weight } of AXIS_HOUSES[axis]) {
    const ruler = rulerOfHouse(chart, house);
    out[ruler] = (out[ruler] ?? 0) + weight * RULER_SHARE;
  }
  return out;
}

/**
 * Combien un point natal compte pour cet axe, selon la maison qu'il occupe.
 *
 * « Le domaine dépend de la maison touchée. » Entre `HOUSE_FLOOR` et 1.
 */
export function houseAffinity(chart: NatalChart, axis: AxisId, natal: PointId): number {
  const point = chart.points[natal];
  if (!point) return 1;
  return HOUSE_FLOOR + (1 - HOUSE_FLOOR) * houseWeight(axis, point.house);
}

/**
 * Planètes assez lentes pour qu'une maison soit un fond de période.
 *
 * Mars met deux mois dans un signe, Jupiter un an, Saturne deux ans et demi. En
 * deçà, une « traversée de maison » dure moins qu'une saison : le Soleil change
 * de maison tous les mois, Mercure et Vénus plus souvent encore, la Lune tous les
 * deux jours et demi. Ce ne serait plus un fond, ce serait du bruit.
 */
export const SLOW_ENOUGH: ReadonlySet<PlanetId> = new Set<PlanetId>([
  'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
]);

export interface HouseTransit {
  planet: PlanetId;
  house: number;
  /** Indices dans la fenêtre affichée. */
  from: number;
  to: number;
  /** La traversée déborde la fenêtre : elle a commencé avant, ou continue après. */
  openStart: boolean;
  openEnd: boolean;
  /** Poids de la maison pour cet axe — sert à classer les fonds entre eux. */
  weight: number;
  /** Ce que la maison gouverne, en clair. */
  topic: string;
}

/**
 * Les planètes lentes qui traversent une maison de l'axe pendant la fenêtre.
 *
 * ## Pourquoi c'est du texte et pas un score
 *
 * Ce fond a été mis dans le score le 11 octobre 2026, puis retiré le jour même,
 * sur trois constats. Une valeur constante sur neuf mois ne distingue aucun jour
 * de l'autre ; l'étalonnage, calculé sur la même série, en réabsorbe l'essentiel
 * — trois points gagnés sur cent. Et un jour pouvait devenir le plus bas de la
 * fenêtre alors que ses deux aspects affichés étaient positifs : le score portait
 * une composante invisible à l'écran, ce qu'un test a refusé.
 *
 * Or c'est **exactement** la lecture qu'un astrologue donne en premier — « tu as
 * Jupiter en maison 7 cette année » — et le moteur n'en voyait rien. Elle se dit
 * donc, au lieu de se diluer dans un nombre : même choix que `AxisReading.backdrop`,
 * qui restitue en toutes lettres ce que la normalisation absorbe.
 *
 * Seules les planètes que l'axe interroge déjà comptent : l'axe décide quelles
 * planètes le concernent, la maison décide sur quel domaine elles agissent.
 */
export function houseTransits(
  axis: AxisId,
  houses: Partial<Record<PlanetId, number[]>>,
  planets: readonly PlanetId[],
  pad: number,
  days: number,
): HouseTransit[] {
  const out: HouseTransit[] = [];
  for (const planet of planets) {
    if (!SLOW_ENOUGH.has(planet)) continue;
    const serie = houses[planet];
    if (!serie) continue;

    let debut: number | null = null;
    let maison = 0;
    for (let d = 0; d <= days; d += 1) {
      const h = d < days ? serie[pad + d] : -1;
      if (h === maison && debut !== null) continue;
      if (debut !== null && houseWeight(axis, maison) > 0) {
        out.push({
          planet,
          house: maison,
          from: debut,
          to: d - 1,
          openStart: debut === 0 && serie[pad - 1] === maison,
          openEnd: d === days && serie[pad + days] === maison,
          weight: houseWeight(axis, maison),
          topic: HOUSE_TOPICS[maison],
        });
      }
      debut = d;
      maison = h;
    }
  }
  // Le fond le plus lourd d'abord : c'est celui qui se dit.
  return out.sort((a, b) => b.weight - a.weight || (b.to - b.from) - (a.to - a.from));
}
