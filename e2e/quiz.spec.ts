import { expect, test } from '@playwright/test';

test.describe('le quiz', () => {
  test('cinq écrans, une question par écran, et une demande complète à la sortie', async ({ page }) => {
    await page.goto('/quiz');

    // Une seule question visible à la fois — règle 1 du budget de densité.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Comment tu t’appelles ?');

    const next = page.getByRole('button', { name: 'Continuer' });
    await expect(next).toBeDisabled();

    await page.locator('#quiz-firstName').fill('Elioth');
    await next.click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu es né quel jour ?');
    await page.locator('#quiz-birthDate').fill('1993-08-06');
    await next.click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('À quelle heure ?');
    await expect(page.getByText('99 % de l’astrologie s’arrête')).toBeVisible();
    await page.locator('#quiz-birthTime').fill('20:40');
    await next.click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dans quelle ville ?');
    await page.locator('#quiz-city').fill('boulogne-b');
    await page.getByRole('button', { name: /Boulogne-Billancourt/ }).click();
    // L'index stocke les coordonnées à quatre décimales, soit onze mètres près.
    await expect(page.getByText(/48\.83\d\d°N/)).toBeVisible();
    await next.click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Qu’est-ce qui compte le plus en ce moment ?');
    await page.getByRole('button', { name: /Business/ }).click();
    await page.getByRole('button', { name: 'Calculer mes jours' }).click();

    await page.waitForURL('**/calcul');
    const draft = JSON.parse(await page.getByTestId('draft').innerText());
    expect(draft.firstName).toBe('Elioth');
    expect(draft.birthDate).toBe('1993-08-06');
    expect(draft.birthTime).toBe('20:40');
    expect(draft.timeKnown).toBe(true);
    expect(draft.city).toBe('Boulogne-Billancourt');
    expect(draft.lat).toBeCloseTo(48.835, 2);
    expect(draft.priorityAxis).toBe('business');
  });

  /** Le seul écran où ne pas savoir est une réponse. */
  test('l’heure inconnue débloque l’écran sans inventer d’heure', async ({ page }) => {
    await page.goto('/quiz');
    await page.locator('#quiz-firstName').fill('Elioth');
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.locator('#quiz-birthDate').fill('1993-08-06');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
    await page.locator('#quiz-timeUnknown').check();
    await expect(page.locator('#quiz-birthTime')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeEnabled();
  });

  test('l’avancement passe par la graduation, pas par une barre de progression', async ({ page }) => {
    await page.goto('/quiz');
    const bar = page.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '1');
    await expect(bar.locator('line')).toHaveCount(30);

    await page.locator('#quiz-firstName').fill('Elioth');
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(bar).toHaveAttribute('aria-valuenow', '2');
  });

  test('se remplit entièrement au clavier, avec un focus visible', async ({ page }) => {
    await page.goto('/quiz');
    await expect(page.locator('#quiz-firstName')).toBeFocused();

    await page.keyboard.type('Elioth');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu es né quel jour ?');
    await expect(page.locator('#quiz-birthDate')).toBeFocused();

    // Le focus d'un champ se voit par son filet, pas par une bague — voir
    // le test dédié plus bas.
    const border = await page.locator('#quiz-birthDate').evaluate(
      (el) => getComputedStyle(el).borderBottomWidth,
    );
    expect(border).toBe('2px');
  });

  test('reste dans l’écran d’un téléphone, sans débordement horizontal', async ({ page }) => {
    await page.goto('/quiz');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

/** Aucune couleur d'accent du navigateur ne doit percer dans l'interface. */
test('le focus d’un champ reste dans la palette', async ({ page }) => {
  await page.goto('/quiz');
  const field = page.locator('#quiz-firstName');
  await field.focus();

  const style = await field.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, borderBottom: s.borderBottomColor, width: s.borderBottomWidth };
  });
  // Le focus se voit par le filet du bas, pas par une bague.
  expect(style.outline).toBe('none');
  expect(style.width).toBe('2px');
  expect(style.borderBottom).toBe('rgb(15, 20, 25)');
});
