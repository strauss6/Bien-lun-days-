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

/**
 * Règle 3 du budget de densité : un seul nombre au-dessus de 24 px **par écran**.
 *
 * On compte ce que l'œil voit, pas ce que le DOM contient : depuis que les trente
 * jours vivent dans un rail aimanté, vingt-neuf cartes existent hors du champ à
 * tout instant. Compter les feuilles du DOM mesurerait le rail ; intersecter le
 * cadre de vue mesure l'écran, qui est ce que la règle nomme.
 */
async function grandsNombresVisibles(page: import('@playwright/test').Page) {
  return page.locator('main *').evaluateAll((els) => els.filter((el) => {
    if (el.children.length > 0 || (el.textContent ?? '').trim().length === 0) return false;
    if (parseFloat(getComputedStyle(el).fontSize) <= 24) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0
      && r.right > 0 && r.left < window.innerWidth
      && r.bottom > 0 && r.top < window.innerHeight;
  }).length);
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
  await expect(page.getByText('Le détail').first()).toBeVisible();

  expect(await grandsNombresVisibles(page), 'un seul nombre au-dessus de 24 px').toBe(1);

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

test('le doigt sur le ruban déplace le jour, la pastille ramène à aujourd’hui', async ({ page }) => {
  await remplirLeQuiz(page);
  await page.waitForURL('**/jours', { timeout: 20000 });

  await expect(page.getByText('AUJOURD’HUI', { exact: true })).toBeVisible();
  // Rien à ramener tant qu'on est sur le jour zéro : la pastille n'existe pas.
  await expect(page.getByTestId('today-pill')).toHaveCount(0);

  // Un glissement du doigt sur le ruban, du premier tiers vers le dernier.
  const scrub = page.getByTestId('ribbon-scrub');
  const box = (await scrub.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();

  // La carte a suivi le doigt : on n'est plus sur aujourd'hui.
  const track = page.getByTestId('day-track');
  const atteint = Number(await track.getAttribute('data-day'));
  expect(atteint).toBeGreaterThan(20);
  await expect(page.getByText(`+${atteint}`, { exact: true })).toBeInViewport();

  // Le rail a bien suivi, et il ne montre toujours qu'une carte.
  await expect.poll(async () => grandsNombresVisibles(page)).toBe(1);

  await page.getByTestId('today-pill').click();
  await expect(track).toHaveAttribute('data-day', '0');
  await expect(page.getByTestId('today-pill')).toHaveCount(0);
  await expect.poll(async () => track.evaluate((el) => el.scrollLeft)).toBe(0);
});

test('les cartes s’accrochent une à une', async ({ page }) => {
  await remplirLeQuiz(page);
  await page.waitForURL('**/jours', { timeout: 20000 });

  const track = page.getByTestId('day-track');
  // Un défilement qui s'arrête entre deux cartes doit se recaler sur la plus proche.
  await track.evaluate((el) => el.scrollTo({ left: el.clientWidth * 3 + el.clientWidth * 0.4 }));

  await expect(track).toHaveAttribute('data-day', '3');
  await expect(page.getByText('+3', { exact: true })).toBeInViewport();
  await expect.poll(async () => track.evaluate((el) => el.scrollLeft / el.clientWidth))
    .toBeCloseTo(3, 1);
});
