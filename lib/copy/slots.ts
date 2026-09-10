import type { AspectId, AxisId, PlanetId, PointId } from '../astro/types';
import { ASPECT_IDS, ASPECTS } from '../astro/aspects';
import { AXIS_IDS, AXIS_LABELS, AXIS_NATALS, AXIS_TRANSITS, allPairs } from '../astro/transits';
import { LONG_BODIES, RARITY_LABELS, rarityOf } from '../astro/backdrop';
import { POINT_LABELS } from '../astro/natal';
import { PLANET_LABELS } from '../astro/ephemeris';
import { polarity } from '../astro/scoring';

/**
 * Emplacements de texte à écrire.
 *
 * Un emplacement est une **signification**, pas une occurrence : « Jupiter en
 * conjonction au Soleil natal, sur l'axe Business ». L'orbe, la rétrogradation
 * et le contexte de la personne ne créent pas de nouveaux emplacements — ils
 * modulent la formulation au moment de la génération. Sinon le corpus explose et
 * devient impossible à écrire à la main.
 */

export type SlotScope = AxisId | 'long';

export interface CopySlot {
  key: string;
  scope: SlotScope;
  transit: PlanetId;
  aspect: AspectId;
  natal: PointId;
  /** Sens de l'aspect pour cet axe : favorable, difficile, ou nuancé. */
  polarity: 'favorable' | 'difficult';
  /** Périodicité, pour les transits longs uniquement. */
  recurrence: string | null;
  /** Libellé lisible, pour la feuille de rédaction. */
  label: string;
}

export function slotKey(scope: SlotScope, transit: PlanetId, aspect: AspectId, natal: PointId): string {
  return `${scope}:${transit}:${aspect}:${natal}`;
}

/** Cibles natales des transits longs. Les axes n'en font partie que si l'heure est connue. */
export const LONG_TARGETS: PointId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'asc', 'mc'];

function makeSlot(scope: SlotScope, transit: PlanetId, aspect: AspectId, natal: PointId): CopySlot {
  const p = polarity(transit, aspect);
  const scopeLabel = scope === 'long' ? 'Transit long' : AXIS_LABELS[scope];
  return {
    key: slotKey(scope, transit, aspect, natal),
    scope,
    transit,
    aspect,
    natal,
    polarity: p >= 0 ? 'favorable' : 'difficult',
    recurrence: scope === 'long' ? RARITY_LABELS[rarityOf(transit)] : null,
    label: `${scopeLabel} — ${PLANET_LABELS[transit]} ${ASPECTS[aspect].label} ${POINT_LABELS[natal]} natal`,
  };
}

/** Tous les emplacements du produit, sans doublon. */
export function allSlots(): CopySlot[] {
  const out: CopySlot[] = [];
  const seen = new Set<string>();

  const push = (slot: CopySlot) => {
    if (seen.has(slot.key)) return;
    seen.add(slot.key);
    out.push(slot);
  };

  for (const axis of AXIS_IDS) {
    for (const transit of AXIS_TRANSITS[axis]) {
      for (const natal of AXIS_NATALS[axis]) {
        for (const aspect of ASPECT_IDS) push(makeSlot(axis, transit, aspect, natal));
      }
    }
  }

  for (const transit of LONG_BODIES) {
    for (const natal of LONG_TARGETS) {
      for (const aspect of ASPECT_IDS) push(makeSlot('long', transit, aspect, natal));
    }
  }

  return out;
}

/** Décompte par périmètre, pour dimensionner le travail de rédaction. */
export function slotCounts(): Record<SlotScope | 'total', number> {
  const slots = allSlots();
  const counts = { business: 0, love: 0, energy: 0, long: 0, total: slots.length } as Record<SlotScope | 'total', number>;
  for (const s of slots) counts[s.scope] += 1;
  return counts;
}

export { allPairs };
