import { z } from 'zod';
import type { AspectId, AxisId, PlanetId, PointId } from '@/lib/astro/types';
import { formatOffset, resolveBirthInstant } from '@/lib/astro/time';
import { computeNatalChart, POINT_LABELS } from '@/lib/astro/natal';
import { HOUSE_TOPICS } from '@/lib/astro/rulers';
import { vigilanceFor } from '@/lib/copy/vigilance';
import { computeReading } from '@/lib/astro/scoring';
import { computeRareEvents, RARITY_LABELS } from '@/lib/astro/rarity';
import { AXIS_IDS, AXIS_LABELS, QUARTER_DAYS } from '@/lib/astro/transits';
import { formatLongitude, formatOrb } from '@/lib/astro/angles';
import { ASPECT_PLAIN, notation, transitPhrase } from '@/lib/astro/labels';
import { ASPECTS } from '@/lib/astro/aspects';
import { buildPhrase, violatesContentRules, wordCount } from '@/lib/copy/phrase';
import { rareMeaning } from '@/lib/copy/meaning';
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
  /**
   * **Obligatoire depuis le 11 octobre 2026.** C'est la décision produit, et elle
   * se tient ici plutôt que dans le questionnaire : un contrat qui accepte encore
   * l'absence d'heure finit par la recevoir, par un brouillon enregistré avant la
   * règle, par un appel direct à l'API, ou par un écran qu'on oubliera de changer.
   *
   * Mesuré sur un thème réel, sans l'heure : l'Ascendant passe du Verseau à la
   * Balance, le Milieu du Ciel du Scorpion au Cancer, les axes bougent de 9 points
   * en moyenne et jusqu'à 49, et les jours rares tombent de 18 à 8. Ce n'est pas
   * une version dégradée du produit, c'en est un autre — et c'est l'inverse de ce
   * qu'il vend : « calculé pour l'heure et la ville exactes de ta naissance ».
   */
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Il me faut ton heure de naissance, au format HH:MM.'),
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
  nextAge: number | null;
  firstInLifetime: boolean;
  /**
   * Quand l'aspect entre dans son orbe et quand il en sort, et le jour où il est
   * au plus près de l'exact. Remplace « actif sur toute la période », qui ne
   * disait rien à personne : ce que la personne veut savoir, c'est quand ça
   * commence et quand ça finit.
   */
  span: {
    start: string;
    end: string;
    days: number;
    peak: string;
    /** Orbe au point culminant : certains passages n'atteignent jamais l'exact. */
    peakOrb: string;
    /** Le balayage s'est arrêté avant la vraie borne — on ne l'annonce pas comme une date. */
    openStart: boolean;
    openEnd: boolean;
  } | null;
  /**
   * Ce que ce transit veut dire, composé à partir des briques du corpus : ce que
   * la planète fait en passant, ce que l'angle impose, ce que le point natal
   * représente. Déterministe, sans appel au modèle.
   */
  meaning: string;
}

/** Le jour lui-même, porté par la Lune. Voir `lib/astro/lunar.ts`. */
export interface OverallDay {
  /** Score global affiché : trois quarts Lune, un quart la moyenne des axes. */
  score: number;
  /** Score de la Lune seule, pour qui veut savoir d'où vient le global. */
  lunar: number;
  /**
   * Le contact lunaire le plus fort du jour, en toutes lettres — « Lune en
   * trigone à ton Soleil ». `null` les jours où la Lune ne touche rien du thème,
   * et l'interface le dit franchement au lieu d'inventer.
   */
  contact: string | null;
  /** Nombre de points du thème que la Lune touche ce jour-là. */
  contacts: number;
}

