import tzlookup from 'tz-lookup';
import type { BirthInput, BirthInstant } from './types';
import { instantFromLocal, offsetSecondsAt, localPartsAt } from './zone';

/** Fuseau IANA d'un point du globe. Base embarquée, aucun appel réseau. */
export function zoneFor(lat: number, lng: number): string {
  return tzlookup(lat, lng);
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})$/;

/**
 * Heure locale de naissance → instant UTC, avec la règle de fuseau en vigueur
 * à cette date à cet endroit.
 *
 * Une heure d'erreur déplace l'Ascendant d'environ 15°. C'est la fonction la
 * plus sensible du produit ; elle est couverte par `__tests__/time.test.ts`.
 */
export function resolveBirthInstant(input: BirthInput): BirthInstant {
  const d = DATE_RE.exec(input.date);
  if (!d) throw new Error(`Date de naissance invalide : ${input.date}`);

  const known = input.time !== null && input.time !== '';
  let hour = 12;
  let minute = 0;
  if (known) {
    const t = TIME_RE.exec(input.time as string);
    if (!t) throw new Error(`Heure de naissance invalide : ${input.time}`);
    hour = Number(t[1]);
    minute = Number(t[2]);
    if (hour > 23 || minute > 59) throw new Error(`Heure de naissance invalide : ${input.time}`);
  }

  const zone = zoneFor(input.lat, input.lng);
  const wall = {
    year: Number(d[1]), month: Number(d[2]), day: Number(d[3]),
    hour, minute, second: 0,
  };
  const resolved = instantFromLocal(zone, wall);
  const effective = localPartsAt(zone, resolved.epochMs);

  return {
    utcMs: resolved.epochMs,
    utcISO: new Date(resolved.epochMs).toISOString(),
    zone,
    offsetSeconds: resolved.offsetSeconds,
    localTime: `${String(effective.hour).padStart(2, '0')}:${String(effective.minute).padStart(2, '0')}`,
    precision: known ? 'exact' : 'noon-fallback',
    anomaly: resolved.anomaly,
  };
}

/** Offset affiché : `UTC+1`, `UTC+5:30`, `UTC+0:09:21`. */
export function formatOffset(offsetSeconds: number): string {
  const sign = offsetSeconds < 0 ? '−' : '+';
  const abs = Math.abs(offsetSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (s) return `UTC${sign}${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  if (m) return `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
  return `UTC${sign}${h}`;
}

export { offsetSecondsAt };
