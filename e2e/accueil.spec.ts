import { expect, test } from '@playwright/test';
import { premiereVisite } from './helpers/parcours';

test.describe('première visite', () => {
  test('propose une porte unique, sans rien à déverrouiller', async ({ page }) => {
    await page.goto('/');

    const commencer = page.getByRole('link', { name: 'Commencer' });
    await expect(commencer).toBeVisible();
    await expect(commencer).toHaveAttribute('href', '/quiz');

    // La mention de bêta est lisible et secondaire : pas de bandeau, pas de
    // couleur d'alerte, pas de pourcentage d'avancement.
    await expect(page.getByText('BÊTA')).toBeVisible();
    await expect(page.getByText(/en cours de développement|bientôt|%/i)).toHaveCount(0);

    await commencer.click();
    await page.waitForURL('**/quiz');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Comment tu t’appelles ?');
  });

  /**
   * L'exigence commerciale de la bêta, vérifiée sur tous les écrans du produit :
   * aucun cadenas, aucun prix, aucun essai limité, aucune promesse de gratuité.
   * C'est une règle facile à enfreindre par inadvertance en réutilisant un texte.
   */
  test('aucune pression commerciale, nulle part', async ({ page }) => {
    await premiereVisite(page);

    const interdits = /débloquer|premium|abonn|essai gratuit|gratuit à vie|paiement|payant|🔒|offre limitée|il te reste/i;
    for (const chemin of ['/', '/mois', '/rares', '/profil']) {
      await page.goto(chemin);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('main')).not.toContainText(interdits);
    }
  });
});
