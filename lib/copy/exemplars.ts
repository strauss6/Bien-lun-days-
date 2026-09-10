import type { CopySlot } from './slots';

/**
 * Choix des emplacements à rédiger **en entier**.
 *
 * Ils servent d'exemples au modèle qui composera les autres : ils doivent donc
 * couvrir le plus grand nombre possible de combinaisons deux à deux — chaque
 * planète avec chaque aspect, chaque aspect avec chaque point natal, chaque
 * périmètre avec chaque planète. Sélection gloutonne : à chaque tour on prend
 * l'emplacement qui apporte le plus de couples nouveaux, en départageant par la
 * fréquence réelle d'apparition chez les clients.
 */
export function selectExemplars(
  ranked: Array<{ slot: CopySlot; priority: number }>,
  count: number,
): CopySlot[] {
  const pairsOf = (s: CopySlot) => [
    `ta:${s.transit}|${s.aspect}`,
    `an:${s.aspect}|${s.natal}`,
    `tn:${s.transit}|${s.natal}`,
    `sa:${s.scope}|${s.aspect}`,
    `st:${s.scope}|${s.transit}`,
  ];

  const covered = new Set<string>();
  const chosen: CopySlot[] = [];
  const pool = [...ranked];

  while (chosen.length < count && pool.length) {
    let bestIndex = 0;
    let bestGain = -1;
    let bestPriority = -1;

    for (const [i, candidate] of pool.entries()) {
      const gain = pairsOf(candidate.slot).filter((p) => !covered.has(p)).length;
      if (gain > bestGain || (gain === bestGain && candidate.priority > bestPriority)) {
        bestIndex = i;
        bestGain = gain;
        bestPriority = candidate.priority;
      }
    }

    const picked = pool.splice(bestIndex, 1)[0];
    for (const p of pairsOf(picked.slot)) covered.add(p);
    chosen.push(picked.slot);
  }

  return chosen;
}
