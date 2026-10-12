import type { AspectId, NatalChart, PlanetId, PointId } from './types';
import { findAspect } from './aspects';
import { polarity } from './scoring';
import { PLANETS } from './natal';

/**
 * La comparaison de deux thèmes.
 *
 * ## Le mécanisme
 *
 * C'est le même calcul que les transits, à une substitution près : au lieu de
 * confronter le thème à **la position du ciel un jour donné**, on le confronte à
 * **un autre thème**. Les aspects, les orbes et la polarité sont ceux du reste du
 * moteur — rien n'est réécrit ici, et c'est voulu : deux barèmes qui divergent
 * finiraient par se contredire à l'écran.
 *
 * Une différence de nature, en revanche, et elle simplifie tout : **il n'y a pas
 * de dimension temps**. Deux thèmes ne bougent pas l'un par rapport à l'autre. Pas
 * de fenêtre, pas d'étalonnage, pas de risque qu'un même lien change de valeur
 * selon l'écran. Le résultat est une photographie, pas une série.
 *
 * ## Ce qu'on regarde, d'après le rédacteur du corpus
 *
 * « Ce sont surtout les planètes d'un thème par rapport à l'autre. » Donc les dix
 * planètes de l'un vers les quatorze points de l'autre, **dans les deux sens** —
 * ce que A fait à B n'est pas ce que B fait à A, et c'est justement l'intérêt.
 *
 * **Être du même signe ne compte pas.** Il l'écarte explicitement. Aucune fonction
 * de ce fichier ne lit `sign` : c'est vérifié par un test, parce que c'est
 * exactement l'erreur que fait l'astrologie de magazine que le produit combat.
 *
 * ## Deux pièges de géométrie, réglés ici
 *
 * **Les axes se comptaient deux fois.** Le Descendant est exactement à l'opposé de
 * l'Ascendant : une conjonction à l'un est une opposition à l'autre, le même fait
 * physique. La première version rendait « ton Soleil en conjonction à son
 * Descendant » (porteur, +0,51) *et* « ton Soleil en opposition à son Ascendant »
 * (frottant, −0,71) — la même chose dans les deux colonnes, avec des verdicts
 * contraires. Un axe ne compte donc que par une extrémité, et une opposition à
 * l'Ascendant se dit « conjonction au Descendant » : c'est le point de l'autre,
 * donc la formulation juste dans une comparaison. Voir `QUESTIONS.md` Q17.
 *
 * **Le même contact se lisait deux fois.** Ton Vénus et son Vénus forment un seul
 * carré, pas deux. Plus insidieux : ton Soleil sur son Saturne et son Saturne sur
 * ton Soleil sont le même écart, mais la polarité suit la planète qui agit — l'un
 * ressortait positif, l'autre négatif. On ne garde donc qu'un lien par **paire de
 * points**, celui dont la force absolue est la plus grande. C'est aussi le bon sur
 * le fond : entre « ton Soleil éclaire son Saturne » et « son Saturne pèse sur ton
 * Soleil », c'est la planète la plus lourde qui mène, et le moteur la choisit seul.
 *
 * ## Ce qui n'est pas une fatalité
 *
 * Le rédacteur nomme « rédhibitoires » quelques configurations précises. Le moteur
 * les signale — ce serait malhonnête de les noyer — mais la règle du produit tient :
 * un aspect difficile montre **où** est la résistance, il ne condamne rien. Aucun
 * texte de cette fonctionnalité ne conseille de renoncer à quelqu'un. La sortie
 * dit ce qui demande de l'effort, et lequel.
 */

export const SYNASTRY_METHOD = 'croix-v1';

/**
 * Poids de la planète qui agit.
 *
 * Les luminaires et les personnelles d'abord : ce sont elles qui font le
 * quotidien d'une relation. Les lentes pèsent moins **en tant qu'actrices** parce
 * qu'elles sont partagées par toute une génération — deux personnes du même âge
 * ont le même Neptune, ce qui n'apprend rien sur elles deux.
 */
export const ACTOR_WEIGHT: Record<PlanetId, number> = {
  sun: 1.0, moon: 1.0, venus: 0.9, mars: 0.8, saturn: 0.8,
  jupiter: 0.7, mercury: 0.6, pluto: 0.5, uranus: 0.45, neptune: 0.4,
};

