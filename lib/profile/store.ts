import type { ReadingInput } from '@/lib/api/reading';
import type { ReadingPayload } from '@/lib/api/reading';
import { SCORE_METHOD } from '@/lib/astro/calibration';

/**
 * Le profil et son rapport, gardés sur l'appareil.
 *
 * **Sur l'appareil, et nulle part ailleurs.** Il n'y a pas de compte : ce qui est
 * enregistré ici vit dans ce navigateur, sur cette machine. L'interface doit le
 * dire — laisser croire qu'un profil se retrouve sur un autre téléphone serait
 * un mensonge coûteux le jour où quelqu'un change d'appareil.
 *
 * Rien de tout cela ne passe par une adresse : les données de naissance ne
 * doivent pas se retrouver dans un historique de navigation ni dans un lien
 * partagé.
 *
 * Le rapport enregistré porte **la méthode de score** qui l'a produit et **le
 * jour où il commence**. Un rapport calculé avec une autre méthode, ou qui ne
 * commence pas aujourd'hui, est périmé : on le recalcule au lieu de mélanger
 * silencieusement deux échelles ou d'afficher la journée d'hier.
 */

export const PROFILE_KEY = 'bien-lune:profil';
export const READING_KEY = 'bien-lune:rapport';
/** Forme du contenu enregistré. À changer quand la structure évolue. */
export const STORE_VERSION = 2;

export interface StoredProfile {
  version: number;
  /** La demande de calcul telle qu'elle sera renvoyée à l'API, moins la date. */
  request: Omit<ReadingInput, 'startDate' | 'days'>;
  /** Fuseau de résidence au dernier calcul — distinct du fuseau de naissance. */
  zone: string;
  savedAt: string;
}

export interface StoredReading {
  version: number;
  method: string;
  startDate: string;
  zone: string;
  payload: ReadingPayload;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Navigation privée, stockage plein, JSON abîmé : on repart du questionnaire
    // plutôt que de planter. Un profil perdu se refait en une minute.
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* pas de stockage : le produit marche, il ne se souvient pas */
  }
}

export function loadProfile(): StoredProfile | null {
  const stored = read<StoredProfile>(PROFILE_KEY);
  return stored && stored.version === STORE_VERSION && stored.request ? stored : null;
}

export function saveProfile(request: StoredProfile['request'], zone: string): void {
  write(PROFILE_KEY, {
    version: STORE_VERSION, request, zone, savedAt: new Date().toISOString(),
  } satisfies StoredProfile);
}

export function saveReading(payload: ReadingPayload, startDate: string, zone: string): void {
  write(READING_KEY, {
    version: STORE_VERSION, method: payload.method, startDate, zone, payload,
  } satisfies StoredReading);
}

/**
 * Le rapport enregistré est-il encore celui d'aujourd'hui ?
 *
 * Quatre raisons de recalculer, et une seule de garder. On recalcule si la forme
 * du stockage a changé, si la méthode de score a changé, si la fenêtre ne
 * commence plus aujourd'hui — le cas de tous les matins — ou si la personne a
 * changé de fuseau de résidence, un voyage suffisant pour décaler sa journée.
 */
export function isFresh(stored: StoredReading | null, today: string, zone: string): boolean {
  if (!stored || stored.version !== STORE_VERSION) return false;
  if (stored.method !== SCORE_METHOD) return false;
  if (stored.payload?.method !== SCORE_METHOD) return false;
  if (stored.startDate !== today) return false;
  if (stored.zone !== zone) return false;
  return true;
}

export function loadReading(today: string, zone: string): ReadingPayload | null {
  const stored = read<StoredReading>(READING_KEY);
  return isFresh(stored, today, zone) ? stored!.payload : null;
}

export function forgetAll(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(READING_KEY);
  } catch {
    /* rien à oublier */
  }
}
