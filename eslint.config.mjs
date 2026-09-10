import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // `next-env.d.ts` est généré par Next : on ne le corrige pas, on l'ignore.
    ignores: ['.next/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // Le moteur astro indexe des enregistrements typés par clé calculée ;
      // l'assertion non nulle y est le choix lisible.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];

export default config;
