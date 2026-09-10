/** Recoupement du moteur avec la lecture faite par un astrologue sur le même thème. */
import { longitudeOf } from '../lib/astro/ephemeris';
import { formatLongitude, separation, signOf, SIGNS } from '../lib/astro/angles';
import type { PlanetId } from '../lib/astro/types';

const NATAL = { sun: 134.3027, asc: 304.2685, mc: 242.1443, venus: 95.5624, jupiter: 190.6547, mars: 176.7038, mercury: 115.3363, pluto: 232.7258 };
const day = (iso: string) => new Date(iso + 'T12:00:00Z');

console.log('\n── Positions en transit aujourd\'hui (10 septembre 2026)');
for (const p of ['jupiter', 'saturn', 'uranus', 'pluto', 'neptune'] as PlanetId[]) {
  const lon = longitudeOf(p, day('2026-09-10'));
  console.log(`  ${p.padEnd(9)} ${formatLongitude(lon).padEnd(22)} ${lon.toFixed(2)}°`);
}

console.log('\n── Aspects annoncés par l\'astrologue, vérifiés');
const checks: Array<[string, PlanetId, keyof typeof NATAL, number]> = [
  ['Jupiter conjonction Soleil natal', 'jupiter', 'sun', 0],
  ['Saturne trigone Soleil natal', 'saturn', 'sun', 120],
  ['Pluton conjonction Ascendant natal', 'pluto', 'asc', 0],
  ['Uranus sextile Soleil natal', 'uranus', 'sun', 60],
  ['Uranus trigone Jupiter natal', 'uranus', 'jupiter', 120],
  ['Saturne opposition Jupiter natal', 'saturn', 'jupiter', 180],
];
for (const [label, transit, natal, angle] of checks) {
  const lon = longitudeOf(transit, day('2026-09-10'));
  const orb = Math.abs(separation(lon, NATAL[natal]) - angle);
  console.log(`  ${label.padEnd(36)} orbe ${orb.toFixed(2)}°  ${orb <= 7 ? 'ACTIF' : '(pas encore)'}`);
}

console.log('\n── Dates d\'exactitude annoncées');
function exactDate(transit: PlanetId, target: number, angle: number, from: string, months: number) {
  let best = { d: '', orb: 999 };
  const start = day(from).getTime();
  for (let i = 0; i < months * 31; i += 1) {
    const t = new Date(start + i * 86400000);
    const orb = Math.abs(separation(longitudeOf(transit, t), target) - angle);
    if (orb < best.orb) best = { d: t.toISOString().slice(0, 10), orb };
  }
  return best;
}
const e1 = exactDate('jupiter', NATAL.venus, 60, '2027-01-01', 24);
console.log(`  Jupiter sextile Vénus natal (mariage)      ${e1.d}  orbe ${(e1.orb * 60).toFixed(0)}'`);
const e2 = exactDate('jupiter', NATAL.mars, 0, '2028-01-01', 18);
console.log(`  Jupiter conjonction Mars natal             ${e2.d}  orbe ${(e2.orb * 60).toFixed(0)}'`);
const e3 = exactDate('jupiter', NATAL.mc, 60, '2027-06-01', 24);
console.log(`  Jupiter sextile MC                        ${e3.d}  orbe ${(e3.orb * 60).toFixed(0)}'`);
const e4 = exactDate('pluto', NATAL.asc, 0, '2024-01-01', 60);
console.log(`  Pluton conjonction Ascendant (exact)      ${e4.d}  orbe ${(e4.orb * 60).toFixed(0)}'`);

console.log('\n── Entrées de signe');
for (const [p, iso, label] of [['jupiter', '2028-06-01', 'Jupiter → Balance'], ['uranus', '2025-01-01', 'Uranus → Gémeaux'], ['saturn', '2025-01-01', 'Saturne → Bélier']] as Array<[PlanetId, string, string]>) {
  let prev = signOf(longitudeOf(p, day(iso)));
  for (let i = 1; i < 900; i += 1) {
    const t = new Date(day(iso).getTime() + i * 86400000);
    const s = signOf(longitudeOf(p, t));
    if (s !== prev) {
      console.log(`  ${label.padEnd(20)} ${t.toISOString().slice(0, 10)}  (${SIGNS[prev]} → ${SIGNS[s]})`);
      break;
    }
  }
}
