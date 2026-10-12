/** Sortie lisible d'un thème natal. `npx tsx scripts/chart.ts 1993-08-06 20:50 48.8352 2.2409` */
import { resolveBirthInstant, formatOffset } from '../lib/astro/time';
import { computeNatalChart, PLANETS, ANGLE_IDS, POINT_LABELS } from '../lib/astro/natal';
import { formatLongitude } from '../lib/astro/angles';
import { eclipticPointHorizon, longitudeOf } from '../lib/astro/ephemeris';

const [date, time, lat, lng] = process.argv.slice(2);
const birth = resolveBirthInstant({ date, time: time === '-' ? null : time, lat: Number(lat), lng: Number(lng) });
const chart = computeNatalChart(birth, Number(lat), Number(lng));

console.log(`\n  ${date} ${birth.localTime} local · ${birth.zone} · ${formatOffset(birth.offsetSeconds)}`);
console.log(`  ${birth.utcISO} UTC · ${lat}N ${lng}E · précision ${birth.precision}${birth.anomaly ? ` · ${birth.anomaly}` : ''}\n`);
for (const id of [...ANGLE_IDS.slice(0, 2), ...PLANETS]) {
  const p = chart.points[id];
  console.log(
    `  ${POINT_LABELS[id].padEnd(15)} ${formatLongitude(p.lon).padEnd(22)} maison ${String(p.house).padStart(2)}` +
    `${p.retrograde ? '  R' : ''}   ${p.lon.toFixed(4)}°`,
  );
}
// Contrôles géométriques : preuve que les axes sont justes, sans donnée externe.
const d = new Date(birth.utcMs);
const hAsc = eclipticPointHorizon(d, Number(lat), Number(lng), chart.points.asc.lon);
const hMc = eclipticPointHorizon(d, Number(lat), Number(lng), chart.points.mc.lon);
const hSun = eclipticPointHorizon(d, Number(lat), Number(lng), longitudeOf('sun', d));
console.log(`  contrôle  ASC altitude ${hAsc.altitude.toFixed(4)}° azimut ${hAsc.azimuth.toFixed(2)}° (est attendu)`);
console.log(`            MC  altitude ${hMc.altitude.toFixed(2)}° azimut ${hMc.azimuth.toFixed(2)}° (méridien attendu)`);
console.log(`            Soleil altitude ${hSun.altitude.toFixed(2)}° azimut ${hSun.azimuth.toFixed(2)}°`);
console.log();
