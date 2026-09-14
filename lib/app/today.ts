/**
 * La date d'aujourd'hui, chez l'utilisateur.
 *
 * Deux fuseaux cohabitent dans ce produit et les confondre casserait tout :
 *
 * — le **fuseau historique** de la ville de naissance, qui sert à convertir une
 *   heure de naissance en instant absolu. Paris valait `+00:09:21` en 1911 ; ce
 *   fuseau-là est une donnée du passé et ne bouge plus.
 * — le **fuseau de résidence**, celui où la personne vit *aujourd'hui*, qui
 *   décide de ce que « ce matin » veut dire. Quelqu'un né à Paris et installé à
 *   Montréal change de journée six heures plus tard qu'à Paris.
 *
 * Ce module ne connaît que le second. Le premier vit dans `astro/zone.ts`.
 */

/** Fuseau de résidence tel que le navigateur le déclare. */
export function residentZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && zone.length > 0 ? zone : 'UTC';
  } catch {
    // Un navigateur qui ne sait pas dire où il est vaut mieux qu'un écran vide.
    return 'UTC';
  }
}

/** Date civile `YYYY-MM-DD` à un instant donné, dans un fuseau donné. */
export function civilDateIn(zone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(at);
  // `en-CA` rend déjà `YYYY-MM-DD` : pas de recomposition à la main, donc pas
  // d'occasion d'inverser le mois et le jour.
  return parts;
}

/**
 * Millisecondes avant le prochain minuit local.
 *
 * L'application peut rester ouverte toute la nuit sur une table de chevet : au
 * passage de minuit, « aujourd'hui » doit changer sans rechargement. On vise la
 * seconde qui suit minuit, jamais minuit pile — un réveil à la milliseconde près
 * retomberait sur la veille une fois sur deux.
 */
export const MIDNIGHT_MARGIN_MS = 1000;

export function msUntilNextMidnight(zone: string, at: Date = new Date()): number {
  const today = civilDateIn(zone, at);
  // Recherche par doublement puis dichotomie : aucune arithmétique de fuseau à
  // la main, donc rien à casser sur un changement d'heure ou un décalage à la
  // demi-heure. Le premier instant du lendemain est à moins de 48 h.
  let lo = 0;
  let hi = 1000;
  const maxi = 48 * 3600 * 1000;
  while (hi < maxi && civilDateIn(zone, new Date(at.getTime() + hi)) === today) {
    lo = hi;
    hi *= 2;
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (civilDateIn(zone, new Date(at.getTime() + mid)) === today) lo = mid;
    else hi = mid;
  }
  return hi + MIDNIGHT_MARGIN_MS;
}
