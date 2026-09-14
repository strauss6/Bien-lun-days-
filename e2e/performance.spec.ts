import { expect, test, type Page } from '@playwright/test';

/**
 * Le plus grand contenu affiché, mesuré.
 *
 * Le brief demande moins de 2 s. On mesure sur la construction de production,
 * avec l'API que le navigateur expose lui-même — pas une approximation par
 * `load`, qui attend des ressources que personne ne regarde.
 *
 * Le budget est volontairement tenu large ici : la machine d'intégration est
 * plus lente qu'un téléphone récent sur réseau ordinaire, et un seuil serré
 * rendrait le test capricieux au lieu de le rendre utile. Il attrape ce qu'il
 * doit attraper — une image non dimensionnée, une police bloquante, un écran
 * qui n'affiche rien avant sa première requête.
 */
const BUDGET_MS = 2000;

async function lcp(page: Page, chemin: string): Promise<number> {
  await page.goto(chemin, { waitUntil: 'load' });
  return page.evaluate(() => new Promise<number>((resolve) => {
    let dernier = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) dernier = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    // Le LCP n'est définitif qu'au premier geste ou à la fin du chargement :
    // on laisse une frame de battement, puis on lit la dernière valeur vue.
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(dernier)));
  }));
}

for (const chemin of ['/', '/quiz']) {
  test(`le plus grand contenu s'affiche en moins de 2 s sur ${chemin}`, async ({ page }) => {
    const mesure = await lcp(page, chemin);
    expect(mesure, `LCP ${Math.round(mesure)} ms`).toBeGreaterThan(0);
    expect(mesure, `LCP ${Math.round(mesure)} ms`).toBeLessThan(BUDGET_MS);
  });
}

test('aucune police téléchargée ne bloque le premier rendu', async ({ page }) => {
  await page.goto('/');

  /*
   * `next/font` déclare deux faces par famille : la police téléchargée, en
   * `swap`, et une face « Fallback » bâtie sur une police locale et corrigée aux
   * métriques de la vraie. La seconde sort en `display: auto` — et c'est juste :
   * elle ne traverse jamais le réseau, donc elle ne peut rien bloquer. C'est
   * elle qui affiche le texte pendant que l'autre arrive, et c'est ce qui évite
   * le décalage au moment de l'échange. Le test ne regarde donc que ce qui se
   * télécharge.
   */
  const polices = await page.evaluate(() => Array.from(document.fonts)
    .map((f) => ({ family: f.family, display: f.display })));

  // `next/font` découpe chaque famille en sous-ensembles Unicode : une famille,
  // plusieurs faces. On vérifie l'invariant, pas leur nombre.
  const telechargees = polices.filter((f) => !f.family.includes('Fallback'));
  expect(telechargees.length).toBeGreaterThan(0);
  expect(telechargees.filter((f) => f.display !== 'swap')).toEqual([]);

  // Et chaque famille a bien son repli local, sans quoi le texte n'apparaîtrait
  // qu'à l'arrivée de la police.
  for (const famille of ['Geist Mono Fallback', 'EB Garamond Fallback']) {
    expect(polices.some((f) => f.family === famille), famille).toBe(true);
  }
});
