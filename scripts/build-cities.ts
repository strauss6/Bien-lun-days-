/**
 * Construit l'index de villes servi par la recherche.
 *
 * La source est `all-the-cities`, c'est-à-dire la donnée GeoNames empaquetée :
 * 135 233 villes au seuil de mille habitants. Le brief visait `cities5000` en
 * téléchargement direct, mais `download.geonames.org` est refusé par la politique
 * de sortie réseau de l'environnement — et le seuil de mille est de toute façon
 * plus complet, 8 836 communes françaises contre environ 1 400. Voir QUESTIONS.md Q5.
 *
 * `npx tsx scripts/build-cities.ts`
 */
import { writeFileSync } from 'node:fs';
import cities from 'all-the-cities';
import { FRENCH_EXONYMS } from '../lib/cities/aliases';

/** Pays où l'on descend au seuil de mille habitants : le marché visé. */
const FRANCOPHONE = new Set([
  'FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'AD',
  'SN', 'CI', 'CM', 'MA', 'DZ', 'TN', 'ML', 'BF', 'NE', 'TG', 'BJ',
  'CD', 'CG', 'GA', 'MG', 'HT', 'MU', 'RE', 'GP', 'MQ', 'GF', 'PF', 'NC', 'YT',
]);

const WORLD_THRESHOLD = 50_000;

const selected = cities
  .filter((c) => (FRANCOPHONE.has(c.country) ? c.population >= 1000 : c.population >= WORLD_THRESHOLD))
  .sort((a, b) => b.population - a.population);

// Résolution des exonymes. Un alias qui ne correspond à rien fait échouer la
// construction : mieux vaut un script cassé qu'une ville introuvable en production.
const exonyms = new Map<string, string>();
const unresolved: string[] = [];
for (const { french, name, country } of FRENCH_EXONYMS) {
  const hit = selected.find((c) => c.name === name && c.country === country);
  if (!hit) unresolved.push(`${french} → ${name} [${country}]`);
  else exonyms.set(`${name}|${country}`, french);
}
if (unresolved.length) {
  console.error(`Exonymes non résolus :\n  ${unresolved.join('\n  ')}`);
  process.exit(1);
}

const kept = selected.map((c) => {
  const french = exonyms.get(`${c.name}|${c.country}`);
  return [
    // Le nom affiché est le nom français quand il existe : le public est français.
    french ?? c.name,
    c.country,
    c.adminCode ?? '',
    // Quatre décimales : onze mètres. La longitude déplace l'Ascendant de six
    // minutes d'arc par dixième de degré, la précision est largement suffisante.
    Math.round(c.loc.coordinates[1] * 1e4),
    Math.round(c.loc.coordinates[0] * 1e4),
    c.population,
    // Le nom d'origine reste cherchable pour qui tape « Brussels ».
    ...(french ? [c.name] : []),
  ];
});

writeFileSync('data/cities.json', JSON.stringify(kept), 'utf8');
console.log(`${kept.length} villes · ${exonyms.size} exonymes · ${Math.round(JSON.stringify(kept).length / 1024)} Ko`);
