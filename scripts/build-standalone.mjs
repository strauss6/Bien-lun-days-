/**
 * Construit la page autonome : tout le tunnel dans un seul fichier HTML.
 *
 * Le moteur d'éphémérides, l'index de villes et leurs fuseaux, le scoring et les
 * jours rares tournent dans le navigateur — aucun appel réseau, donc rien de
 * simulé. C'est le même code que la version servie, à travers les mêmes
 * composants d'écran, ce qui en fait un test de recette utilisable sur un
 * téléphone sans rien déployer.
 *
 * `node scripts/build-standalone.mjs [sortie.html]`
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = process.argv[2] ?? 'bien-lune.html';
const work = mkdtempSync(join(tmpdir(), 'bien-lune-'));
const js = join(work, 'bundle.js');
const css = join(work, 'bundle.css');

execFileSync('npx', [
  'esbuild', 'standalone/main.tsx', '--bundle', '--minify', '--format=iife',
  '--target=es2020', '--loader:.json=json', '--jsx=automatic', '--alias:@=.',
  `--outfile=${js}`,
], { stdio: 'inherit' });

execFileSync('npx', ['@tailwindcss/cli', '-i', 'standalone.css', '-o', css, '--minify'], {
  stdio: 'inherit',
});

writeFileSync(out, `<title>Bien.Luné</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Geist+Mono:wght@400;500;600&display=swap">
<style>${readFileSync(css, 'utf8')}</style>
<div id="app"></div>
<script>${readFileSync(js, 'utf8')}</script>
`, 'utf8');

console.log(`${out} · ${(readFileSync(out).length / 1024 / 1024).toFixed(2)} Mo`);
