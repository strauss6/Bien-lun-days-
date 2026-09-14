import type { AspectHit, AspectId } from './types';
import { separation } from './angles';

export const ASPECTS: Record<AspectId, { angle: number; orb: number; label: string; glyph: string }> = {
  conjunction: { angle: 0, orb: 6, label: 'conjonction', glyph: '☌' },
  sextile: { angle: 60, orb: 4, label: 'sextile', glyph: '⚹' },
  square: { angle: 90, orb: 5, label: 'carré', glyph: '□' },
  trine: { angle: 120, orb: 5, label: 'trigone', glyph: '△' },
  opposition: { angle: 180, orb: 6, label: 'opposition', glyph: '☍' },
};

export const ASPECT_IDS = Object.keys(ASPECTS) as AspectId[];

/**
 * Courbe de proximité à l'exact.
 *
 * Un trigone à 0°30' pèse 34 fois un trigone à 4°30'. Un aspect large existe
 * sans peser : c'est ce qui empêche le score d'être une bouillie où tout
 * compte un peu.
 */
export const EXACTNESS_EXPONENT = 1.6;

export function exactness(orb: number, orbMax: number): number {
  if (orb >= orbMax) return 0;
  return Math.pow(1 - orb / orbMax, EXACTNESS_EXPONENT);
}

/**
 * Aspect formé entre deux longitudes, ou `null`.
 *
 * Les angles retenus sont séparés d'au moins 30° et les orbes plafonnent à 6° :
 * deux aspects ne peuvent donc jamais s'appliquer à la fois. On retourne le seul
 * possible.
 */
export function findAspect(lonA: number, lonB: number): AspectHit | null {
  const sep = separation(lonA, lonB);
  for (const id of ASPECT_IDS) {
    const { angle, orb } = ASPECTS[id];
    const delta = Math.abs(sep - angle);
    if (delta <= orb) {
      return { aspect: id, orb: delta, exactness: exactness(delta, orb) };
    }
  }
  return null;
}

/** Notation compacte d'un aspect : `♀ △ ☾`. */
export function aspectGlyph(aspect: AspectId): string {
  return ASPECTS[aspect].glyph;
}
