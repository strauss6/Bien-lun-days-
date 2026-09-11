import { expect, test } from '@playwright/test';

test('la page se charge sur mobile, sans débordement horizontal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('ne se valent pas');
  await expect(page.getByText('divertissement et de réflexion personnelle')).toBeVisible();

  // Mobile d'abord : aucun défilement horizontal ne doit être possible.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

/*
 * La règle des polylignes, vérifiée jusque dans le DOM rendu.
 *
 * Elle l'était sur l'index des douze signes de l'ancien accueil. Cet index a
 * disparu avec la nouvelle direction produit — une roue du zodiaque sur le
 * premier écran est le signal « horoscope générique » que le produit refuse. Les
 * glyphes, eux, sont restés là où ils servent de repère : sur les pics du ruban.
 * Le test les y suit. Les douze tracés eux-mêmes restent couverts par
 * `lib/design/__tests__/zodiac-paths.test.ts`.
 */
test('les glyphes du ruban sont des tracés SVG, pas une police de symboles', async ({ page }) => {
  await page.goto('/demo/ruban');

  const commands = await page.locator('main svg path').evaluateAll(
    (paths) => paths.map((p) => p.getAttribute('d') ?? '').filter(Boolean),
  );
  expect(commands.length).toBeGreaterThan(0);
  for (const d of commands) expect(d).not.toMatch(/[CcSsQqTtAa]/);
});

test('l\'API rend un rapport complet à partir des données de naissance', async ({ request }) => {
  const response = await request.post('/api/reading', {
    data: {
      firstName: 'Elioth',
      birthDate: '1993-08-06',
      birthTime: '20:40',
      timeKnown: true,
      lat: 48.8352,
      lng: 2.2409,
      city: 'Boulogne-Billancourt',
      country: 'FR',
      priorityAxis: 'business',
      startDate: '2026-09-10',
    },
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.days).toHaveLength(30);
  expect(payload.chart.asc).toContain('Verseau');
  expect(payload.days[0].axes.business.explaining[0].notation).toMatch(/\S \S \S/);
});

test('l\'API refuse une date au format français, avec un message utilisable', async ({ request }) => {
  const response = await request.post('/api/reading', {
    data: {
      firstName: 'Elioth', birthDate: '06/08/1993', birthTime: '20:40', timeKnown: true,
      lat: 48.8352, lng: 2.2409, city: 'Boulogne-Billancourt', country: 'FR',
      priorityAxis: 'business', startDate: '2026-09-10',
    },
  });

  expect(response.status()).toBe(422);
  const body = await response.json();
  expect(body.error).toContain('AAAA-MM-JJ');
  expect(body.field).toBe('birthDate');
});

test('la recherche de ville répond en français', async ({ request }) => {
  const response = await request.get('/api/cities?q=boulogne-b');
  expect(response.status()).toBe(200);
  const { cities } = await response.json();
  expect(cities[0].name).toBe('Boulogne-Billancourt');
  expect(cities[0].lat).toBeCloseTo(48.83, 1);
});
