import { expect, test, type Page } from '@playwright/test';
import { allerAuMois, premiereVisite } from './helpers/parcours';

/**
 * Règle 3 du budget de densité : un seul nombre au-dessus de 24 px **par écran**.
 *
 * On compte ce que l'œil voit, pas ce que le DOM contient : le mois garde trente
 * cartes dans un rail aimanté, dont vingt-neuf hors du champ à tout instant.
 */
async function grandsNombresVisibles(page: Page) {
  return page.locator('main *').evaluateAll((els) => els.filter((el) => {
    if (el.children.length > 0 || (el.textContent ?? '').trim().length === 0) return false;
    if (parseFloat(getComputedStyle(el).fontSize) <= 24) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0
      && r.right > 0 && r.left < window.innerWidth
      && r.bottom > 0 && r.top < window.innerHeight;
  }).length);
}

test('du prénom au rendez-vous du jour, avec de vrais calculs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Commencer' }).click();
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

  // L'écran de calcul porte les vraies valeurs du calcul, pas une attente décorative.
  await expect(page.getByTestId('calc-step').first()).toContainText('6 août 1993, 20:40');
  await expect(page.getByText(/Ascendant .*Verseau/)).toBeVisible();
  // 49 paires uniques × 5 aspects × 30 jours. Le chiffre a changé le jour où la
  // Lune s'est mise à viser tout le thème pour le score global — et où le compte
  // a cessé d'additionner deux fois les paires partagées entre deux axes.
  await expect(page.getByText(/7\s?350\s+combinaisons testées/)).toBeVisible();

  // Et il débouche sur la journée, jamais sur le mois.
  await page.waitForURL((url) => url.pathname === '/', { timeout: 25000 });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('BUSINESS');
  await expect(page.locator('.reading').first()).toContainText('Jupiter en conjonction à ton Soleil');

  expect(await grandsNombresVisibles(page), 'un seul nombre au-dessus de 24 px').toBe(1);
  const phrase = await page.locator('.reading').first().innerText();
  expect(phrase.trim().split(/\s+/).length).toBeLessThanOrEqual(45);

  await expect(page.getByText(/divertissement et de réflexion personnelle/)).toBeVisible();
});

/*
 * Ces deux tests comparent des scores entre eux. Les compteurs montent de zéro
 * en 750 ms : lus en cours de montée, ils donnent 29 là où la valeur est 84. On
 * coupe donc l'animation — c'est la valeur qu'on vérifie, pas la façon dont elle
 * s'affiche, et la montée a son propre test.
 */