/**
 * Poids du point qui reçoit.
 *
 * Toucher le Soleil, la Lune ou l'Ascendant de quelqu'un, c'est le toucher lui ;
 * toucher son Neptune, c'est toucher sa génération.
 */
export const RECEIVER_WEIGHT: Record<PointId, number> = {
  sun: 1.0, moon: 1.0, asc: 0.9, venus: 0.85, mars: 0.7, dsc: 0.65, mc: 0.6,
  mercury: 0.55, jupiter: 0.5, saturn: 0.5, ic: 0.4,
  uranus: 0.25, neptune: 0.25, pluto: 0.25,
};

const HARD: ReadonlySet<AspectId> = new Set<AspectId>(['square', 'opposition']);

/**
 * Les deux axes du thème, nommés par une seule extrémité.
 *
 * L'Ascendant et le Milieu du Ciel portent l'axe ; le Descendant et le Fond du
 * Ciel sont leur reflet à 180°. On ne croise donc que les deux premiers, et une
 * opposition se renomme en conjonction à l'extrémité opposée — même orbe, même
 * fait, formulation qui parle.
 */
const AXIS_ENDS: PointId[] = ['asc', 'mc'];
const OPPOSITE_END: Partial<Record<PointId, PointId>> = { asc: 'dsc', mc: 'ic' };

/**
 * Les configurations que le rédacteur tient pour les plus dures, mot pour mot :
 * « le Saturne de l'un opposé au Pluton, au Saturne ou au Soleil de l'autre ;
 * Saturne, Pluton ou Uranus en aspect difficile au Soleil de l'autre. »
 *
 * Signalées, jamais transformées en verdict. Voir l'en-tête du fichier.
 */
const SATURN_OPPOSES: ReadonlySet<PointId> = new Set<PointId>(['pluto', 'saturn', 'sun']);
const HEAVY_ON_SUN: ReadonlySet<PlanetId> = new Set<PlanetId>(['saturn', 'pluto', 'uranus']);

export function isMajorTension(actor: PlanetId, aspect: AspectId, receiver: PointId): boolean {
  if (actor === 'saturn' && aspect === 'opposition' && SATURN_OPPOSES.has(receiver)) return true;
  return HEAVY_ON_SUN.has(actor) && HARD.has(aspect) && receiver === 'sun';
}

export type Direction = 'a-to-b' | 'b-to-a';

export interface SynastryLink {
  /** `a-to-b` : une planète de A touche un point de B. */
  direction: Direction;
  actor: PlanetId;
  receiver: PointId;
  aspect: AspectId;
  /** Écart à l'angle exact, en degrés. */
  orb: number;
  exactness: number;
  /** Signé : positif, le lien porte ; négatif, il frotte. */
  strength: number;
  majorTension: boolean;
  /**
   * Le même point des deux côtés — ton Mercure face à son Mercure.
   *
   * Personne n'agit sur personne : c'est une configuration mutuelle, et
   * `direction` n'y veut rien dire. Elle vaut `a-to-b` par convention, pour que
   * la sortie reste comparable, et l'interface doit écrire « vos deux Mercure »
   * plutôt que « ton Mercure sur son Mercure », qui décrit mal ce qui se passe.
   */
  mutual: boolean;
}

export interface Synastry {
  /** Tous les liens trouvés, du plus fort au plus faible en valeur absolue. */
  links: SynastryLink[];
  /** Les trois qui portent le plus. */
  supports: SynastryLink[];
  /** Les trois qui frottent le plus. */
  frictions: SynastryLink[];
  /** Celles que le rédacteur tient pour les plus dures, s'il y en a. */
  tensions: SynastryLink[];
  /**
   * `false` dès qu'une des deux heures de naissance manque : les angles sont
   * alors exclus des deux côtés, et l'interface doit le dire — une comparaison
   * amputée de l'Ascendant n'est pas la même comparaison.
   */
  anglesUsed: boolean;
  method: string;
}

const HOW_MANY = 3;

