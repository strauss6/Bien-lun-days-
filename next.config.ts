import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Le moteur astro est du calcul pur : rien à transpiler côté client au-delà du défaut.
  experimental: {},
};

export default nextConfig;
