import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Le moteur astro est du calcul pur : rien à transpiler côté client au-delà du défaut.
  experimental: {},
  /*
   * La route de l'image de partage lit sa police sur le disque. Next trace les
   * fichiers dont il voit l'import ; un chemin construit à l'exécution lui
   * échappe, et la police manquerait à la première requête en production — une
   * panne qui ne se voit qu'après déploiement. On la déclare donc explicitement.
   */
  outputFileTracingIncludes: {
    '/api/partage': ['./assets/fonts/**'],
  },
};

export default nextConfig;
