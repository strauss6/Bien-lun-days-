/**
 * Résolution de fuseau à la seconde près.
 *
 * On n'utilise pas `luxon` ici : son champ `offset` est exprimé en minutes
 * entières, ce qui perd les 21 secondes de Paris Mean Time (`+00:09:21`,
 * en vigueur en France jusqu'au 11 mars 1911) et les autres offsets
 * historiques non ronds. `Intl.DateTimeFormat` avec `timeZoneName: 'longOffset'`
 * expose l'offset à la seconde. 21 secondes déplacent l'Ascendant de ~5',
 * c'est peu mais gratuit à conserver.
 */

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();
const partFormatters = new Map<string, Intl.DateTimeFormat>();

function offsetFormatter(zone: string): Intl.DateTimeFormat {
  let f = offsetFormatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' });
    offsetFormatters.set(zone, f);
  }
  return f;
}

function partFormatter(zone: string): Intl.DateTimeFormat {
  let f = partFormatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      era: 'short',
    });
    partFormatters.set(zone, f);
  }
  return f;
}

const OFFSET_RE = /^GMT(?:([+-])(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

/** Offset du fuseau à cet instant, en secondes (positif à l'est de Greenwich). */
export function offsetSecondsAt(zone: string, epochMs: number): number {
  const parts = offsetFormatter(zone).formatToParts(new Date(epochMs));
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = OFFSET_RE.exec(raw);
  if (!m) throw new Error(`Offset illisible pour ${zone} : ${raw}`);
  if (!m[1]) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const h = Number(m[2]);
  const mi = Number(m[3]);
  const s = m[4] ? Number(m[4]) : 0;
  return sign * (h * 3600 + mi * 60 + s);
}

/** Date et heure murales dans ce fuseau à cet instant. */
export function localPartsAt(zone: string, epochMs: number): LocalParts {
  const parts = partFormatter(zone).formatToParts(new Date(epochMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const bc = parts.find((p) => p.type === 'era')?.value === 'BC';
  const year = get('year');
  return {
    year: bc ? 1 - year : year,
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** Millisecondes époque en interprétant les composantes comme de l'UTC. Gère les années < 100. */
export function utcMillisFromParts(p: LocalParts): number {
  const d = new Date(Date.UTC(2000, p.month - 1, p.day, p.hour, p.minute, p.second, 0));
  d.setUTCFullYear(p.year);
  return d.getTime();
}

function sameWallClock(a: LocalParts, b: LocalParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
    && a.hour === b.hour && a.minute === b.minute;
}

export interface ResolvedLocal {
  epochMs: number;
  offsetSeconds: number;
  /**
   * `dst-gap` : l'heure murale demandée n'a pas existé (passage à l'heure d'été).
   * `dst-ambiguous` : elle a existé deux fois (retour à l'heure d'hiver) ; on retient
   * la première occurrence.
   */
  anomaly: null | 'dst-gap' | 'dst-ambiguous';
}

/**
 * Heure murale + fuseau → instant, en appliquant la règle en vigueur à cette date.
 *
 * Algorithme des offsets candidats : les offsets possibles autour de l'instant visé
 * sont ceux en vigueur la veille, le jour même et le lendemain. Pour chacun on
 * construit un instant et on vérifie qu'il retombe bien sur l'heure murale demandée.
 * Zéro candidat valide = trou de changement d'heure ; deux = heure ambiguë.
 */
export function instantFromLocal(zone: string, wall: LocalParts): ResolvedLocal {
  const asUTC = utcMillisFromParts(wall);
  const DAY = 86_400_000;
  const candidates = new Set([
    offsetSecondsAt(zone, asUTC - DAY),
    offsetSecondsAt(zone, asUTC),
    offsetSecondsAt(zone, asUTC + DAY),
  ]);

  const valid: ResolvedLocal[] = [];
  for (const offsetSeconds of candidates) {
    const epochMs = asUTC - offsetSeconds * 1000;
    if (sameWallClock(localPartsAt(zone, epochMs), wall)) {
      valid.push({ epochMs, offsetSeconds, anomaly: null });
    }
  }

  if (valid.length === 1) return valid[0];

  if (valid.length > 1) {
    valid.sort((a, b) => a.epochMs - b.epochMs);
    return { ...valid[0], anomaly: 'dst-ambiguous' };
  }

  // Trou : on applique l'offset d'avant la transition, ce qui décale l'instant
  // au-delà du trou — même convention que les bases de données de fuseaux.
  const offsetSeconds = offsetSecondsAt(zone, asUTC - DAY);
  return { epochMs: asUTC - offsetSeconds * 1000, offsetSeconds, anomaly: 'dst-gap' };
}

/** Composantes UTC d'un instant. */
function utcParts(epochMs: number): LocalParts {
  const d = new Date(epochMs);
  return {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds(),
  };
}

function toISODate(p: LocalParts): string {
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function parseISODate(dateISO: string): { year: number; month: number; day: number } {
  const m = /^(-?\d{4,})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) throw new Error(`Date invalide : ${dateISO}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Arithmétique de calendrier civil, insensible aux fuseaux (on pivote sur midi UTC). */
export function addCivilDays(dateISO: string, n: number): string {
  const { year, month, day } = parseISODate(dateISO);
  const t = utcMillisFromParts({ year, month, day, hour: 12, minute: 0, second: 0 }) + n * 86_400_000;
  return toISODate(utcParts(t));
}

/** Instant correspondant à midi local, ce jour-là, dans ce fuseau. */
export function localNoonInstant(zone: string, dateISO: string): number {
  const { year, month, day } = parseISODate(dateISO);
  return instantFromLocal(zone, { year, month, day, hour: 12, minute: 0, second: 0 }).epochMs;
}

/** Instant correspondant à une heure murale arbitraire ce jour-là. */
export function localHourInstant(zone: string, dateISO: string, hour: number): number {
  const { year, month, day } = parseISODate(dateISO);
  return instantFromLocal(zone, { year, month, day, hour, minute: 0, second: 0 }).epochMs;
}

/** Date locale `YYYY-MM-DD` à cet instant. */
export function localDateISO(zone: string, epochMs: number): string {
  return toISODate(localPartsAt(zone, epochMs));
}
