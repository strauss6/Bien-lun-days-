/**
 * Retour haptique du scrub.
 *
 * La décision — faut-il vibrer ? — est une fonction pure, testable sans
 * navigateur. Seul l'appel matériel touche `navigator`, et il est silencieux
 * partout où l'API n'existe pas : iOS Safari ne l'implémente pas, et c'est la
 * moitié de la cible. Une fonctionnalité absente ne doit jamais casser le geste.
 */

/** Durée de la secousse. Assez pour être sentie, trop courte pour être entendue. */
export const PEAK_BUZZ_MS = 8;

/**
 * Le doigt vient-il de franchir un pic ?
 *
 * On regarde **tous les jours traversés**, pas seulement le jour d'arrivée : un
 * scrub rapide saute cinq colonnes d'une frame à l'autre, et ne tester que la
 * destination laisserait passer les pics survolés. Le jour de départ est exclu —
 * on l'a déjà signalé en y arrivant.
 */
export function crossesPeak(from: number, to: number, peaks: readonly boolean[]): boolean {
  if (from === to) return false;
  const step = to > from ? 1 : -1;
  for (let day = from + step; ; day += step) {
    if (peaks[day]) return true;
    if (day === to) return false;
  }
}

/**
 * Secousse, si le matériel et la personne le permettent.
 *
 * `prefers-reduced-motion` couvre aussi le retour haptique : quelqu'un qui a
 * demandé moins de mouvement n'a pas demandé qu'on lui vibre dans la main.
 * Rend `true` quand la vibration a réellement été demandée — c'est ce que le
 * test observe, faute de pouvoir observer un téléphone.
 */
export function buzz(ms: number = PEAK_BUZZ_MS): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  try {
    return navigator.vibrate(ms);
  } catch {
    // Certains navigateurs refusent la vibration hors geste utilisateur : tant pis.
    return false;
  }
}
