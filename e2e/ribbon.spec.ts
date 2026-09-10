import { expect, test } from '@playwright/test';

test.describe('le ruban des trente jours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/ruban');
  });

  test('rend trois bandes, une graduation et un curseur', async ({ page }) => {
    const svg = page.getByRole('img', { name: /Trente jours/ });
    await expect(svg).toBeVisible();
    // `toBeVisible` ne s'applique pas à une ligne SVG verticale : sa boîte fait
    // zéro pixel de large, ce que Playwright compte comme caché. On vérifie donc
    // sa présence et son tracé ; son comportement est couvert plus bas.
    const cursor = page.getByTestId('ribbon-cursor');
    await expect(cursor).toBeAttached();
    await expect(cursor).toHaveAttribute('stroke-width', '1.1');

    // Trois libellés d'axe dans le ruban, et rien de plus : le budget de densité
    // interdit une légende expliquant les modes de tracé.
    await expect(page.getByTestId('axis-label')).toHaveCount(3);
    await expect(page.getByText(/colonne pleine|double filet|pile de tirets/)).toHaveCount(0);
  });

  test('reste lisible sur un téléphone, sans débordement horizontal', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const box = await page.getByRole('img', { name: /Trente jours/ }).boundingBox();
    expect(box!.width).toBeGreaterThan(280);
    expect(box!.height).toBeGreaterThan(80);
  });

  test('le curseur suit le jour choisi', async ({ page }) => {
    const cursor = page.getByTestId('ribbon-cursor');
    const before = await cursor.getAttribute('x1');

    await page.locator('#ribbon-day').fill('20');
    await expect(page.getByText('AUJOURD’HUI + 20')).toBeVisible();

    const after = await cursor.getAttribute('x1');
    expect(Number(after)).toBeGreaterThan(Number(before));
  });

  /** La couleur n'appartient qu'aux saisons : rien d'autre n'est teinté. */
  test('la seule couleur du ruban est le lavis saisonnier', async ({ page }) => {
    const fills = await page.locator('svg rect, svg line, svg text').evaluateAll((els) =>
      els.map((el) => el.getAttribute('fill') ?? el.getAttribute('stroke') ?? ''),
    );
    for (const f of fills) {
      const isTokenOrGradient = f === '' || f.startsWith('var(--color-ink)') || f.startsWith('url(#');
      expect(isTokenOrGradient, `teinte inattendue : ${f}`).toBe(true);
    }
  });

  test('se révèle une seule fois par session', async ({ page }) => {
    const stored = await page.evaluate(() => sessionStorage.getItem('ribbon-revealed'));
    expect(stored).toBe('1');
  });

  test('sous prefers-reduced-motion, le ruban est là d\'emblée', async ({ page, context }) => {
    await context.clearCookies();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demo/ruban');
    const width = await page.locator('clipPath rect').first().getAttribute('width');
    expect(Number(width)).toBeGreaterThan(300);
  });
});
