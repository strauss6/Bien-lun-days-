/** Exporte le paquet de rédaction en JSON. `npx tsx scripts/corpus-export.ts out.json [nbThèmes]` */
import { writeFileSync } from 'node:fs';
import { rankSlots, coverageCurve } from '../lib/copy/frequency';
import { selectExemplars } from '../lib/copy/exemplars';
import { ASPECT_BLOCKS, AXIS_BLOCKS, NATAL_BLOCKS, TRANSIT_BLOCKS } from '../lib/copy/blocks';

const [out, n] = process.argv.slice(2);
const ranked = rankSlots({
  charts: Number(n ?? 600),
  onProgress: (d, t) => { if (d % 100 === 0) process.stderr.write(`  ${d}/${t}\n`); },
});
const exemplars = selectExemplars(ranked, 60);
const exemplarKeys = new Set(exemplars.map((s) => s.key));

writeFileSync(out, JSON.stringify({
  generatedFrom: ranked.length,
  coverage: coverageCurve(ranked),
  blocks: [
    ...TRANSIT_BLOCKS.map((b) => ({ ...b, category: 'Planète en transit' })),
    ...ASPECT_BLOCKS.map((b) => ({ ...b, category: 'Aspect' })),
    ...NATAL_BLOCKS.map((b) => ({ ...b, category: 'Point natal' })),
    ...AXIS_BLOCKS.map((b) => ({ ...b, category: 'Axe' })),
  ],
  exemplars: exemplars.map((s) => {
    const r = ranked.find((x) => x.slot.key === s.key)!;
    return { ...s, cited: r.cited, seen: r.seen, long: r.long };
  }),
  corpus: ranked.map((r, i) => ({
    rank: i + 1, ...r.slot, cited: r.cited, seen: r.seen, long: r.long,
    isExemplar: exemplarKeys.has(r.slot.key),
  })),
}, null, 1), 'utf8');
process.stderr.write(`\n  écrit : ${out}\n`);
