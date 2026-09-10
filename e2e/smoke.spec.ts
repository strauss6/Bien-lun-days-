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

test('les douze glyphes sont des tracés SVG, pas une police de symboles', async ({ page }) => {
  await page.goto('/');

  const glyphs = page.locator('ul[aria-label] svg');
  await expect(glyphs).toHaveCount(12);

  // Règle de design vérifiée jusque dans le DOM rendu : aucune courbe.
  const commands = await glyphs.locator('path').evaluateAll(
    (paths) => paths.map((p) => p.getAttribute('d') ?? ''),
  );
  expect(commands.length).toBeGreaterThan(20);
  for (const d of commands) expect(d).not.toMatch(/[CcSsQqTt]/);
});
