/** Planche de contrôle des douze glyphes. `npx tsx scripts/glyph-sheet.ts out.svg` */
import { writeFileSync } from 'node:fs';
import { ZODIAC_LABELS, ZODIAC_ORDER, ZODIAC_PATHS, ZODIAC_STROKE } from '../lib/design/zodiac-paths';
import { INK, PAPER, SEASON_COLORS, SEASON_LABELS, SIGN_SEASON, mix } from '../lib/design/tokens';

const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

/** Un glyphe, à l'échelle demandée, trait constant. */
function glyph(key: (typeof ZODIAC_ORDER)[number], x: number, y: number, size: number, color: string, nodes = false) {
  const s = size / 24;
  const parts = ZODIAC_PATHS[key].map((d) => `<path d="${d}"/>`).join('');
  let anchors = '';
  if (nodes) {
    // Variante B : nœuds vectoriels aux extrémités des tracés ouverts.
    for (const d of ZODIAC_PATHS[key]) {
      if (d.endsWith('Z')) continue;
      const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const last = [nums[nums.length - 2], nums[nums.length - 1]];
      if (Number.isFinite(last[0]) && Number.isFinite(last[1]) && /[L] *[-\d.]+ *[-\d.]+$/.test(d)) {
        anchors += `<rect x="${last[0] - 0.65}" y="${last[1] - 0.65}" width="1.3" height="1.3" fill="none"/>`;
      }
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" `
    + `stroke-width="${ZODIAC_STROKE}" stroke-linecap="butt" stroke-linejoin="miter">${parts}${anchors}</g>`;
}

const W = 1180;
const H = 1010;
const out: string[] = [];
out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`);

const text = (x: number, y: number, s: string, size = 12, color = INK, opacity = 1, weight = 400) =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${color}" `
  + `fill-opacity="${opacity}" font-weight="${weight}" letter-spacing="0.4">${s}</text>`;

out.push(text(48, 62, 'BIEN.LUNÉ — PLANCHE DE CONTRÔLE DES DOUZE GLYPHES', 15, INK, 1, 700));
out.push(text(48, 84, 'grille 24×24 · trait 1,25 constant · polylignes uniquement, aucune courbe de Bézier', 12, INK, 0.55));

// ── Les douze, à 96 px, dans leur couleur de saison
let x = 48;
let y = 130;
for (const [i, key] of ZODIAC_ORDER.entries()) {
  const col = i % 6;
  const row = Math.floor(i / 6);
  x = 48 + col * 185;
  y = 130 + row * 210;
  const season = SIGN_SEASON[i];
  const color = SEASON_COLORS[season];
  out.push(`<rect x="${x - 8}" y="${y - 8}" width="112" height="112" fill="${mix(color, 0.1)}"/>`);
  out.push(glyph(key, x, y, 96, color));
  out.push(text(x - 8, y + 128, ZODIAC_LABELS[key].toUpperCase(), 11, INK, 1, 700));
  out.push(text(x - 8, y + 145, `${SEASON_LABELS[season]} · ${color}`, 10, INK, 0.5));
}

// ── Le trait à l'épreuve de l'échelle
let ry = 570;
out.push(`<line x1="48" y1="${ry - 26}" x2="${W - 48}" y2="${ry - 26}" stroke="${INK}" stroke-opacity="0.12"/>`);
out.push(text(48, ry - 6, 'LE TRAIT NE VARIE PAS AVEC L\'ÉCHELLE — même glyphe à 10, 16, 24, 48 et 96 px', 12, INK, 0.55));
let sx = 48;
for (const size of [10, 16, 24, 48, 96]) {
  out.push(glyph('aquarius', sx, ry + 100 - size, size, INK));
  out.push(text(sx, ry + 118, `${size}px`, 10, INK, 0.45));
  sx += size + 58;
}

// ── Variante B : nœuds vectoriels
out.push(text(560, ry - 6, 'VARIANTE B — NŒUDS VECTORIELS AUX EXTRÉMITÉS', 12, INK, 0.55));
sx = 560;
for (const key of ['aries', 'leo', 'sagittarius', 'capricorn'] as const) {
  out.push(glyph(key, sx, ry + 4, 96, INK, true));
  out.push(text(sx, ry + 118, ZODIAC_LABELS[key], 10, INK, 0.45));
  sx += 130;
}

// ── Le lavis saisonnier du ruban, en dégradé continu
ry = 740;
out.push(`<line x1="48" y1="${ry}" x2="${W - 48}" y2="${ry}" stroke="${INK}" stroke-opacity="0.12"/>`);
out.push(text(48, ry + 20, 'FOND DU RUBAN — la saison à 7 % sur le papier, en transition continue', 12, INK, 0.55));
const order = ['spring', 'summer', 'autumn', 'winter'] as const;
out.push('<defs><linearGradient id="wash" x1="0" x2="1">'
  + order.map((s, i) => `<stop offset="${(i / (order.length - 1)) * 100}%" stop-color="${mix(SEASON_COLORS[s], 0.1)}"/>`).join('')
  + '</linearGradient></defs>');
out.push(`<rect x="48" y="${ry + 34}" width="${W - 96}" height="76" fill="url(#wash)"/>`);
for (const [i, s] of order.entries()) {
  const px = 48 + (i / (order.length - 1)) * (W - 96);
  out.push(text(Math.min(px, W - 120), ry + 128, `${SEASON_LABELS[s]} ${mix(SEASON_COLORS[s], 0.1)}`, 10, INK, 0.5));
}

// ── Les deux valeurs de l'interface
ry = 900;
out.push(text(48, ry, 'L\'INTERFACE ENTIÈRE VIT SUR DEUX VALEURS', 12, INK, 0.55));
out.push(`<rect x="48" y="${ry + 14}" width="120" height="56" fill="${PAPER}" stroke="${INK}" stroke-opacity="0.2"/>`);
out.push(text(56, ry + 46, `Papier ${PAPER}`, 11, INK, 0.8));
out.push(`<rect x="184" y="${ry + 14}" width="120" height="56" fill="${INK}"/>`);
out.push(text(192, ry + 46, `Encre ${INK}`, 11, PAPER, 1));
out.push(text(330, ry + 40, 'Aucune couleur de marque. Aucune couleur d\'état. La couleur appartient au calendrier.', 12, INK, 0.55));

out.push('</svg>');
writeFileSync(process.argv[2], out.join('\n'), 'utf8');
console.log('écrit :', process.argv[2]);
