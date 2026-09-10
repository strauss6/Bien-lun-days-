import { expect, test } from '@playwright/test';

test.describe('l’accueil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('mène au parcours, la démonstration restant secondaire', async ({ page }) => {
    const principal = page.getByRole('link', { name: 'Calculer mes jours' });
    await expect(principal).toBeVisible();
    await expect(principal).toHaveAttribute('href', '/quiz');

    await expect(page.getByRole('link', { name: /Voir la démonstration/ })).toHaveAttribute(
      'href', '/demo/ruban',
    );

    await principal.click();
    await page.waitForURL('**/quiz');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Comment tu t’appelles ?');
  });

  /**
   * Six colonnes faisaient se chevaucher « Sagittaire », « Capricorne » et
   * « Verseau » à 412 px de large. Le test compare les rectangles deux à deux :
   * un nom qui déborde sur son voisin est un défaut visible, pas une nuance.
   */
  test('les douze noms de signes ne se chevauchent jamais', async ({ page }) => {
    const labels = page.locator('.zodiac-index span');
    await expect(labels).toHaveCount(12);

    const boxes = await labels.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }),
    );

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        expect(overlap, `les noms ${i} et ${j} se chevauchent`).toBe(false);
      }
    }
  });

  test('porte la mention légale et ne déborde pas', async ({ page }) => {
    await expect(page.getByText(/divertissement et de réflexion personnelle/)).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
