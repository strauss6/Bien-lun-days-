import { expect, test, type Page } from '@playwright/test';
import { allerAuMois, premiereVisite } from './helpers/parcours';

/** Saisir la seconde personne, comme on la saisit vraiment : de mémoire. */
async function saisirLautre(page: Page, { heure = '07:15' }: { heure?: string } = {}) {
  await page.locator('#duo-firstName').fill('Marie');
  await page.locator('#duo-birthDate').fill('1996-02-14');
  await page.locator('#duo-birthTime').fill(heure);
  await page.locator('#quiz-city').fill('marseil');
  await page.getByRole('button', { name: /Marseille/ }).first().click();
  await page.getByRole('button', { name: 'Comparer les deux thèmes' }).click();
}

async function allerAuDuo(page: Page) {
  await premiereVisite(page);
  await allerAuMois(page);
  await page.getByTestId('duo-entry').click();
  await page.waitForURL('**/duo');
}

test('la comparaison rend trois choses à faire et trois à éviter', async ({ page }) => {
  await allerAuDuo(page);
  await saisirLautre(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Toi et Marie');
  await expect(page.getByText('TROIS CHOSES À FAIRE')).toBeVisible();
  await expect(page.getByText('TROIS CHOSES À ÉVITER')).toBeVisible();
  await expect(page.getByTestId('duo-link')).toHaveCount(6);

  /*
   * Le livrable demandé par le rédacteur est un conseil, pas une note : aucun
   * chiffre de compatibilité ne doit apparaître, et le budget de densité veut
   * qu'aucun nombre ne dépasse 24 px.
   */
  const grandsNombres = await page.locator('main *').evaluateAll((els) => els.filter((el) => {
    const texte = (el.textContent ?? '').trim();
    if (el.children.length > 0 || texte.length === 0) return false;
    // La règle 3 porte sur les nombres : un titre à 26 px est en règle.
    return /\d/.test(texte) && parseFloat(getComputedStyle(el).fontSize) > 24;
  }).length);
  expect(grandsNombres, 'aucun grand nombre : la comparaison ne se note pas').toBe(0);
  await expect(page.locator('main')).not.toContainText(/\/\s?10|sur 10|% de compatibilité/);

  // Chaque conseil tient dans le budget de mots.
  for (const texte of await page.locator('[data-testid="duo-link"] .reading').allInnerTexts()) {
    expect(texte.trim().split(/\s+/).length, texte).toBeLessThanOrEqual(45);
  }
});

test('aucune donnée de naissance ne passe par l’adresse', async ({ page }) => {
  await allerAuDuo(page);
  await saisirLautre(page);
  const url = page.url();
  for (const fuite of ['Marie', '1996', '02-14', 'marseil', '43.2', '5.3']) {
    expect(url.toLowerCase(), `« ${fuite} » dans l’adresse`).not.toContain(fuite.toLowerCase());
  }
});

test('la comparaison se retient, et se remplace', async ({ page }) => {
  await allerAuDuo(page);
  await saisirLautre(page);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Toi et Marie');

  await page.getByRole('button', { name: /Comparer avec quelqu’un d’autre/ }).click();
  await expect(page.locator('#duo-firstName')).toBeVisible();
  await expect(page.locator('#duo-firstName')).toHaveValue('');
});

/*
 * L'heure est obligatoire des deux côtés depuis le 11 octobre 2026 : une
 * comparaison dont un thème n'a pas la sienne perd l'Ascendant **des deux**, le
 * moteur écartant les angles dès qu'il en manque un. Il n'y a donc plus de cas
 * dégradé à annoncer — il y a un champ à remplir.
 */
test('la comparaison exige l’heure de l’autre personne', async ({ page }) => {
  await allerAuDuo(page);
  await expect(page.locator('#duo-timeUnknown')).toHaveCount(0);

  const comparer = page.getByRole('button', { name: 'Comparer les deux thèmes' });
  await page.locator('#duo-firstName').fill('Marie');
  await page.locator('#duo-birthDate').fill('1996-02-14');
  await page.locator('#quiz-city').fill('marseil');
  await page.getByRole('button', { name: /Marseille/ }).first().click();
  await expect(comparer, 'tout saisi sauf l’heure').toBeDisabled();

  await page.locator('#duo-birthTime').fill('07:15');
  await expect(comparer).toBeEnabled();
  await comparer.click();
  await expect(page.getByTestId('duo-limite')).toHaveCount(0);
  await expect(page.getByTestId('duo-link').first()).toBeVisible();
});

test('rien n’annonce de rupture ni de fatalité', async ({ page }) => {
  await allerAuDuo(page);
  await saisirLautre(page);
  const texte = await page.locator('main').innerText();
  for (const interdit of ['rédhibitoire', 'incompatible', 'mauvais', 'quitter', 'rompre']) {
    expect(texte.toLowerCase(), interdit).not.toContain(interdit);
  }
  await expect(page.getByText(/divertissement et de réflexion personnelle/)).toBeVisible();
});
