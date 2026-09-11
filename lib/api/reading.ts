import { z } from 'zod';
import type { AspectId, AxisId, PlanetId, PointId } from '@/lib/astro/types';
import { formatOffset, resolveBirthInstant } from '@/lib/astro/time';
import { computeNatalChart, POINT_LABELS } from '@/lib/astro/natal';
import { computeReading } from '@/lib/astro/scoring';
import { computeRareEvents, RARITY_LABELS } from '@/lib/astro/rarity';
import { AXIS_IDS, AXIS_LABELS } from '@/lib/astro/transits';
import { formatLongitude, formatOrb } from '@/lib/astro/angles';
import { ASPECT_PLAIN, notation, transitPhrase } from '@/lib/astro/labels';
import { ASPECTS } from '@/lib/astro/aspects';
import { buildPhrase, violatesContentRules } from '@/lib/copy/phrase';
import { continuityClause, continuityOf, type DayContinuity } from '@/lib/copy/continuity';
import { longitudeOf } from '@/lib/astro/ephemeris';
import { signOf } from '@/lib/astro/angles';
import { localNoonInstant } from '@/lib/astro/zone';

/** Date civile exacte : Date.parse normalise notamment le 31 février en mars. */
function isCivilDate(value: string): boolean {
  const time = Date.parse(`${value}T12:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('fr', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Contrat entre le formulaire et le calcul.
 *
 * Tout ce qui rendrait le thème faux est refusé ici, avec un message que
 * l'interface peut afficher tel quel. Une date au format français ou une heure
 * impossible ne doivent jamais atteindre le moteur.
 */
export const ReadingRequest = z.object({
  firstName: z.string().trim().min(1, 'Il me faut ton prénom.').max(40, 'Ce prénom est trop long.'),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit être au format AAAA-MM-JJ.')
    .refine(isCivilDate, 'Cette date n\'existe pas.')
    .refine((d) => d <= new Date().toISOString().slice(0, 10), 'Cette date est dans le futur.'),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'L\'heure doit être au format HH:MM.').nullable(),
  timeKnown: z.boolean(),
  lat: z.number().min(-90, 'Latitude hors du globe.').max(90, 'Latitude hors du globe.'),
  lng: z.number().min(-180, 'Longitude hors du globe.').max(180, 'Longitude hors du globe.'),
  city: z.string().trim().min(1, 'Il me faut ta ville de naissance.'),
  country: z.string().length(2, 'Code pays invalide.'),
  priorityAxis: z.enum(['business', 'love', 'energy'], {
    message: 'Choisis Business, Amour ou Énergie.',
  }),
  /** Premier jour de la fenêtre. Passé explicitement pour que le calcul reste déterministe. */
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de départ invalide.')
    .refine(isCivilDate, 'Cette date de départ n’existe pas.'),
  days: z.number().int().min(1).max(120).optional(),
  /** Fuseau de résidence : celui dans lequel « le jour » a un sens pour la personne. */
  zone: z.string().refine(isTimeZone, 'Ce fuseau horaire est inconnu.').optional(),
}).refine((v) => v.timeKnown === (v.birthTime !== null), {
  message: 'Coche « je ne connais pas mon heure » ou renseigne-la.',
  path: ['birthTime'],
});

export type ReadingInput = z.infer<typeof ReadingRequest>;

export interface ExplainingAspect {
  /** Notation technique : « ♃ △ ☉ ». Forme textuelle, pour l'accessibilité et les tests. */
  notation: string;
  /** Composants de l'aspect, typés : l'interface en tire des libellés sûrs. */
  transit: PlanetId;
  aspect: AspectId;
  natal: PointId;
  /** Libellé en clair : « Jupiter en trigone à ton Soleil ». */
  phrase: string;
  /** Traduction de l'aspect, pour son premier emploi dans l'écran. */
  plain: string;
  orb: string;
  /** Sens de la contribution. La valeur brute ne s'affiche jamais. */
  sign: '+' | '−';
}

export interface RarePayload {
  notation: string;
  phrase: string;
  natal: string;
  orb: string;
  exactDate: string | null;
  recurrence: string;
  previousDate: string | null;
  previousAge: number | null;
  nextYear: number | null;
  firstInLifetime: boolean;
}

/** Une journée du rapport, telle que l'interface la reçoit. */
export interface ReadingDay {
  date: string;
  season: string;
  axes: Record<AxisId, {
    score: number;
    explaining: ExplainingAspect[];
    /**
     * Signe où se trouve la planète qui porte le jour. C'est ce que le glyphe
     * posé sur un pic du ruban indique : **où est la planète**, jamais qui est
     * la personne.
     */
    peakSign: number | null;
    /** Phrase du jour, par gabarit déterministe, vérifiée en sortie. */
    phrase: string;
    /**
     * Où en est la journée dans son propre mouvement : ce qui commence, dure,
     * culmine ou se relâche, et l'écart avec la veille. Calculé au serveur pour
     * que l'interface n'ait rien à déduire — et pour que deux ouvertures du même
     * jour donnent exactement le même texte.
     */
    continuity: DayContinuity;
  }>;
}

export interface ReadingPayload {
  firstName: string;
  birth: {
    date: string;
    time: string;
    timeKnown: boolean;
    city: string;
    country: string;
    zone: string;
    precision: 'exact' | 'noon-fallback';
    anomaly: 'dst-gap' | 'dst-ambiguous' | null;
  };
  chart: { sun: string; moon: string; asc: string; mc: string; utcISO: string; offset: string };
  /** Méthode de score. Un rapport enregistré sous une autre méthode se recalcule. */
  method: string;
  axisOrder: AxisId[];
  axisLabels: Record<AxisId, string>;
  startDate: string;
  days: ReadingDay[];
  rare: RarePayload[];
  stats: { comparisonsTested: number; aspectEvents: number };
}

export function buildReading(input: ReadingInput): ReadingPayload {
  const birth = resolveBirthInstant({
    date: input.birthDate,
    time: input.timeKnown ? input.birthTime : null,
    lat: input.lat,
    lng: input.lng,
  });
  const chart = computeNatalChart(birth, input.lat, input.lng);
  const zone = input.zone ?? birth.zone;
  const reading = computeReading({ chart, zone, startDate: input.startDate, days: input.days });
  const rare = computeRareEvents({ chart, startDate: input.startDate, days: input.days });

  const days = reading.axes.business.days.map((_, i) => {
    const axes = {} as ReadingPayload['days'][number]['axes'];
    for (const axis of AXIS_IDS) {
      const d = reading.axes[axis].days[i];
      const top = d.explaining[0];
      const explaining = d.explaining.map((a) => ({
        phrase: transitPhrase(a.transit, a.aspect, a.natal),
        sign: a.contribution >= 0 ? '+' as const : '−' as const,
      }));
      const continuity = continuityOf(reading.axes[axis].days, i);
      const draft = buildPhrase(axis, explaining, continuityClause(continuity));
      // Vérification en sortie, comme l'exige le brief : rien ne sort sans être relu,
      // même un gabarit. Le repli est neutre et ne promet rien.
      const violation = violatesContentRules(axis, draft);
      axes[axis] = {
        score: Math.round(d.score),
        continuity,
        phrase: violation ? 'Journée sans aspect marquant sur cet axe.' : draft,
        peakSign: top
          ? signOf(longitudeOf(top.transit, new Date(localNoonInstant(zone, d.date))))
          : null,
        explaining: d.explaining.map((a) => ({
          notation: notation(a.transit, a.aspect, a.natal),
          transit: a.transit,
          aspect: a.aspect,
          natal: a.natal,
          phrase: transitPhrase(a.transit, a.aspect, a.natal),
          plain: ASPECT_PLAIN[a.aspect],
          orb: formatOrb(a.orb),
          sign: a.contribution >= 0 ? '+' as const : '−' as const,
        })),
      };
    }
    return { date: reading.axes.business.days[i].date, season: reading.seasons[i], axes };
  });

  return {
    firstName: input.firstName,
    birth: {
      date: input.birthDate,
      time: birth.localTime,
      timeKnown: input.timeKnown,
      city: input.city,
      country: input.country,
      zone: birth.zone,
      precision: birth.precision,
      anomaly: birth.anomaly,
    },
    chart: {
      sun: formatLongitude(chart.points.sun.lon),
      moon: formatLongitude(chart.points.moon.lon),
      asc: formatLongitude(chart.points.asc.lon),
      mc: formatLongitude(chart.points.mc.lon),
      utcISO: birth.utcISO,
      offset: formatOffset(birth.offsetSeconds),
    },
    // L'axe qui compte pour la personne passe devant : c'est à ça que sert la
    // cinquième question du quiz.
    method: reading.method,
    axisOrder: [input.priorityAxis, ...AXIS_IDS.filter((a) => a !== input.priorityAxis)],
    axisLabels: AXIS_LABELS,
    startDate: input.startDate,
    days,
    rare: rare.map((r) => ({
      notation: notation(r.transit, r.aspect, r.natal),
      phrase: transitPhrase(r.transit, r.aspect, r.natal),
      natal: POINT_LABELS[r.natal],
      orb: formatOrb(r.orbInWindow),
      exactDate: r.exactDate,
      recurrence: RARITY_LABELS[r.rarity],
      previousDate: r.previous?.date ?? null,
      previousAge: r.previous?.age ?? null,
      nextYear: r.next?.year ?? null,
      firstInLifetime: r.firstInLifetime,
    })),
    stats: {
      comparisonsTested: reading.stats.comparisonsTested,
      aspectEvents: reading.stats.aspectEvents,
    },
  };
}

export { ASPECTS };
