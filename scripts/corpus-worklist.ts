/**
 * Feuille de rédaction du corpus, triée par fréquence réelle d'apparition.
 *
 * On ne demande pas à un rédacteur d'écrire 555 textes dans un ordre arbitraire :
 * on simule des milliers de rapports sur des thèmes tirés au hasard et on classe
 * les emplacements par la probabilité qu'un client les lise réellement. Les
 * premiers de la liste couvrent l'essentiel de ce que verront les utilisateurs.
 *
 * `npx tsx scripts/corpus-worklist.ts [nbThèmes] > corpus.csv`
 */
import { resolveBirthInstant } from '../lib/astro/time';
import { computeNatalChart } from '../lib/astro/natal';
import { computeReading, primaryAspect } from '../lib/astro/scoring';
import { computeLongTransits } from '../lib/astro/backdrop';
import { AXIS_IDS } from '../lib/astro/transits';
import { allSlots, slotKey } from '../lib/copy/slots';
import { addCivilDays } from '../lib/astro/zone';

/** Villes du marché visé : France d'abord, puis francophonie. */
const CITIES: Array<[string, number, number]> = [
  ['Paris', 48.8566, 2.3522], ['Marseille', 43.2965, 5.3698], ['Lyon', 45.764, 4.8357],
  ['Toulouse', 43.6047, 1.4442], ['Nice', 43.7102, 7.262], ['Nantes', 47.2184, -1.5536],
  ['Strasbourg', 48.5734, 7.7521], ['Montpellier', 43.6108, 3.8767], ['Bordeaux', 44.8378, -0.5792],
  ['Lille', 50.6292, 3.0573], ['Rennes', 48.1173, -1.6778], ['Reims', 49.2583, 4.0317],
  ['Fort-de-France', 14.6161, -61.0588], ['Saint-Denis', -20.8823, 55.4504],
  ['Bruxelles', 50.8503, 4.3517], ['Genève', 46.2044, 6.1432], ['Montréal', 45.5019, -73.5674],
  ['Casablanca', 33.5731, -7.5898], ['Alger', 36.7538, 3.0588], ['Dakar', 14.7167, -17.4677],
];

/** Générateur déterministe : la feuille doit être reproductible à l'identique. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = Number(process.argv[2] ?? 400);
const rand = mulberry32(20260910);
const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];

const slots = allSlots();
const stats = new Map<string, { cited: number; seen: number; long: number }>();
for (const s of slots) stats.set(s.key, { cited: 0, seen: 0, long: 0 });
const bump = (key: string, field: 'cited' | 'seen' | 'long') => {
  const s = stats.get(key);
  if (s) s[field] += 1;
};

for (let i = 0; i < N; i += 1) {
  const year = 1955 + Math.floor(rand() * 54);
  const month = 1 + Math.floor(rand() * 12);
  const day = 1 + Math.floor(rand() * 28);
  const hour = Math.floor(rand() * 24);
  const minute = Math.floor(rand() * 60);
  const [, lat, lng] = pick(CITIES);
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const startDate = addCivilDays('2026-09-10', Math.floor(rand() * 365));

  const chart = computeNatalChart(resolveBirthInstant({ date, time, lat, lng }), lat, lng);
  const reading = computeReading({ chart, zone: 'Europe/Paris', startDate });

  // Vu au moins une fois dans ce rapport : on compte par thème, pas par jour,
  // pour que la statistique soit « part des clients qui liront ce texte ».
  const seenHere = new Set<string>();
  const citedHere = new Set<string>();

  for (const axis of AXIS_IDS) {
    const { days, best, worst } = reading.axes[axis];
    for (const d of days) {
      for (const a of d.aspects) seenHere.add(slotKey(axis, a.transit, a.aspect, a.natal));
    }
    for (const [list, dir] of [[best, 'best'], [worst, 'worst']] as const) {
      for (const d of list) {
        const a = primaryAspect(days[d], dir);
        if (a) citedHere.add(slotKey(axis, a.transit, a.aspect, a.natal));
      }
    }
  }

  const longHere = new Set<string>();
  for (const t of computeLongTransits({ chart, startDate, searchYears: 0.5 })) {
    longHere.add(slotKey('long', t.transit, t.aspect, t.natal));
  }

  for (const k of seenHere) bump(k, 'seen');
  for (const k of citedHere) bump(k, 'cited');
  for (const k of longHere) bump(k, 'long');

  if ((i + 1) % 50 === 0) process.stderr.write(`  ${i + 1}/${N} thèmes simulés\n`);
}

/**
 * Priorité de rédaction. Un texte cité comme date du rapport ou comme transit
 * long est lu attentivement ; un texte simplement présent dans le calendrier est
 * survolé. On pondère en conséquence.
 */
const ranked = slots
  .map((slot) => {
    const s = stats.get(slot.key)!;
    const cited = s.cited / N;
    const seen = s.seen / N;
    const long = s.long / N;
    return { slot, cited, seen, long, priority: cited * 3 + long * 3 + seen * 0.5 };
  })
  .sort((a, b) => b.priority - a.priority);

const esc = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
console.log([
  'rang', 'clé', 'emplacement', 'périmètre', 'planète en transit', 'aspect', 'point natal',
  'sens', 'périodicité', '% clients qui le lisent en date citée', '% clients qui le voient',
  'priorité', 'TEXTE — ce que ça veut dire', 'TEXTE — quoi en faire',
].map(esc).join(';'));

for (const [i, r] of ranked.entries()) {
  console.log([
    String(i + 1), r.slot.key, r.slot.label, r.slot.scope, r.slot.transit, r.slot.aspect, r.slot.natal,
    r.slot.polarity === 'favorable' ? 'favorable' : 'difficile',
    r.slot.recurrence ?? '',
    (r.cited * 100).toFixed(1).replace('.', ','),
    (r.seen * 100).toFixed(1).replace('.', ','),
    r.priority.toFixed(3).replace('.', ','),
    '', '',
  ].map(esc).join(';'));
}

// Courbe de couverture : combien d'emplacements pour couvrir quelle part de ce
// que les clients lisent réellement. C'est ce chiffre qui dimensionne le travail.
const mass = ranked.map((r) => r.cited + r.long);
const totalMass = mass.reduce((a, b) => a + b, 0);
let acc = 0;
const milestones: Record<number, number> = {};
for (const [i, m] of mass.entries()) {
  acc += m;
  for (const target of [50, 60, 70, 80, 90, 95, 99]) {
    if (!milestones[target] && acc / totalMass >= target / 100) milestones[target] = i + 1;
  }
}
process.stderr.write(`\n  ${slots.length} emplacements au total, ${N} thèmes simulés.\n`);
process.stderr.write('  Emplacements à écrire pour couvrir ce que les clients lisent :\n');
for (const target of [50, 60, 70, 80, 90, 95, 99]) {
  process.stderr.write(`    ${target} %  →  ${milestones[target] ?? slots.length} emplacements\n`);
}
const never = ranked.filter((r) => r.cited + r.seen + r.long === 0);
process.stderr.write(`  Jamais rencontrés : ${never.length}\n`);
if (never.length) process.stderr.write('    ' + never.slice(0, 12).map((r) => r.slot.key).join(', ') + '\n');
