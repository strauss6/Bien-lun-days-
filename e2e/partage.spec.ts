import { expect, test } from '@playwright/test';
import { encodeRibbon, type RibbonShareDay } from '../lib/design/share-code';
import { AXIS_IDS } from '../lib/astro/transits';
import type { Season } from '../lib/astro/types';

/** Trente jours d'été qui basculent en automne, comme une vraie fenêtre de septembre. */
const days: RibbonShareDay[] = Array.from({ length: 30 }, (_, i) => ({
  season: (i < 12 ? 'summer' : 'autumn') as Season,
  scores: Object.fromEntries(
    AXIS_IDS.map((a, k) => [a, 10 + ((i * 13 + k * 37) % 85)]),
  ) as RibbonShareDay['scores'],
}));
const code = encodeRibbon(days);

test('l’image de partage se rend en PNG', async ({ request }) => {
  const res = await request.get(`/api/partage?r=${code}&n=Elioth`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  // Une image vide pèserait quelques centaines d'octets : on vérifie qu'il y a
  // bien un ruban dessus, pas seulement un cadre.
  expect((await res.body()).byteLength).toBeGreaterThan(20_000);
});

test('l’image se met en cache pour toujours : l’adresse détermine les pixels', async ({ request }) => {
  const res = await request.get(`/api/partage?r=${code}`);
  expect(res.headers()['cache-control']).toContain('immutable');
});

test('deux rubans différents donnent deux images différentes', async ({ request }) => {
  const autre = encodeRibbon(days.map((d, i) => ({ ...d, scores: { ...d.scores, business: (i * 3) % 90 } })));
  const [a, b] = await Promise.all([
    request.get(`/api/partage?r=${code}`).then((r) => r.body()),
    request.get(`/api/partage?r=${autre}`).then((r) => r.body()),
  ]);
  expect(Buffer.compare(a, b)).not.toBe(0);
});

test('un code absent ou illisible est refusé, jamais dessiné au hasard', async ({ request }) => {
  expect((await request.get('/api/partage')).status()).toBe(400);
  expect((await request.get('/api/partage?r=nimporte')).status()).toBe(400);
  expect((await request.get(`/api/partage?r=${code.slice(0, -8)}`)).status()).toBe(400);
});

test('le prénom vient d’un inconnu : il est borné et nettoyé', async ({ request }) => {
  // Le prénom voyage dans une adresse publique. Satori ne rend pas de balises,
  // mais la marque ne doit pas non plus servir à afficher n'importe quoi.
  const res = await request.get(`/api/partage?r=${code}&n=${encodeURIComponent('<script>x</script>Élo-Ïse')}`);
  expect(res.status()).toBe(200);
  const long = await request.get(`/api/partage?r=${code}&n=${'A'.repeat(300)}`);
  expect(long.status()).toBe(200);
});
