export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function norm360(x: number): number {
  const y = x % 360;
  return y < 0 ? y + 360 : y;
}

/** Écart signé a − b ramené dans (−180, 180]. */
export function signedDelta(a: number, b: number): number {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
}

/** Séparation angulaire absolue, 0..180. */
export function separation(a: number, b: number): number {
  return Math.abs(signedDelta(a, b));
}

export const SIGNS = [
  'Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge',
  'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
] as const;

export function signOf(lon: number): number {
  return Math.floor(norm360(lon) / 30);
}

export function degInSign(lon: number): number {
  return norm360(lon) % 30;
}

/** Formatage astro d'une longitude : `23°14' Poissons`. */
export function formatLongitude(lon: number): string {
  const d = degInSign(lon);
  const deg = Math.floor(d);
  const min = Math.round((d - deg) * 60);
  const carry = min === 60;
  return `${carry ? deg + 1 : deg}°${String(carry ? 0 : min).padStart(2, '0')}' ${SIGNS[signOf(lon)]}`;
}

/** Formatage d'un orbe : `0°42'`. */
export function formatOrb(orb: number): string {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  const carry = min === 60;
  return `${carry ? deg + 1 : deg}°${String(carry ? 0 : min).padStart(2, '0')}'`;
}
