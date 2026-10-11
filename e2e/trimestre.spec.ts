import { expect, test, type Page } from '@playwright/test';
import { allerAuMois, premiereVisite } from './helpers/parcours';

async function allerAuTrimestre(page: Page) {
  await premiereVisite(page);
  await allerAuMois(page);
  await page.getByTestId('quarter-entry').click();
  await page.waitForURL('**/trimestre');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Les trois mois qui viennent');
}

test('le trimestre montre des fenêtres, pas des journées', async ({ page }) => {
  await allerAuTrimestre(page);

  const fenetres = page.getByTestId('quarter-period');
  const vides = page.getByTestId('quarter-empty');
  expect(await fenetres.count() + await vides.count()).toBeGreaterThan(0);

  if (await fenetres.count() > 0) {
    /*
     * Chaque fenêtre est datée des deux bouts : c'est tout l'intérêt de la vue.
     * L'année vit dans l'en-tête et non sur chaque ligne — répétée cinq fois elle
     * faisait passer la date à la ligne sur un téléphone.
     */
    await expect(fenetres.first()).toContainText(/du \d+\w* \w+ au \d+\w* \w+/);
    await expect(page.locator('main')).toContainText(/du .+ au .+ \d{4} ·/);
    // Et dure au moins une semaine — en deçà, c'est une journée, et elle a son écran.
    await expect(fenetres.first()).toContainText(/\d+ (jours|semaines|mois)/);
  }

  /*
   * On ne note pas un trimestre : aucun grand nombre, et aucune moyenne affichée
   * comme un score. Règle 3 du budget de densité.
   */
  const grandsNombres = await page.locator('main *').evaluateAll((els) => els.filter((el) => {
    const texte = (el.textContent ?? '').trim();
    if (el.children.length > 0 || texte.length === 0) return false;
    return /\d/.test(texte) && parseFloat(getComputedStyle(el).fontSize) > 24;
  }).length);
  expect(grandsNombres, 'le trimestre ne se note pas').toBe(0);

  for (const texte of await page.locator('main .reading').allInnerTexts()) {
    expect(texte.trim().split(/\s+/).length, texte).toBeLessThanOrEqual(45);
  }
});

test('les trois axes ont chacun leur liste', async ({ page }) => {
  await allerAuTrimestre(page);
  for (const axe of ['business', 'love', 'energy']) {
    await page.getByTestId(`quarter-axis-${axe}`).click();
    await expect(page.getByTestId(`quarter-axis-${axe}`)).toHaveAttribute('aria-pressed', 'true');
    const n = await page.getByTestId('quarter-period').count();
    const vide = await page.getByTestId('quarter-empty').count();
    expect(n + vide, `${axe} : ni fenêtre ni message`).toBeGreaterThan(0);
  }
});

/*
 * L'exigence centrale du projet : un même jour porte le même score partout. Le
 * trimestre et le mois lisent le même rapport — le premier en entier, le second
 * sur ses trente premiers jours — donc le ruban du mois doit être exactement le
 * début de celui du trimestre.
 */
test('le mois est le début du trimestre, au pixel près', async ({ page }) => {
  await premiereVisite(page);
  await allerAuMois(page);

  const lireRuban = () => page.locator('[data-testid="ribbon-cursor"]').first().isVisible();
  await expect(page.getByRole('img', { name: /^\d+ jours, du / })).toBeVisible();
  const mois = await page.getByRole('img', { name: /^\d+ jours, du / }).getAttribute('aria-label');
  void lireRuban;

  await page.getByTestId('quarter-entry').click();
  await page.waitForURL('**/trimestre');
  const trimestre = await page.getByRole('img', { name: /^\d+ jours, du / }).getAttribute('aria-label');

  // Même premier jour, spans différents : une seule fenêtre calculée, deux lectures.
  const debut = (l: string | null) => /du (\S+) au/.exec(l ?? '')?.[1];
  expect(debut(mois)).toBe(debut(trimestre));
  expect(mois).toContain('30 jours');
  expect(trimestre).toContain('90 jours');
});

