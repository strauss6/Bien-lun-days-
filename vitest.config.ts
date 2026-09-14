import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Même alias que `tsconfig.json`, pour que les tests importent comme l'application.
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['lib/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
