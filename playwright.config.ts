import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Certains environnements fournissent un Chromium préinstallé dont la révision
 * ne correspond pas exactement à celle attendue par la version de Playwright.
 * On pointe dessus quand il existe, on laisse Playwright décider sinon.
 */
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';
const launchOptions = existsSync(PREINSTALLED_CHROMIUM)
  ? { executablePath: PREINSTALLED_CHROMIUM }
  : {};

/**
 * Mobile d'abord : le seul projet est un téléphone, parce que 90 % du trafic
 * viendra de publicités sur mobile.
 *
 * Le gabarit est un Pixel 7 et non un iPhone : les descripteurs iOS de Playwright
 * demandent WebKit, qui n'est pas installé ici, alors que le rendu qu'on vérifie
 * — débordement horizontal, taille des cibles tactiles, tracés SVG — ne dépend
 * pas du moteur. Ne pas lancer `playwright install` dans cet environnement.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