function crossOne(from: NatalChart, to: NatalChart, direction: Direction, receivers: PointId[]): SynastryLink[] {
  const out: SynastryLink[] = [];
  for (const actor of PLANETS) {
    const source = from.points[actor];
    for (const end of receivers) {
      const target = to.points[end];
      if (!source || !target) continue;
      /*
       * Le même point des deux côtés ne se lit pas dans un sens. On ne l'émet que
       * depuis A, une fois pour toutes : s'en remettre au dédoublonnage plus bas
       * marchait, mais la convention dépendait alors de la stabilité du tri —
       * c'est-à-dire de rien.
       */
      if (direction === 'b-to-a' && actor === end) continue;
      const hit = findAspect(source.lon, target.lon);
      if (!hit) continue;

      /*
       * Une opposition à une extrémité d'axe est une conjonction à l'autre. On la
       * dit du côté qui porte le sens — le Descendant, c'est l'autre personne.
       */
      const mirror = OPPOSITE_END[end];
      const receiver = mirror && hit.aspect === 'opposition' ? mirror : end;
      const aspect: AspectId = mirror && hit.aspect === 'opposition' ? 'conjunction' : hit.aspect;

      out.push({
        direction,
        actor,
        receiver,
        aspect,
        orb: hit.orb,
        exactness: hit.exactness,
        strength:
          ACTOR_WEIGHT[actor]
          * RECEIVER_WEIGHT[receiver]
          * polarity(actor, aspect)
          * hit.exactness,
        majorTension: isMajorTension(actor, aspect, receiver),
        mutual: actor === receiver,
      });
    }
  }
  return out;
}

/**
 * La paire de points sous-jacente, indépendante du sens de lecture.
 *
 * Deux liens qui partagent cette clé décrivent le même écart dans le ciel. Le
 * premier membre est toujours le point du thème A, le second celui du thème B.
 */
export function geometricPair(link: SynastryLink): string {
  return link.direction === 'a-to-b'
    ? `${link.actor}|${link.receiver}`
    : `${link.receiver}|${link.actor}`;
}

export function computeSynastry(a: NatalChart, b: NatalChart): Synastry {
  const anglesUsed = a.anglesReliable && b.anglesReliable;
  const receivers: PointId[] = anglesUsed ? [...PLANETS, ...AXIS_ENDS] : [...PLANETS];

  const tous = [...crossOne(a, b, 'a-to-b', receivers), ...crossOne(b, a, 'b-to-a', receivers)]
    .sort((x, y) => {
      const ecart = Math.abs(y.strength) - Math.abs(x.strength);
      if (ecart !== 0) return ecart;
      /*
       * Départage des ex æquo — et ils existent : ton Soleil sur sa Lune et sa
       * Lune sur ton Soleil pèsent exactement pareil.
       *
       * Il doit être **intrinsèque au lien**, jamais dépendant de qui est A. Un
       * premier jet départageait sur la clé de paire, qui se retourne quand on
       * échange les deux personnes : comparer Élioth à Marie ne donnait pas la
       * même chose que Marie à Élioth, pour un ciel identique. La planète la plus
       * lourde mène, puis l'ordre alphabétique — arbitraire, mais stable des deux
       * côtés, et c'est la seule propriété qui compte ici.
       */
      const poids = ACTOR_WEIGHT[y.actor] - ACTOR_WEIGHT[x.actor];
      if (poids !== 0) return poids;
      return x.actor.localeCompare(y.actor) || x.receiver.localeCompare(y.receiver);
    });

  // Un lien par paire de points : la liste triée place d'office le bon en tête.
  const vus = new Set<string>();
  const links: SynastryLink[] = [];
  for (const lien of tous) {
    const cle = geometricPair(lien);
    if (vus.has(cle)) continue;
    vus.add(cle);
    links.push(lien);
  }

  return {
    links,
    supports: links.filter((l) => l.strength > 0).slice(0, HOW_MANY),
    frictions: links.filter((l) => l.strength < 0).slice(0, HOW_MANY),
    /*
     * Les tensions majeures sont listées entières, pas coupées à trois : il y en
     * a rarement plus de deux, et en cacher une serait mentir par omission.
     */
    tensions: links.filter((l) => l.majorTension),
    anglesUsed,
    method: SYNASTRY_METHOD,
  };
}
