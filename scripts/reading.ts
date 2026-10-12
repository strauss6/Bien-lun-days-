/** Rapport 90 jours en console. `npx tsx scripts/reading.ts 1993-08-06 20:50 48.8352 2.2409 2026-09-09` */
import { resolveBirthInstant, formatOffset } from '../lib/astro/time';
import { computeNatalChart, POINT_LABELS, POINT_GLYPHS } from '../lib/astro/natal';
import { computeReading, primaryAspect } from '../lib/astro/scoring';
import { AXIS_IDS, AXIS_LABELS } from '../lib/astro/transits';
import { ASPECTS } from '../lib/astro/aspects';
import { formatOrb } from '../lib/astro/angles';
import type { DayAspect } from '../lib/astro/types';

const [date, time, lat, lng, start] = process.argv.slice(2);
const birth = resolveBirthInstant({ date, time: time === '-' ? null : time, lat: +lat, lng: +lng });
const chart = computeNatalChart(birth, +lat, +lng);
const reading = computeReading({ chart, zone: 'Europe/Paris', startDate: start, days: 90 });

const BLOCKS = ' ▁▂▃▄▅▆▇█';
const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const fmtDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const label = (a: DayAspect) =>
  `${POINT_GLYPHS[a.transit]} ${ASPECTS[a.aspect].glyph} ${POINT_GLYPHS[a.natal]}  ${ASPECTS[a.aspect].label} ${POINT_LABELS[a.transit]}→${POINT_LABELS[a.natal]} ${formatOrb(a.orb)}${a.retrograde ? ' R' : ''}${a.peaking ? ' ·exact' : ''}`;

console.log(`\n  Thème : ${date} ${birth.localTime} · ${birth.zone} ${formatOffset(birth.offsetSeconds)} · ${birth.utcISO}`);
console.log(`  Fenêtre : ${reading.startDate} → ${reading.axes.business.days[89].date}`);
console.log(`  ${reading.stats.comparisonsTested.toLocaleString('fr-FR')} combinaisons testées · ${reading.stats.aspectEvents} aspects retenus (${reading.stats.aspectDays} jours-aspects)\n`);

const seasonMark = reading.seasons.map((s) => ({ spring: 'p', summer: 'é', autumn: 'a', winter: 'h' }[s])).join('');
console.log(`  saison   ${seasonMark}`);
for (const axis of AXIS_IDS) {
  const bar = reading.axes[axis].days
    .map((d) => BLOCKS[Math.min(8, Math.floor((d.score / 100) * 8.999))])
    .join('');
  console.log(`  ${AXIS_LABELS[axis].padEnd(8)} ${bar}`);
}
console.log(`           ${'^'.padStart(1)}${' '.repeat(0)}` + ' '.repeat(0));

for (const axis of AXIS_IDS) {
  const a = reading.axes[axis];
  console.log(`\n  ── ${AXIS_LABELS[axis].toUpperCase()} ${'─'.repeat(60 - AXIS_LABELS[axis].length)}`);
  if (a.backdrop) console.log(`  Fond de période : ${label(a.backdrop)}`);
  console.log('  Meilleurs jours');
  for (const d of a.best) {
    const day = a.days[d];
    const hit = primaryAspect(day, 'best');
    console.log(`    ${fmtDate(day.date).padEnd(9)} J+${String(d).padEnd(3)} ${day.score.toFixed(0).padStart(3)}/100  ${hit ? label(hit) : ''}`);
  }
  console.log('  À éviter');
  for (const d of a.worst) {
    const day = a.days[d];
    const hit = primaryAspect(day, 'worst');
    console.log(`    ${fmtDate(day.date).padEnd(9)} J+${String(d).padEnd(3)} ${day.score.toFixed(0).padStart(3)}/100  ${hit ? label(hit) : ''}`);
  }
}
console.log();
