import { expect, type Page } from '@playwright/test';

/**
 * Le parcours de première visite, jusqu'au rendez-vous du jour.
 *
 * Il se termine sur l'écran quotidien et non sur le mois : depuis la direction
 * produit du 11 septembre 2026, c'est la journée qui est le produit.
 */
export async function premiereVisite(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Commencer' }).click();
  await page.waitForURL('**/quiz');
  await page.locator('#quiz-firstName').fill('Elioth');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('#quiz-birthDate').fill('1993-08-06');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('#quiz-birthTime').fill('20:40');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('#quiz-city').fill('boulogne-b');
  await page.getByRole('button', { name: /Boulogne-Billancourt/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: /Business/ }).click();
  await page.getByRole('button', { name: 'Calculer mes jours' }).click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 25000 });
  await expect(page.getByTestId('score')).toBeVisible();
}

/** Le mois, atteint comme un utilisateur l'atteint : depuis la journée. */
export async function allerAuMois(page: Page) {
  await page.getByRole('link', { name: /Voir le mois/ }).click();
  await page.waitForURL('**/mois');
  await expect(page.getByTestId('day-track')).toBeVisible();
}
