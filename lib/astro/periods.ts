import type { AxisId } from './types';

/**
 * Les fenêtres d'un trimestre.
 *
 * ## Pourquoi le trimestre ne montre pas des jours
 *
 * À quatre-vingt-dix jours sur un téléphone, une journée fait trois virgule sept
 * pixels. La question n'est plus « combien je fais le 12 novembre » — c'est « quand
 * est-ce que ça vaut le coup ». Mesure à l'appui : sur ce thème, les trois axes
 * changent de sens 13, 25 et 31 fois en 88 jours, le score global du jour 36 fois.
 * Les axes bougent par paliers parce qu'ils sont portés par des planètes lentes
 * dont un même aspect dure des semaines ; le score du jour oscille parce qu'il est
 * porté aux trois quarts par la Lune, qui boucle le zodiaque en vingt-sept jours.
 * Tracé jour par jour sur un trimestre, il ferait une barrière de piquets.
 *
 * **Le trimestre montre donc les axes, et il les montre par fenêtres.** Le score
 * du jour reste ce qu'il est : l'affaire de la vue du jour.
 *
 * ## La ligne neutre ne vient jamais de la fenêtre affichée
 *
 * Une fenêtre est une suite de jours du même côté d'une ligne. Cette ligne est le
 * score de la journée médiane de la personne sur la **période de référence fixe**
 * de l'étalonnage — voir `neutralScore`. La calculer sur les quatre-vingt-dix
 * jours regardés aurait garanti la moitié de fenêtres hautes pour tout le monde,
 * ce qui est joli et faux : un trimestre calme doit ressortir calme. Un thème sur
 * les cinq mesurés n'a aucune fenêtre Business haute du trimestre, et le produit
 * le dit au lieu de meubler.
 *
 * ## Sept jours, pas moins
 *
 * En dessous d'une semaine, ce n'est pas une période, c'est une journée — et la
 * journée a déjà son écran. Sept jours est aussi la plus petite unité autour de
 * laquelle on déplace quelque chose dans un agenda.
 */

export const MIN_PERIOD_DAYS = 7;

export interface AxisPeriod {
  axis: AxisId;
  /** Index du premier et du dernier jour dans la fenêtre demandée. */
  from: number;
  to: number;
  days: number;
  /** Au-dessus de la ligne neutre de la personne. */
  favourable: boolean;
  /** Moyenne des scores de la période, arrondie. */
  average: number;
  /**
   * Jour le plus marqué de la période, et son score **arrondi**.
   *
   * Arrondi ici et non chez l'appelant : c'est le même `Math.round` sur le même
   * flottant que celui de la carte du jour, donc les deux écrans affichent le
   * même nombre pour le même jour — ce qui est une exigence du projet, pas une
   * commodité.
   */
  peak: number;
  peakScore: number;
  /**
   * La fenêtre touche un bord du calcul : elle a commencé avant, ou elle continue
   * après. Même exigence que pour les plages d'aspect — on n'annonce pas comme une
   * date une borne qui n'est que la limite de ce qu'on a regardé.
   */
  openStart: boolean;
  openEnd: boolean;
}

/**
 * Suites de jours du même côté de la ligne neutre.
 *
 * Fonction pure : mêmes scores, même sortie, sans horloge ni accès réseau.
 */
export function axisPeriods(
  scores: number[],
  neutral: number,
  axis: AxisId,
  min: number = MIN_PERIOD_DAYS,
): AxisPeriod[] {
  if (scores.length === 0) return [];

  const out: AxisPeriod[] = [];
  let start = 0;
  let above = scores[0] >= neutral;

  const clore = (from: number, to: number, favourable: boolean) => {
    const days = to - from + 1;
    if (days < min) return;
    const tranche = scores.slice(from, to + 1);
    let peak = from;
    for (let i = from; i <= to; i += 1) {
      // Le jour le plus marqué, dans le sens de la fenêtre.
      if (favourable ? scores[i] > scores[peak] : scores[i] < scores[peak]) peak = i;
    }
    out.push({
      axis,
      from,
      to,
      days,
      favourable,
      average: Math.round(tranche.reduce((a, b) => a + b, 0) / days),
      peak,
      peakScore: Math.round(scores[peak]),
      openStart: from === 0,
      openEnd: to === scores.length - 1,
    });
  };

  for (let i = 1; i <= scores.length; i += 1) {
    const cote = i < scores.length ? scores[i] >= neutral : !above;
    if (cote === above) continue;
    clore(start, i - 1, above);
    start = i;
    above = cote;
  }

  return out;
}
