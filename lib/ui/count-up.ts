/**
 * Compteurs.
 *
 * Le score monte de zéro à sa valeur, une seule fois. C'est ce qui dit que le
 * nombre a été **calculé** et non choisi dans une liste — la seule animation du
 * produit qui porte du sens. Elle ne se rejoue pas à chaque jour parcouru :
 * trente compteurs qui s'emballent au scrub feraient une machine à sous.
 *
 * La courbe et la valeur sont ici, en fonctions pures ; le déclenchement est
 * dans le composant, qui seul connaît `requestAnimationFrame`.
 */

/** Durée de la montée. Assez pour être vue, trop courte pour être attendue. */
export const COUNT_MS = 750;

/**
 * Décélération franche : l'essentiel du trajet dans le premier tiers du temps,
 * puis un accostage. Un compteur linéaire a l'air d'un chargement, pas d'un
 * résultat.
 */
export function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - 2 ** (-10 * t);
}

/** Valeur affichée à un instant de la montée. */
export function countAt(target: number, progress: number): number {
  return Math.round(target * easeOutExpo(progress));
}
