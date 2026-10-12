import type { PeriodPayload } from '@/lib/api/reading';
import { duree } from './duration';
import { empreinte } from './phrase';

/**
 * Ce qu'on dit d'une fenêtre du trimestre.
 *
 * ## Une fenêtre ne promet rien
 *
 * La règle du projet vaut ici comme ailleurs : un bon aspect ne promet aucun
 * résultat — « si on ne fait rien et qu'on reste chez soi, il ne se passera rien
 * de spécial » — et un aspect difficile montre où est la résistance, il ne
 * condamne pas. Une fenêtre haute est donc un moment où engager, jamais un moment
 * où il va arriver quelque chose ; une fenêtre basse est un moment où ça coûte
 * plus cher, jamais un moment où renoncer.
 *
 * ## Elle se compare à la personne, pas au trimestre
 *
 * « Au-dessus de ta moyenne » veut dire : au-dessus de la journée médiane de
 * cette personne sur la période de référence de l'étalonnage. Pas au-dessus de
 * la moyenne des quatre-vingt-dix jours affichés — ce qui aurait garanti à
 * chacun autant de haut que de bas, et rendu la phrase creuse.
 */

/** Ce que la fenêtre est, dans le trimestre. */
export type PeriodRank = 'meilleure' | 'plus-dure' | 'ordinaire';

const OUVERTURES: Record<'haute' | 'basse', string[]> = {
  haute: [
    'Ça porte',
    'Le terrain est favorable',
    'Tu as le vent avec toi',
    'La pente est dans le bon sens',
    'Les choses se posent bien',
    'Tu pars avec de l’avance',
  ],
  basse: [
    'Ça résiste',
    'Le terrain est plus dur',
    'Chaque chose coûte un peu plus',
    'Rien ne vient tout seul',
    'Il faut pousser plus fort',
    'Le courant est contre toi',
  ],
};

const GESTES: Record<'haute' | 'basse', string[]> = {
  haute: [
    'C’est là qu’il faut engager ce que tu remets à plus tard.',
    'Place ici ce qui demande d’être lancé, pas ce qui demande d’être bouclé.',
    'Rien n’arrive tout seul : c’est une fenêtre pour agir, pas pour attendre.',
    'Prends les rendez-vous qui comptent sur cette période.',
    'Une porte ouverte ne se franchit pas seule : sers-t’en.',
    'C’est le moment de demander ce que tu n’oses pas demander.',
  ],
  basse: [
    'Rien de définitif : ce qui peut attendre gagne à attendre.',
    'Avance quand même, mais compte plus de temps que d’habitude.',
    'Garde cette période pour finir des choses, pas pour en ouvrir.',
    'Ne lis pas un refus comme un verdict : le terrain y est pour beaucoup.',
    'Redouble de vigilance sur ce que tu signes et ce que tu promets.',
    'Baisse la cadence plutôt que la barre.',
  ],
};

const choisir = (options: string[], cle: string): string => options[empreinte(cle) % options.length];

/**
 * La phrase d'une fenêtre. Reste sous les quarante-cinq mots du budget.
 *
 * `rank` situe la fenêtre dans le trimestre — la meilleure et la plus dure sont
 * dites comme telles, parce que c'est l'information qu'on cherche en ouvrant cet
 * écran. Les autres sont décrites sans superlatif plutôt que hiérarchisées à
 * l'excès.
 */
export function periodLine(period: PeriodPayload, rank: PeriodRank): string {
  const sens = period.favourable ? 'haute' : 'basse';
  const cle = `${period.axis}|${period.start}|${period.days}`;

  const situation = rank === 'meilleure'
    ? 'La meilleure fenêtre du trimestre sur cet axe.'
    : rank === 'plus-dure'
      ? 'La période la plus exigeante du trimestre sur cet axe.'
      : `${choisir(OUVERTURES[sens], `o:${cle}`)} pendant ${duree(period.days)}.`;

  /*
   * Deux clés distinctes, pas une. Avec la même, l'ouverture et le geste se
   * déplaçaient ensemble : deux fenêtres basses du même trimestre sortaient mot
   * pour mot identiques. Décorrélées, il faut que les deux tirages tombent juste
   * pour que la phrase se répète.
   */
  return `${situation} ${choisir(GESTES[sens], `g:${cle}`)}`;
}

/**
 * Le trimestre en une phrase, quand il n'a aucune fenêtre sur un axe.
 *
 * Ce cas est réel : sur cinq thèmes mesurés, l'un n'a aucune fenêtre Business
 * haute du trimestre. Le produit le dit au lieu d'étaler de force — c'est un
 * corollaire assumé d'une échelle propre à la personne.
 */
export function noPeriodLine(): string {
  return 'Rien qui dure sur cet axe ces trois mois : pas de longue période au-dessus '
    + 'ni en dessous de ta moyenne. C’est une information, pas un manque — les jours '
    + 'gardent leurs différences, c’est la tendance de fond qui est plate.';
}
