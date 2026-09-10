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
 */
export const ASPECT_PLAIN: Record<AspectId, string> = {
  conjunction: 'la planète arrive dessus, à 0°',
  sextile: 'un angle de 60°, une occasion qui demande d\'être saisie',
  square: 'un angle de 90°, une résistance qui force à trancher',
  trine: 'un angle de 120°, les choses passent sans effort',
  opposition: 'un angle de 180°, un face-à-face avec quelqu\'un ou quelque chose',
};