/** Une journée du rapport, telle que l'interface la reçoit. */
export interface ReadingDay {
  date: string;
  season: string;
  /** Le score global du jour et ce qui le porte. */
  overall: OverallDay;
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

/**
 * Une fenêtre du trimestre, datée.
 *
 * L'interface reçoit des dates, pas des index : elle n'a rien à recalculer, et
 * deux écrans qui déduiraient chacun de leur côté finiraient par diverger.
 */
export interface PeriodPayload {
  axis: AxisId;
  start: string;
  end: string;
  days: number;
  /** Au-dessus de la ligne neutre de la personne — jamais de la fenêtre affichée. */
  favourable: boolean;
  average: number;
  peakDate: string;
  peakScore: number;
  /** La fenêtre butait sur un bord du calcul : on ne l'annonce pas comme une date. */
  openStart: boolean;
  openEnd: boolean;
}

/**
 * Un fond de période : une planète lente qui traverse une maison de l'axe.
 *
 * Volontairement **hors du score** — un fond constant sur des mois ne distingue
 * aucun jour et se fait réabsorber par l'étalonnage. Il se dit en toutes lettres,
 * parce que c'est la première chose qu'un astrologue regarde : « tu as Jupiter en
 * maison 7 cette année ». Voir `lib/astro/houses.ts`.
 */
export interface HouseBackdropPayload {
  axis: AxisId;
  /** « Jupiter ». */
  planet: string;
  house: number;
  /** Ce que la maison gouverne, en clair. */
  topic: string;
  start: string;
  end: string;
  /** La traversée déborde la fenêtre calculée : on ne l'annonce pas comme une date. */
  openStart: boolean;
  openEnd: boolean;
}

/**
 * Le transit lent qui domine la période, et ce qu'il demande de surveiller.
 *
 * `AxisReading.backdrop` existait depuis l'origine et n'était affiché nulle part.
 * Il porte pourtant la lecture que le rédacteur donne en premier d'un aspect
 * difficile et durable : le domaine vient de la maison où loge le point natal
 * touché, et la difficulté **se contre** — « si tu fais attention, c'est bien, tu
 * vas pouvoir contrer l'aspect qui montre ces difficultés, sur ce plan ».
 */
export interface SlowBackdropPayload {
  axis: AxisId;
  /** « Saturne en opposition à ton Jupiter ». */
  phrase: string;
  /** Maison du point natal touché, et ce qu'elle gouverne. */
  house: number;
  topic: string;
  /** `true` quand l'aspect pèse contre : seule une difficulté demande une vigilance. */
  hard: boolean;
  /** Le geste concret, ou `null` si l'aspect porte. */
  watch: string | null;
}

export interface ReadingPayload {
  firstName: string;
  birth: {
    date: string;
    time: string;
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
  /** Les fenêtres des trois axes, triées par date. Voir `PeriodPayload`. */
  periods: PeriodPayload[];
  /** Les fonds de période, du plus lourd au plus léger. Voir `HouseBackdropPayload`. */
  houseBackdrops: HouseBackdropPayload[];
  /** Le transit lent dominant de chaque axe, et sa vigilance. Voir `SlowBackdropPayload`. */
  slowBackdrops: SlowBackdropPayload[];
  rare: RarePayload[];
  stats: { comparisonsTested: number; aspectEvents: number };
}

/**
 * Le corps d'une demande de rapport, pour tous les appelants.
 *
 * Il y en a trois — l'écran de calcul du questionnaire, le crochet qui recalcule
 * au changement de jour, et la page autonome — et ils demandaient la fenêtre
 * chacun de leur côté. Le jour où le produit est passé au trimestre, deux l'ont
 * suivi et un non : le rapport enregistré après le questionnaire faisait trente
 * jours, et l'écran du trimestre en affichait trente. Un seul point de décision
 * désormais.
 */
export function readingBody(
  profile: Record<string, unknown>,
  startDate: string,
  zone: string,
): Record<string, unknown> {
  return { ...profile, startDate, zone, days: QUARTER_DAYS };
}

export function buildReading(input: ReadingInput): ReadingPayload {
  const birth = resolveBirthInstant({
    date: input.birthDate,
    time: input.birthTime,
    lat: input.lat,
    lng: input.lng,
  });
  const chart = computeNatalChart(birth, input.lat, input.lng);
  const zone = input.zone ?? birth.zone;
  const reading = computeReading({ chart, zone, startDate: input.startDate, days: input.days });
  const rare = computeRareEvents({ chart, startDate: input.startDate, days: input.days });

  const days = reading.axes.business.days.map((_, i) => {
    const axes = {} as ReadingPayload['days'][number]['axes'];
    const lune = reading.lunar[i];
    const contact = lune.aspects[0] ?? null;
    for (const axis of AXIS_IDS) {
      const d = reading.axes[axis].days[i];
      const top = d.explaining[0];
      const explaining = d.explaining.map((a) => ({
        phrase: transitPhrase(a.transit, a.aspect, a.natal),
        sign: a.contribution >= 0 ? '+' as const : '−' as const,
      }));
      const continuity = continuityOf(reading.axes[axis].days, i);
      /*
       * La traduction de l'aspect s'affiche dans le même bloc que la phrase, donc
       * elle mange le même budget de quarante-cinq mots. On la réserve ici plutôt
       * que de laisser chacun compter de son côté — l'écran est passé à
       * quarante-six mots le jour où le rédacteur a livré des traductions plus
       * longues, sans qu'aucun des deux soit fautif.
       */
      const reserve = top ? wordCount(ASPECT_PLAIN[top.aspect]) + 2 : 0;
      const draft = buildPhrase(axis, explaining, continuityClause(continuity), reserve);
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
    return {
      overall: {
        score: reading.overall[i],
        lunar: Math.round(lune.score),
        contact: contact ? transitPhrase(contact.transit, contact.aspect, contact.natal) : null,
        contacts: lune.aspects.length,
      },
      date: reading.axes.business.days[i].date,
      season: reading.seasons[i],
      axes,
    };
  });

  return {
    firstName: input.firstName,
    birth: {
      date: input.birthDate,
      time: birth.localTime,
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
    /*
     * Les fenêtres des trois axes, à plat et triées par date. Le trimestre les
     * filtre par axe ; la vue du mois ne s'en sert pas — une fenêtre de sept
     * jours ne veut rien dire quand on en regarde trente.
     */
    periods: AXIS_IDS.flatMap((axis) => reading.axes[axis].periods.map((f) => ({
      axis,
      start: reading.axes[axis].days[f.from].date,
      end: reading.axes[axis].days[f.to].date,
      days: f.days,
      favourable: f.favourable,
      average: f.average,
      peakDate: reading.axes[axis].days[f.peak].date,
      peakScore: f.peakScore,
      openStart: f.openStart,
      openEnd: f.openEnd,
    }))).sort((a, b) => a.start.localeCompare(b.start)),
    slowBackdrops: AXIS_IDS.flatMap((axis) => {
      const b = reading.axes[axis].backdrop;
      if (!b) return [];
      const house = chart.points[b.natal].house;
      const hard = b.contribution < 0;
      return [{
        axis,
        phrase: transitPhrase(b.transit, b.aspect, b.natal),
        house,
        topic: HOUSE_TOPICS[house] ?? '',
        hard,
        /* Seule une difficulté demande une vigilance : un bon aspect, lui, demande d'agir. */
        watch: hard ? vigilanceFor(b.natal, house) : null,
      }];
    }),
    houseBackdrops: AXIS_IDS.flatMap((axis) => reading.axes[axis].houseTransits.map((t) => ({
      axis,
      planet: POINT_LABELS[t.planet],
      house: t.house,
      topic: t.topic,
      start: reading.axes[axis].days[t.from].date,
      end: reading.axes[axis].days[t.to].date,
      openStart: t.openStart,
      openEnd: t.openEnd,
    }))),
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
      nextAge: r.next?.age ?? null,
      firstInLifetime: r.firstInLifetime,
      span: r.span && {
        start: r.span.start,
        end: r.span.end,
        days: r.span.days,
        peak: r.span.peak,
        peakOrb: formatOrb(r.span.peakOrb),
        openStart: r.span.openStart,
        openEnd: r.span.openEnd,
      },
      meaning: rareMeaning(r.transit, r.aspect, r.natal),
    })),
    stats: {
      comparisonsTested: reading.stats.comparisonsTested,
      aspectEvents: reading.stats.aspectEvents,
    },
  };
}

export { ASPECTS };
