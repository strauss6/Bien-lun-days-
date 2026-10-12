import type { Season } from '../astro/types';
import { AXIS_IDS } from '../astro/transits';
import type { AxisId } from '../astro/types';

/**
 * Encodage de l'image de partage.
 *
 * Une image partagée circule : son adresse finit dans un fil de discussion, un
 * historique de navigation, un aperçu de messagerie. **Elle ne doit donc porter
 * que ce qui se voit** — les trente hauteurs de barres et les saisons —, jamais
 * la date, l'heure ni la ville de naissance. Recalculer le ruban depuis les
 * données de naissance aurait été plus court à écrire et aurait fait d'un lien
 * de partage une fuite de données intimes.
 *
 * Format : un octet de longueur, puis les scores des trois axes dans l'ordre de
 * `AXIS_IDS`, un octet chacun, puis les saisons à deux bits. Trente jours tiennent
 * en 99 octets, soit 132 caractères une fois en base64url.
 */

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];
/** Au-delà, l'adresse devient trop longue pour certaines messageries. */
export const MAX_DAYS = 120;

export interface RibbonShareDay {
  season: Season;
  scores: Record<AxisId, number>;
}

const toBase64Url = (bytes: number[]): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (code: string): number[] => {
  const padded = code.replace(/-/g, '+').replace(/_/g, '/');
  return [...atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))].map((c) => c.charCodeAt(0));
};

export function encodeRibbon(days: RibbonShareDay[]): string {
  if (days.length === 0 || days.length > MAX_DAYS) {
    throw new Error(`entre 1 et ${MAX_DAYS} jours, reçu ${days.length}`);
  }
  const bytes = [days.length];
  for (const axis of AXIS_IDS) {
    // Les scores sont normalisés entre 3 et 97 : un octet suffit, et borner
    // protège d'un appelant qui enverrait autre chose.
    for (const d of days) bytes.push(Math.max(0, Math.min(255, Math.round(d.scores[axis]))));
  }
  for (let i = 0; i < days.length; i += 4) {
    let packed = 0;
    for (let j = 0; j < 4; j += 1) {
      // Le dernier octet déborde de la fenêtre : ces emplacements-là ne seront
      // jamais relus, on les laisse à zéro. Une saison *présente* mais inconnue,
      // en revanche, est une erreur d'appel — la taire produirait un bandeau de
      // printemps sur un ruban d'automne, exactement le genre de faux silencieux
      // qu'on ne voit qu'une fois l'image partagée.
      if (i + j >= days.length) continue;
      const index = SEASON_ORDER.indexOf(days[i + j].season);
      if (index < 0) throw new Error(`saison inconnue au jour ${i + j} : ${String(days[i + j].season)}`);
      packed |= index << (j * 2);
    }
    bytes.push(packed);
  }
  return toBase64Url(bytes);
}

export function decodeRibbon(code: string): RibbonShareDay[] {
  const bytes = fromBase64Url(code);
  const n = bytes[0];
  if (!n || n > MAX_DAYS) throw new Error('longueur invalide');
  const expected = 1 + n * AXIS_IDS.length + Math.ceil(n / 4);
  if (bytes.length !== expected) throw new Error(`${expected} octets attendus, ${bytes.length} reçus`);

  const seasonsAt = 1 + n * AXIS_IDS.length;
  return Array.from({ length: n }, (_, day) => ({
    season: SEASON_ORDER[(bytes[seasonsAt + Math.floor(day / 4)] >> ((day % 4) * 2)) & 0b11],
    scores: Object.fromEntries(
      AXIS_IDS.map((axis, a) => [axis, bytes[1 + a * n + day]]),
    ) as Record<AxisId, number>,
  }));
}