test.describe('cohérence des scores', () => {
  test.use({ reducedMotion: 'reduce' });

test('les trois jours sont immédiatement accessibles, et l’axe change sans recalcul', async ({ page }) => {
  await premiereVisite(page);

  const aujourdhui = await page.getByTestId('score').innerText();
  for (const jour of ['DEMAIN', 'APRÈS-DEMAIN']) {
    await page.getByRole('button', { name: jour, exact: true }).click();
    await expect(page.getByTestId('score')).toBeVisible();
  }
  await page.getByRole('button', { name: 'AUJOURD’HUI', exact: true }).click();
  await expect.poll(async () => page.getByTestId('score').innerText()).toBe(aujourdhui);

  // Les deux autres axes sont à un geste, sur la même journée.
  await page.getByRole('button', { name: /AMOUR/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AMOUR');
  await page.getByRole('button', { name: /BUSINESS/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('BUSINESS');
  await expect(page.getByTestId('score')).toHaveText(aujourdhui);
});

/**
 * L'exigence de cohérence du brief, vérifiée là où elle se voit : une même date
 * doit porter le même score dans la vue du jour et dans le mois. Le moteur le
 * garantit par son étalonnage stable ; ce test vérifie que l'interface ne le
 * défait pas en recalculant de son côté.
 */
test('une même date porte le même score dans la journée et dans le mois', async ({ page }) => {
  await premiereVisite(page);

  const parJour: string[] = [];
  for (const jour of ['AUJOURD’HUI', 'DEMAIN', 'APRÈS-DEMAIN']) {
    await page.getByRole('button', { name: jour, exact: true }).click();
    parJour.push(await page.getByTestId('score').innerText());
  }
  await page.getByRole('button', { name: 'AUJOURD’HUI', exact: true }).click();

  await allerAuMois(page);
  const track = page.getByTestId('day-track');
  const parMois: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    await track.evaluate((el, index) => el.scrollTo({ left: el.clientWidth * index }), i);
    await expect(track).toHaveAttribute('data-day', String(i));
    parMois.push(await page.locator('.day-track > *').nth(i).locator('p').first().innerText());
  }

  expect(parMois).toEqual(parJour);
});

});

test('le mois est accessible sans restriction, et ramène à aujourd’hui', async ({ page }) => {
  await premiereVisite(page);
  await allerAuMois(page);

  await expect(page.getByText('BÊTA')).toBeVisible();
  await page.getByRole('link', { name: 'Aujourd’hui' }).click();
  await page.waitForURL((url) => url.pathname === '/');
  await expect(page.getByRole('button', { name: 'AUJOURD’HUI', exact: true })).toHaveAttribute('aria-current', 'date');
});

/**
 * « Une nouvelle visite doit ramener naturellement sur aujourd'hui », même après
 * avoir exploré le mois la fois précédente — et sans repasser par le
 * questionnaire, le profil étant gardé sur l'appareil.
 */
test('une nouvelle visite retrouve le profil et rouvre sur aujourd’hui', async ({ page }) => {
  await premiereVisite(page);
  await allerAuMois(page);

  await page.goto('/');
  await expect(page.getByTestId('score')).toBeVisible();
  await expect(page.getByRole('button', { name: 'AUJOURD’HUI', exact: true })).toHaveAttribute('aria-current', 'date');
  await expect(page.getByRole('link', { name: 'Commencer' })).toHaveCount(0);
});

test('les données de naissance ne passent jamais par une adresse', async ({ page }) => {
  const vues: string[] = [];
  page.on('framenavigated', (f) => vues.push(f.url()));
  await premiereVisite(page);
  await allerAuMois(page);
  await page.goto('/profil');

  for (const url of vues) {
    expect(url).not.toMatch(/1993|20%3A40|20:40|boulogne|48\.83|Elioth/i);
  }
});

test('mes données disent où elles vivent, et se corrigent', async ({ page }) => {
  await premiereVisite(page);
  await page.getByRole('link', { name: 'Mes données' }).click();
  await page.waitForURL('**/profil');

  await expect(page.getByText('Boulogne-Billancourt (FR)')).toBeVisible();
  await expect(page.getByText(/sur cet appareil/)).toBeVisible();

  // Corriger part d'un formulaire déjà rempli, pas d'une page blanche.
  await page.getByRole('link', { name: 'Corriger mes données' }).click();
  await page.waitForURL('**/quiz');
  await expect(page.locator('#quiz-firstName')).toHaveValue('Elioth');
});

test('les jours rares donnent l’âge à la dernière occurrence', async ({ page }) => {
  await premiereVisite(page);
  await allerAuMois(page);
  await page.getByRole('button', { name: /Les jours rares/ }).click();
  await page.waitForURL('**/rares');

  const events = page.getByTestId('rare-event');
  await expect(events.first()).toBeVisible();
  await expect(events.first()).toContainText(
    /La dernière fois, tu avais \d+ ans|Jamais depuis ta naissance|Aucune occurrence antérieure/,
  );
  await expect(events.first()).toContainText(/une fois tous les|une ou deux fois dans une vie/);
  // Jamais l'affirmation absolue : le balayage couvre une vie, pas l'éternité.
  await expect(page.locator('main')).not.toContainText('Jamais auparavant');
});

test('le parcours tient dans un écran de téléphone', async ({ page }) => {
  await premiereVisite(page);
  for (const chemin of ['/', '/mois', '/rares', '/profil']) {
    await page.goto(chemin);
    await expect(page.locator('main')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, chemin).toBeLessThanOrEqual(1);
  }
});

test('le doigt sur le ruban déplace le jour, la pastille ramène à aujourd’hui', async ({ page }) => {
  await premiereVisite(page);
  await allerAuMois(page);
  await expect(page.getByTestId('today-pill')).toHaveCount(0);

  const scrub = page.getByTestId('ribbon-scrub');
  const box = (await scrub.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();

  const track = page.getByTestId('day-track');
  const atteint = Number(await track.getAttribute('data-day'));
  expect(atteint).toBeGreaterThan(20);
  // Le rang affiché suit le doigt. On vérifie qu'il est rendu, pas qu'il tombe
  // dans le pli : sous charge, le chargement des polices décale la mise en page
  // de quelques pixels et « dans le cadre de vue » devient une loterie.
  await expect(page.getByText(`+${atteint}`, { exact: true })).toBeVisible();
  await expect.poll(async () => grandsNombresVisibles(page)).toBe(1);

  await page.getByTestId('today-pill').click();
  await expect(track).toHaveAttribute('data-day', '0');
  await expect(page.getByTestId('today-pill')).toHaveCount(0);
});

test('les cartes s’accrochent une à une', async ({ page }) => {
  await premiereVisite(page);
  await allerAuMois(page);

  const track = page.getByTestId('day-track');
  await track.evaluate((el) => el.scrollTo({ left: el.clientWidth * 3 + el.clientWidth * 0.4 }));
  await expect(track).toHaveAttribute('data-day', '3');
  await expect(page.getByText('+3', { exact: true })).toBeVisible();
  // L'aimantation est une animation du navigateur : on la laisse se poser.
  await expect.poll(
    async () => track.evaluate((el) => el.scrollLeft / el.clientWidth),
    { timeout: 8000 },
  ).toBeCloseTo(3, 1);
});

test('sous prefers-reduced-motion, les scores sont là d’emblée', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await premiereVisite(page);
  expect(await page.evaluate(() => sessionStorage.getItem('scores-counted'))).toBeNull();
  expect(Number(await page.getByTestId('score').innerText())).toBeGreaterThan(0);
});

/**
 * Le score global du jour, porté aux trois quarts par la Lune.
 *
 * Il doit être présent, stable comme les autres, et rester sous le grand nombre
 * de l'axe prioritaire : un seul nombre au-dessus de 24 px par écran.
 */
test('le jour porte son propre score, sans devenir le grand nombre de l’écran', async ({ page }) => {
  await premiereVisite(page);

  await expect(page.getByText('LE JOUR')).toBeVisible();
  const jour = page.getByTestId('overall');
  await expect(jour).toBeVisible();
  await expect.poll(async () => Number(await jour.innerText())).toBeGreaterThan(0);

  // Le grand nombre reste celui de l'axe : le score du jour est à 20 px.
  expect(await grandsNombresVisibles(page)).toBe(1);
  const taille = await jour.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(taille).toBeLessThanOrEqual(24);

  // Et la Lune dit ce qu'elle touche, ou dit qu'elle ne touche rien.
  await expect(page.getByText(/Lune en (conjonction|sextile|carré|trigone|opposition) à|La Lune ne touche aucun point/))
    .toBeVisible();
});

test.describe('le score du jour ne bouge pas non plus', () => {
  test.use({ reducedMotion: 'reduce' });

  test('il vaut la même chose d’un onglet à l’autre et au retour', async ({ page }) => {
    await premiereVisite(page);
    const jour = page.getByTestId('overall');

    const aujourdhui = await jour.innerText();
    await page.getByRole('button', { name: 'DEMAIN', exact: true }).click();
    const demain = await jour.innerText();
    await page.getByRole('button', { name: 'AUJOURD’HUI', exact: true }).click();
    expect(await jour.innerText()).toBe(aujourdhui);

    // Changer d'axe ne touche pas au score du jour : il ne mesure aucun domaine.
    await page.getByRole('button', { name: /AMOUR/ }).click();
    expect(await jour.innerText()).toBe(aujourdhui);

    // Et une nouvelle visite retrouve exactement les mêmes valeurs.
    await page.goto('/');
    await expect(jour).toBeVisible();
    expect(await jour.innerText()).toBe(aujourdhui);
    await page.getByRole('button', { name: 'DEMAIN', exact: true }).click();
    expect(await jour.innerText()).toBe(demain);
  });
});
