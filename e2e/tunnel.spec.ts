import { expect, test } from '@playwright/test';

/** Le parcours entier, du prénom aux jours rares, avec de vrais calculs. */
async function remplirLeQuiz(page: import('@playwright/test').Page) {
  await page.goto('/quiz');
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
}

test('du prénom aux trente jours, avec de vrais calculs', async ({ page }) => {
  await remplirLeQuiz(page);

  // L'écran de calcul affiche les vraies valeurs, pas une attente décorative.
  await expect(page.getByTestId('calc-step').first()).toContainText('6 août 1993, 20:40');
  await expect(page.getByText(/Ascendant .*Verseau/)).toBeVisible();
  // `toLocaleString('fr-FR')` sépare les milliers par une espace insécable étroite :
  // un espace ordinaire dans l'expression ne correspondrait à rien.
  await expect(page.getByText(/7\s?200\s+combinaisons testées/)).toBeVisible();

  await page.waitForURL('**/jours', { timeout: 20000 });

  // Un écran, une décision : un seul grand nombre, l'axe choisi au quiz.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('BUSINESS');
  // La phrase cite les aspects ; la liste technique n'existe qu'au tap.
  await expect(page.locator('.reading').first()).toContainText('Jupiter en conjonction à ton Soleil');
  await expect(page.getByText('Le détail')).toBeVisible();

  const big = await page.locator('main *').evaluateAll(
    (els) => els.filter((el) => {
      const size = parseFloat(getComputedStyle(el).fontSize);
      return size > 24 && (el.textContent ?? '').trim().length > 0 && el.children.length === 0;
    }).length,
  );
  expect(big, 'un seul nombre au-dessus de 24 px').toBe(1);

  // Quarante-cinq mots au maximum de texte courant.
  const phrase = await page.locator('.reading').first().innerText();
  expect(phrase.trim().split(/\s+/).length).toBeLessThanOrEqual(45);

  await expect(page.getByText(/divertissement et de réflexion personnelle/)).toBeVisible();
});

test('les jours rares donnent l’âge à la dernière occurrence', async ({ page }) => {
  await remplirLeQuiz(page);
  await page.waitForURL('**/jours', { timeout: 20000 });

  await page.getByRole('button', { name: /Les jours rares/ }).click();
  await page.waitForURL('**/rares');

  const events = page.getByTestId('rare-event');
  await expect(events.first()).toBeVisible();
  await expect(events.first()).toContainText(/La dernière fois, tu avais \d+ ans|Jamais auparavant/);

  // Aucune rareté fabriquée : chaque carte porte sa périodicité réelle.
  await expect(events.first()).toContainText(/une fois tous les|une ou deux fois dans une vie/);
});

test('le parcours tient dans un écran de téléphone', async ({ page }) => {
  await remplirLeQuiz(page);
  await page.waitForURL('**/jours', { timeout: 20000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
