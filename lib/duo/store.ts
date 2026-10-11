import type { City } from '@/lib/cities/search';

/**
 * La seconde personne d'une comparaison.
 *
 * ## Elle ne circule pas
 *
 * Aucune donnée de naissance ne part sur le réseau et aucune ne passe par une
 * adresse — la règle vaut pour la seconde personne autant que pour la première,
 * et elle est plus exigeante ici : ces données-là ne sont même pas celles du
 * lecteur. Le calcul est fait sur l'appareil par le même moteur que le reste, et
 * le tout reste dans le stockage local du navigateur.
 *
 * ## Elle se saisit, elle ne se transmet pas
 *
 * Un premier découpage faisait transiter un thème d'un téléphone à l'autre, et
 * c'est ce qui a retardé la fonctionnalité pour rien : on connaît la date de
 * naissance de son associé ou de sa compagne, on la saisit. Le cas où la seconde
 * personne renseigne elle-même ses données existe, mais il vient après, et il ne
 * bloque pas celui-ci.
 */

export const DUO_KEY = 'bien-lune:duo';

/**
 * Monte avec la forme stockée. Une entrée d'une autre version est ignorée, pas
 * migrée. `2` : l'heure de naissance est devenue obligatoire — une comparaison
 * enregistrée sans elle se ressaisit plutôt que de se recalculer en silence sur
 * un thème qui n'est pas celui de la personne.
 */
export const DUO_VERSION = 2;

export interface DuoPerson {
  firstName: string;
  birthDate: string;
  /** Obligatoire depuis le 11 octobre 2026, comme celle du lecteur. */
  birthTime: string;
  city: City;
}

interface StoredDuo extends DuoPerson {
  version: number;
  savedAt: string;
}

export function loadDuo(): DuoPerson | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DUO_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredDuo;
    if (value.version !== DUO_VERSION) return null;
    return {
      firstName: value.firstName,
      birthDate: value.birthDate,
      birthTime: value.birthTime,
      city: value.city,
    };
  } catch {
    // Stockage refusé, quota plein, contenu corrompu : on repart d'un formulaire vide.
    return null;
  }
}

export function saveDuo(person: DuoPerson): void {
  if (typeof window === 'undefined') return;
  try {
    const value: StoredDuo = { ...person, version: DUO_VERSION, savedAt: new Date().toISOString() };
    window.localStorage.setItem(DUO_KEY, JSON.stringify(value));
  } catch {
    // Une comparaison qui ne se retient pas reste une comparaison : on n'échoue pas.
  }
}

export function forgetDuo(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DUO_KEY);
  } catch {
    // Rien à faire de plus : la donnée n'a de toute façon jamais quitté l'appareil.
  }
}
