import { expect, test, type Page } from '@playwright/test';
import { allerAuMois, premiereVisite } from './helpers/parcours';

/**
 * Passe d'accessibilité, mesurée.
 *
 * Trois exigences du brief, vérifiées au navigateur plutôt qu'affirmées :
 * une cible tactile d'au moins 44 px, un focus clavier visible, un ordre de
 * tabulation qui suit la lecture. Le contraste des teintes se vérifie sur les
 * jetons, en test unitaire — c'est là qu'il se décide.
 */

const MIN_TARGET = 44;

/** Tout ce qu'un doigt peut atteindre sur la page. */
const INTERACTIVE = 'a[href], button, summary, input, select, textarea, [tabindex="0"]';

async function ciblesTropPetites(page: Page) {
  return page.locator(INTERACTIVE).evaluateAll((els, min) => els
    .filter((el) => {
      // Une carte hors du champ du rail n'est pas une cible : `inert` la retire
      // du clavier comme du doigt.
      if (el.closest('[inert]')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < min || r.width < min);
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      const label = (el.getAttribute('aria-label') ?? el.textContent ?? el.tagName).trim();
      return `${label.slice(0, 40)} — ${Math.round(r.width)}×${Math.round(r.height)}`;
    }), MIN_TARGET);
}

async function allerAuxJours(page: Page) {
  await premiereVisite(page);
  await allerAuMois(page);
}

for (const chemin of ['/', '/quiz']) {
  test(`toutes les cibles tactiles font 44 px sur ${chemin}`, async ({ page }) => {
    await page.goto(chemin);
    expect(await ciblesTropPetites(page)).toEqual([]);
  });
}

test('toutes les cibles tactiles font 44 px sur la journée et le profil', async ({ page }) => {
  await premiereVisite(page);
  expect(await ciblesTropPetites(page)).toEqual([]);
  await page.getByRole('button', { name: /AMOUR/ }).click();
  expect(await ciblesTropPetites(page)).toEqual([]);
  await page.goto('/profil');
  expect(await ciblesTropPetites(page)).toEqual([]);
});

test('toutes les cibles tactiles font 44 px sur les trente jours', async ({ page }) => {
  await allerAuxJours(page);
  expect(await ciblesTropPetites(page)).toEqual([]);

  // Y compris une fois le détail déplié, et sur un autre jour que le premier.
  await page.getByTestId('day-track').evaluate((el) => el.scrollTo({ left: el.clientWidth * 4 }));
  await expect(page.getByTestId('day-track')).toHaveAttribute('data-day', '4');
  await page.getByText('Le détail').first().click();
  expect(await ciblesTropPetites(page)).toEqual([]);
});

test('toutes les cibles tactiles font 44 px sur les jours rares', async ({ page }) => {
  await allerAuxJours(page);
  await page.getByRole('button', { name: /Les jours rares/ }).click();
  await page.waitForURL('**/rares');
  expect(await ciblesTropPetites(page)).toEqual([]);
});

test('le clavier traverse les trente jours dans l’ordre de lecture', async ({ page }) => {
  await allerAuxJours(page);
  await page.locator('body').press('Tab');

  const ordre: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    ordre.push(await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '';
      return `${el.getAttribute('aria-label') ?? ''} ${(el.textContent ?? '').slice(0, 30)}`.trim();
    }));
    await page.keyboard.press('Tab');
  }

  // Le rail vient avant la carte, la carte avant les jours rares : c'est l'ordre
  // dans lequel l'écran se lit.
  const rail = ordre.findIndex((n) => n.includes('carte par jour'));
  const detail = ordre.findIndex((n) => n.includes('détail'));
  const rares = ordre.findIndex((n) => n.includes('jours rares'));
  expect(rail).toBeGreaterThanOrEqual(0);
  expect(detail).toBeGreaterThan(rail);
  expect(rares).toBeGreaterThan(detail);
});

test('le focus reste visible sur chaque élément atteignable', async ({ page }) => {
  await allerAuxJours(page);
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press('Tab');
    const contour = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return 'aucun';
      const s = getComputedStyle(el);
      return `${s.outlineStyle}:${parseFloat(s.outlineWidth)}`;
    });
    if (contour === 'aucun') continue;
    const [style, width] = contour.split(':');
    expect(style, 'un contour de focus, pas none').not.toBe('none');
    expect(Number(width)).toBeGreaterThanOrEqual(2);
  }
});
