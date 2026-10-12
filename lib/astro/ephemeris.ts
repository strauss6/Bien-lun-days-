import * as A from 'astronomy-engine';
import type { PlanetId } from './types';
import { DEG, RAD, norm360, signedDelta } from './angles';

const BODIES: Record<PlanetId, A.Body> = {
  sun: A.Body.Sun,
  moon: A.Body.Moon,
  mercury: A.Body.Mercury,
  venus: A.Body.Venus,
  mars: A.Body.Mars,
  jupiter: A.Body.Jupiter,
  saturn: A.Body.Saturn,
  uranus: A.Body.Uranus,
  neptune: A.Body.Neptune,
  pluto: A.Body.Pluto,
};

export const PLANET_LABELS: Record<PlanetId, string> = {
  sun: 'Soleil', moon: 'Lune', mercury: 'Mercure', venus: 'Vénus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturne', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluton',
};

export const PLANET_GLYPHS: Record<PlanetId, string> = {
  sun: '☉', moon: '☾', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
};

/**
 * Longitude écliptique géocentrique apparente, référée à l'écliptique et à
 * l'équinoxe vrais de la date (ECT) — la convention de l'astrologie tropicale.
 */
export function longitudeOf(id: PlanetId, date: Date | A.AstroTime): number {
  if (id === 'moon') return norm360(A.EclipticGeoMoon(date).lon);
  const vec = A.GeoVector(BODIES[id], date, true);
  return norm360(A.Ecliptic(vec).elon);
}

/** Longitude et vitesse en degrés/jour (différence centrée sur ±6 h). */
export function longitudeAndSpeed(id: PlanetId, date: Date): { lon: number; speed: number } {
  const h = 0.25; // jour
  const t = A.MakeTime(date);
  const lon = longitudeOf(id, t);
  const before = longitudeOf(id, t.AddDays(-h));
  const after = longitudeOf(id, t.AddDays(h));
  return { lon, speed: signedDelta(after, before) / (2 * h) };
}

/**
 * Obliquité vraie de l'écliptique à cette date, en degrés.
 *
 * Dérivée de la matrice de rotation équateur-vrai → écliptique-vrai de la
 * bibliothèque plutôt que d'un polynôme : garantit la cohérence avec les
 * longitudes ci-dessus, nutation incluse.
 */
export function trueObliquity(date: Date | A.AstroTime): number {
  const t = A.MakeTime(date);
  const zAxis = new A.Vector(0, 0, 1, t);
  const v = A.RotateVector(A.Rotation_EQD_ECT(t), zAxis);
  // Le pôle céleste vu depuis l'écliptique est à (0, sin ε, cos ε).
  return Math.atan2(v.y, v.z) * RAD;
}

/** Temps sidéral apparent de Greenwich, en degrés. */
export function gastDegrees(date: Date | A.AstroTime): number {
  return norm360(A.SiderealTime(date) * 15);
}

/**
 * Ascendant et Milieu du Ciel, dérivés du temps sidéral local, de la latitude
 * et de l'obliquité.
 *
 * θ  = temps sidéral local (ascension droite du méridien)
 * MC  = atan2(sin θ, cos θ · cos ε)
 * ASC = atan2(cos θ, −(sin θ · cos ε + tan φ · sin ε))
 *
 * Vérifié par `__tests__/natal.test.ts` : l'Ascendant obtenu est bien le point
 * de l'écliptique d'altitude nulle sur l'horizon est, et le MC celui qui coupe
 * le méridien. Le test n'utilise aucune donnée externe — il rejoue la géométrie
 * avec les rotations d'astronomy-engine.
 */
export function angles(date: Date | A.AstroTime, lat: number, lng: number): { asc: number; mc: number; lst: number; obliquity: number } {
  const t = A.MakeTime(date);
  const lst = norm360(gastDegrees(t) + lng);
  const eps = trueObliquity(t);
  const th = lst * DEG;
  const e = eps * DEG;
  const phi = lat * DEG;

  const mc = norm360(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(e)) * RAD);
  const asc = norm360(
    Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * RAD,
  );

  return { asc, mc, lst, obliquity: eps };
}

/** Point de l'écliptique (latitude nulle) vu en coordonnées horizontales. Sert aux tests. */
export function eclipticPointHorizon(date: Date | A.AstroTime, lat: number, lng: number, lon: number) {
  const t = A.MakeTime(date);
  const vec = A.VectorFromSphere(new A.Spherical(0, lon, 1), t);
  const eqd = A.RotateVector(A.Rotation_ECT_EQD(t), vec);
  const eq = A.EquatorFromVector(eqd);
  const observer = new A.Observer(lat, lng, 0);
  // Aucune correction de réfraction : l'Ascendant est une définition géométrique.
  return A.Horizon(t, observer, eq.ra, eq.dec);
}

export { BODIES };
