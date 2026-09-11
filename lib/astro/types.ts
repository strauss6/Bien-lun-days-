export type PlanetId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

/** Points dérivés du temps sidéral local : axes du thème. */
export type AngleId = 'asc' | 'mc' | 'dsc' | 'ic';

export type PointId = PlanetId | AngleId;

export type AxisId = 'business' | 'love' | 'energy';

export type AspectId = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** Précision du thème : dépend de la connaissance de l'heure de naissance. */
export type Precision = 'exact' | 'noon-fallback';

/** Anomalie de fuseau rencontrée à la conversion heure locale → UTC. */
export type ZoneAnomaly = null | 'dst-gap' | 'dst-ambiguous';

export interface BirthInput {
  /** Date locale de naissance, `YYYY-MM-DD`. */
  date: string;
  /** Heure locale `HH:mm`, ou `null` si inconnue (repli sur midi). */
  time: string | null;
  lat: number;
  lng: number;
}

export interface BirthInstant {
  /** Instant UTC de la naissance. */
  utcMs: number;
  utcISO: string;
  /** Zone IANA déduite des coordonnées. */
  zone: string;
  /** Offset appliqué, en secondes — les fuseaux d'avant 1911 ne sont pas des minutes entières. */
  offsetSeconds: number;
  /** Heure locale effectivement retenue, `HH:mm` (peut différer de l'entrée en cas de `dst-gap`). */
  localTime: string;
  precision: Precision;
  anomaly: ZoneAnomaly;
}

export interface NatalPoint {
  id: PointId;
  /** Longitude écliptique tropicale apparente, degrés [0,360). */
  lon: number;
  /** Index de signe, 0 = Bélier. */
  sign: number;
  /** Degrés dans le signe, [0,30). */
  degInSign: number;
  /** Maison en signes entiers, 1..12. */
  house: number;
  /** Vitesse en degrés/jour. Nulle pour les axes. */
  speed: number;
  retrograde: boolean;
}

export interface NatalChart {
  points: Record<PointId, NatalPoint>;
  /** `false` quand l'heure est inconnue : l'Ascendant n'est alors pas exploitable. */
  anglesReliable: boolean;
  birth: BirthInstant;
  lat: number;
  lng: number;
}

export interface AspectHit {
  aspect: AspectId;
  /** Écart à l'angle exact, en degrés. */
  orb: number;
  /** Poids de proximité à l'exact, (0,1]. */
  exactness: number;
}

export interface GridCell extends AspectHit {
  retrograde: boolean;
  /** `true` le jour où l'orbe est un minimum local : le jour de l'exact. */
  peaking: boolean;
}

export interface DayAspect extends GridCell {
  transit: PlanetId;
  natal: PointId;
  /** Contribution signée de cet aspect au score du jour, pour cet axe. */
  contribution: number;
}

export interface AxisDay {
  /** Index du jour, 0 = aujourd'hui. */
  day: number;
  /** Date du jour en local, `YYYY-MM-DD`. */
  date: string;
  /** Score normalisé sur la distribution propre de la personne, 3..97. */
  score: number;
  /** Score brut, pour le debug et les tests. */
  raw: number;
  /**
   * Score de sélection des dates : même calcul, contribution lunaire divisée
   * par quatre. La Lune donne au ruban son grain quotidien, mais elle repasse
   * sur chaque point natal tous les mois — elle ne doit pas décider des cinq
   * dates du rapport.
   */
  significance: number;
  /** Aspects du jour, du plus contributif au moins contributif en valeur absolue. */
  aspects: DayAspect[];
  /**
   * Les deux aspects qui expliquent le score, quel qu'il soit.
   *
   * Ce sont les deux plus fortes contributions **en valeur absolue**, et non les
   * deux plus favorables : un jour à 12 sur 100 doit afficher les deux aspects
   * durs qui l'ont fait tomber si bas, pas les deux moins mauvais.
   */
  explaining: DayAspect[];
}

export interface AxisReading {
  axis: AxisId;
  days: AxisDay[];
  /** 5 meilleurs jours, espacés d'au moins 3 jours. */
  best: number[];
  /** 3 jours à éviter, espacés d'au moins 3 jours. */
  worst: number[];
  /** Transit lent dominant sur la fenêtre — absorbé par la normalisation, restitué ici. */
  backdrop: DayAspect | null;
}

export interface LunarDay {
  day: number;
  date: string;
  /** Score de la Lune seule, sur l'échelle 3–97 du thème. */
  score: number;
  /** Tous les contacts de la Lune ce jour-là, du plus fort au plus faible. */
  aspects: DayAspect[];
}

export interface Reading {
  chart: NatalChart;
  /** Premier jour de la fenêtre, `YYYY-MM-DD` local. */
  startDate: string;
  days: number;
  zone: string;
  /**
   * Méthode de score employée. Un résultat enregistré avec une autre méthode se
   * recalcule au lieu de se mélanger silencieusement à ceux de la méthode
   * courante. Voir `calibration.ts`.
   */
  method: string;
  axes: Record<AxisId, AxisReading>;
  /**
   * La journée elle-même, portée par la Lune.
   *
   * `lunar` est le score de la seule Lune sur l'ensemble du thème ; `overall`
   * est le score global affiché, où la Lune compte pour trois quarts et la
   * moyenne des trois axes pour un quart. Voir `lunar.ts`.
   */
  lunar: LunarDay[];
  overall: number[];
  /** Saison traversée par chaque jour — teinte du ruban. */
  seasons: Season[];
  stats: {
    comparisonsTested: number;
    aspectDays: number;
    aspectEvents: number;
  };
}