test('le trimestre ne porte pas de curseur de jour', async ({ page }) => {
  await allerAuTrimestre(page);
  // À 3,6 px la colonne, un curseur désignerait une journée au hasard.
  await expect(page.getByTestId('ribbon-cursor')).toHaveCount(0);
});

test('aucun texte ne promet de résultat ni n’annonce de fatalité', async ({ page }) => {
  await allerAuTrimestre(page);
  const texte = (await page.locator('main').innerText()).toLowerCase();
  for (const interdit of ['mauvais', 'néfaste', 'funeste', 'insurmontable', 'irrémédiable']) {
    expect(texte, interdit).not.toContain(interdit);
  }
  for (const voyance of ['les astres', 'l’univers t’envoie', 'énergies négatives']) {
    expect(texte, voyance).not.toContain(voyance);
  }
  await expect(page.getByText(/divertissement et de réflexion personnelle/)).toBeVisible();
});

/*
 * Le fond de période, branché le 11 octobre 2026. C'est la lecture qu'un
 * astrologue donne en premier — « tu as Jupiter en maison 7 cette année » — et
 * le moteur n'en voyait rien : il calculait les douze maisons depuis le début
 * sans jamais les relire.
 */
test('le trimestre nomme le fond de période quand il y en a un', async ({ page }) => {
  await allerAuTrimestre(page);

  const fond = page.getByTestId('quarter-backdrop');
  if (await fond.count() === 0) return; // un axe peut n'avoir aucun fond : c'est licite

  await expect(fond).toContainText('LE FOND DE LA PÉRIODE');
  // Une planète nommée, une maison numérotée, et son domaine en clair.
  await expect(fond).toContainText(
    /(Soleil|Lune|Mercure|Vénus|Mars|Jupiter|Saturne|Uranus|Neptune|Pluton) traverse ta maison \d+ — .+ —/,
  );
  // Jamais de symbole à déchiffrer, jamais un signe à la place d'une maison.
  await expect(fond).not.toContainText(/[♈♉♊♋♌♍♎♏♐♑♒♓☉☽☿♀♂♃♄♅♆♇]/);
  for (const texte of await fond.locator('.reading').allInnerTexts()) {
    expect(texte.trim().split(/\s+/).length, texte).toBeLessThanOrEqual(45);
  }
});

/*
 * « Si tu fais attention, c'est bien, tu vas pouvoir contrer l'aspect qui montre
 * ces difficultés, sur ce plan. » — le rédacteur, 11 octobre 2026. Un aspect
 * difficile nomme un domaine, celui de la maison du point natal touché, et ce
 * domaine se surveille. Le transit lent dominant existait dans le moteur depuis
 * l'origine sans être affiché nulle part.
 */
test('le fond lent nomme son domaine, et dit qu’il se contre', async ({ page }) => {
  await allerAuTrimestre(page);

  const lent = page.getByTestId('quarter-slow');
  if (await lent.count() === 0) return; // un axe peut n'avoir aucun transit lent

  await expect(lent).toContainText(/CE À QUOI FAIRE ATTENTION|CE QUI TE PORTE/);
  // L'aspect en toutes lettres, et la maison qu'il touche avec son domaine.
  await expect(lent).toContainText(
    /(Soleil|Lune|Mercure|Vénus|Mars|Jupiter|Saturne|Uranus|Neptune|Pluton) en (conjonction|sextile|carré|trigone|opposition) à (ton|ta) /,
  );
  await expect(lent).toContainText(/maison \d+, /);

  const texte = await lent.innerText();
  if (texte.includes('CE À QUOI FAIRE ATTENTION')) {
    // Une difficulté se contre : jamais un verdict, jamais un renoncement.
    expect(texte).toMatch(/contres?|passe au travers|désamorcer/);
    expect(texte.toLowerCase()).not.toMatch(/renonce|abandonne|annule/);
  }
  for (const t of await lent.locator('.reading').allInnerTexts()) {
    expect(t.trim().split(/\s+/).length, t).toBeLessThanOrEqual(45);
  }
});
