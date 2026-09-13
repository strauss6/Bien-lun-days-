import type { AspectId, PlanetId, PointId } from './types';
import { ASPECTS } from './aspects';
import { POINT_GLYPHS, POINT_LABELS } from './natal';
import { PLANET_LABELS } from './ephemeris';

/**
 * Libellés du produit.
 *
 * Règle de nommage du brief : **un aspect vise toujours un point natal, jamais un
 * signe.** On écrit « trigone à ton Soleil », jamais « trigone au Lion ». C'est
 * tout le positionnement qui en dépend — le produit se vend sur le fait que le
 * signe solaire ne dit presque rien, l'interface ne doit pas le contredire.
 * Aucune fonction de ce fichier ne prend un signe en entrée, et un test le vérifie
 * sur toutes les combinaisons.
 */

/** Les deux seuls points natals féminins. Le reste prend « ton ». */
const FEMININE: ReadonlySet<PointId> = new Set<PointId>(['moon', 'venus']);

/** « ton Soleil », « ta Lune ». */
export function possessive(natal: PointId): string {
  return `${FEMININE.has(natal) ? 'ta' : 'ton'} ${POINT_LABELS[natal]}`;
}

/** « trigone à ton Soleil ». */
export function aspectPhrase(aspect: AspectId, natal: PointId): string {
  return `${ASPECTS[aspect].label} à ${possessive(natal)}`;
}

/** « Jupiter en trigone à ton Soleil ». */
export function transitPhrase(transit: PlanetId, aspect: AspectId, natal: PointId): string {
  return `${PLANET_LABELS[transit]} en ${aspectPhrase(aspect, natal)}`;
}

/** Notation technique compacte : « ♃ △ ☉ ». */
export function notation(transit: PlanetId, aspect: AspectId, natal: PointId): string {
  return `${POINT_GLYPHS[transit]} ${ASPECTS[aspect].glyph} ${POINT_GLYPHS[natal]}`;
}

/**
 * Traduction en clair de chaque aspect, pour son **premier** emploi.
 *
 * Le brief interdit qu'un terme technique apparaisse seul la première fois. Une
 * fois traduit, il peut être employé seul — c'est ce qui permet d'avoir l'air
 * savant sans être compliqué.
 *
 * **Rédigé par le rédacteur du corpus, le 13 septembre 2026.** Trois corrections
 * en sont sorties, et aucune n'est cosmétique.
 *
 * Le carré et l'opposition ne disent pas la même chose : le carré est un
 * **blocage** — il montre où est la difficulté —, l'opposition est un **doute**,
 * on est face à deux choix et on hésite. Les confondre sous « aspect difficile »
 * perdait la moitié de l'information.
 *
 * Le trigone et le sextile ne promettent rien tout seuls : « si on ne fait rien
 * et qu'on reste chez soi, il ne se passera rien de spécial ». La traduction le
 * dit, sinon le produit promet des résultats qu'il ne peut pas tenir.
 *
 * Et on écrit **difficile**, jamais mauvais. C'est une consigne de ton explicite,
 * et elle tient tout le positionnement : un aspect dur montre la difficulté, il
 * ne la rend pas insurmontable.
 */
export const ASPECT_PLAIN: Record<AspectId, string> = {
  conjunction: 'la planète arrive dessus, à 0° : elle prend le point en charge',
  sextile: 'un angle de 60°, favorable — mais rien ne se fait si tu ne fais rien',
  square: 'un angle de 90°, un blocage : il montre où est la difficulté',
  trine: 'un angle de 120°, le vent en poupe — encore faut-il sortir de chez soi',
  opposition: 'un angle de 180°, pile en face : un doute, deux choix, une hésitation',
};
