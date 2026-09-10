import raw from '@/data/cities.json';

/**
 * Recherche de ville de naissance.
 *
 * Base statique, aucune API tierce à l'exécution. L'index est construit par
 * `scripts/build-cities.ts` à partir de la donnée GeoNames empaquetée, et trié
 * par population décroissante à la construction — ce qui permet à la recherche de
 * s'arrêter dès qu'elle a dix résultats, puisque le premier trouvé est déjà le
 * plus peuplé.
 */

export interface City {
  name: string;
  country: string;
  admin: string;
  lat: number;
  lng: number;
  population: number;
  /** Fuseau IANA, résolu à la construction de l'index. */
  zone: string;
}

/** `[nom affiché, pays, code admin, lat×1e4, lng×1e4, population, fuseau, nom d'origine ?]` */
type Row = [string, string, string, number, number, number, string, string?];

const ROWS = raw as unknown as Row[];

/**
 * Forme de comparaison : sans accent, sans casse, tirets et apostrophes réduits
 * à des espaces. « L'Haÿ-les-Roses » et « l hay les roses » doivent se rejoindre.
 */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Chaque ville porte une ou deux suites de mots cherchables : son nom affiché et,
 * pour les villes à exonyme français, son nom d'origine — « Bruxelles » s'affiche,
 * « Brussels » se cherche.
 */
let tokenized: string[][][] | null = null;

function index(): string[][][] {
  if (!tokenized) {
    tokenized = ROWS.map((r) => {
      const forms = [normalize(r[0]).split(' ')];
      if (r[7]) forms.push(normalize(r[7]).split(' '));
      return forms;
    });
  }
  return tokenized;
}

function toCity(r: Row): City {
  return {
    name: r[0], country: r[1], admin: r[2],
    lat: r[3] / 1e4, lng: r[4] / 1e4, population: r[5], zone: r[6],
  };
}

/**
 * Chaque mot de la requête doit être le début d'un mot de la ville, dans l'ordre.
 * « boulogne b » retrouve donc Boulogne-Billancourt, « bil » ne le retrouve pas —
 * on ne cherche pas au milieu des mots, sans quoi « an » ramènerait la moitié du
 * fichier.
 */
function matches(cityTokens: string[], queryTokens: string[]): boolean {
  let from = 0;
  for (const q of queryTokens) {
    let found = -1;
    for (let i = from; i < cityTokens.length; i += 1) {
      if (cityTokens[i].startsWith(q)) { found = i; break; }
    }
    if (found === -1) return false;
    from = found + 1;
  }
  return true;
}

export const MAX_RESULTS = 10;

export function searchCities(query: string, limit = MAX_RESULTS): City[] {
  const queryTokens = normalize(query).split(' ').filter(Boolean);
  if (!queryTokens.length) return [];

  const forms = index();
  const out: City[] = [];
  for (let i = 0; i < ROWS.length && out.length < limit; i += 1) {
    if (forms[i].some((f) => matches(f, queryTokens))) out.push(toCity(ROWS[i]));
  }
  return out;
}

export function cityCount(): number {
  return ROWS.length;
}
