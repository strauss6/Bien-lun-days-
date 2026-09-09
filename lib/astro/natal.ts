import type { AngleId, NatalChart, NatalPoint, PlanetId, PointId, BirthInstant } from './types';
import { degInSign, norm360, signOf } from './angles';
import { angles, longitudeAndSpeed } from './ephemeris';

export const PLANETS: PlanetId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

export const ANGLE_IDS: AngleId[] = ['asc', 'mc', 'dsc', 'ic'];

export const POINT_LABELS: Record<PointId, string> = {
  sun: 'Soleil', moon: 'Lune', mercury: 'Mercure', venus: 'Vénus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturne', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluton',
  asc: 'Ascendant', mc: 'Milieu du Ciel', dsc: 'Descendant', ic: 'Fond du Ciel',
};

export const POINT_GLYPHS: Record<PointId, string> = {
  sun: '☉', moon: '☾', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  asc: 'ASC', mc: 'MC', dsc: 'DSC', ic: 'FC',
};

/** Maisons en signes entiers : la maison I est le signe entier de l'Ascendant. */
export function wholeSignHouse(lon: number, ascLon: number): number {
  return ((signOf(lon) - signOf(ascLon) + 12) % 12) + 1;
}

function point(id: PointId, lon: number, speed: number, ascLon: number): NatalPoint {
  return {
    id,
    lon: norm360(lon),
    sign: signOf(lon),
    degInSign: degInSign(lon),
    house: wholeSignHouse(lon, ascLon),
    speed,
    retrograde: speed < 0,
  };
}

export function computeNatalChart(birth: BirthInstant, lat: number, lng: number): NatalChart {
  const date = new Date(birth.utcMs);
  const { asc, mc } = angles(date, lat, lng);

  const points = {} as Record<PointId, NatalPoint>;
  for (const id of PLANETS) {
    const { lon, speed } = longitudeAndSpeed(id, date);
    points[id] = point(id, lon, speed, asc);
  }
  points.asc = point('asc', asc, 0, asc);
  points.mc = point('mc', mc, 0, asc);
  points.dsc = point('dsc', asc + 180, 0, asc);
  points.ic = point('ic', mc + 180, 0, asc);

  return {
    points,
    anglesReliable: birth.precision === 'exact',
    birth,
    lat,
    lng,
  };
}
