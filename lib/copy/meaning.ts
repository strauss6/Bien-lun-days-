import type { AspectId, PlanetId, PointId } from '@/lib/astro/types';
import { ASPECT_BLOCKS, NATAL_BLOCKS, TRANSIT_BLOCKS } from './blocks';
import { PLANET_LABELS } from '@/lib/astro/ephemeris';
import { possessive } from '@/lib/astro/labels';
import { empreinte } from './phrase';

/**
 * Ce qu'un transit veut dire, composé à partir des briques.
 *
 * Trois briques, trois rôles, une phrase : **ce que la planète fait en passant**,
 * **ce que l'angle impose**, **ce que le point natal représente**. C'est toute la
 * mécanique du corpus, et c'est la première fois que le produit la met à
 * l'écran — jusqu'ici il nommait l'aspect sans jamais dire ce qu'il signifiait.
 *
 * Déterministe, sans appel au modèle : deux ouvertures du même transit donnent
 * exactement le même texte. La génération viendra en surcouche sur ce contrat,
 * quand le corpus aura ses briques directes et non dérivées.
 *
 * ## Pourquoi on ne prend pas toujours la première phrase de la brique
 *
 * La version précédente coupait chaque brique à sa première phrase. Sur l'écran
 * des jours rares, où Saturne touche trois points natals différents, cela donnait
 * « Saturne, c'est le temps, donc les obstacles et les retards » **trois fois**,
 * et « Le vent en poupe » sur chacun des deux trigones. Le reproche du 15 septembre
 * porte exactement là-dessus : « tout le temps la même chose, c'est lourd ».
 *
 * La variété ne s'invente pas : elle se prend dans la brique, qui en contient
 * deux ou trois phrases. On choisit laquelle de façon déterministe, à partir du
 * trio complet — même transit, même angle, même point natal donnent toujours la
 * même phrase, mais Saturne sur Jupiter et Saturne sur Vénus n'ouvrent pas pareil.
 */

/**
 * Découpe une brique en phrases.
 *
 * **Uniquement à la ponctuation forte.** Une première version coupait aussi au
 * tiret d'incise, pour éviter d'empiler trois tirets dans le gabarit ; elle
 * fabriquait des moitiés de phrase qui ne tiennent pas seules — « à toi de la
 * lever », « il montre où est la résistance », arrachées à leur proposition
 * principale. On coupe donc au point, et le tiret se retire de la phrase retenue.
 */
function phrases(texte: string): string[] {
  return texte
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim().replace(/\s—\s.*$/, '').trim().replace(/[.,:;]$/, ''))
    .filter((p) => p.split(/\s+/).length >= 4);
}

const AUTRES_PLANETES = Object.entries(PLANET_LABELS) as [PlanetId, string][];

/**
 * Une phrase de brique tient-elle seule, ici ?
 *
 * Les briques sont dictées d'une traite : leurs phrases s'enchaînent et se
 * répondent. Prise isolément, la deuxième ou la troisième trahit souvent ce
 * lien. Quatre cas, tous relevés en sortie réelle :
 *
 * - **Elle conditionne à une polarité.** « En bon aspect, on gagne ce qu'on
 *   engage », « bien touchée, l'intérieur suit » : faux sous l'angle inverse. La
 *   polarité est le travail de la brique d'angle, pas des deux autres.
 * - **Elle nomme une autre planète.** « C'est l'exact inverse de Saturne »
 *   éclaire quand on lit la brique d'Uranus en entier ; dans une carte qui parle
 *   d'Uranus sur ton Jupiter, ça fait entrer un troisième nom pour rien.
 * - **Elle reprend la phrase d'avant**, par le début — « Et l'endroit où tu en
 *   fais trop », « C'est aussi ce qui gouverne tes contrats » — ou par la fin :
 *   « Ce qu'on néglige aussi ». Dans les deux cas elle attend celle d'avant.
 * - **Elle porte déjà un deux-points.** Le gabarit en pose un ; deux dans la même
 *   phrase et plus personne ne sait ce qui explique quoi.
 */
const POLARITE = /\b(bons? aspects?|aspects? difficiles?|bien aspect|mal aspect|bien touch|touch\w+ durement)/i;
const LIAISON = /^(Et|Mais|Ou|Or|Donc|Car|Ni|Puis|Ensuite|Aussi|C'est aussi|C'est là|Ce qui vient|Là)\b/;
/*
 * Une phrase peut aussi reprendre la précédente **par la fin** : « Ce qu'on
 * entreprend prend de l'ampleur. Ce qu'on néglige aussi. » La seconde ne dit
 * rien seule, et le « aussi » final est tout ce qui trahit le lien.
 */
const REPRISE = /\b(aussi|également|non plus)\s*$/i;

function utilisables(phrasesBrique: string[], planete: PlanetId): string[] {
  const gardees = phrasesBrique.filter((p) => {
    if (POLARITE.test(p) || LIAISON.test(p) || REPRISE.test(p) || p.includes(':')) return false;
    return !AUTRES_PLANETES.some(([id, label]) => id !== planete && p.includes(label));
  });
  if (gardees.length > 0) return gardees;
  /*
   * Une brique dont tout serait écarté doit quand même dire quelque chose. On
   * retombe sur sa première phrase, en gardant le côté du deux-points qui porte
   * le sens : « Ton mental : ta façon de penser, de parler, de t'arranger » donne
   * « ta façon de penser, de parler, de t'arranger », pas « ton mental ». Deux
   * briques natales sur quatorze sont dans ce cas — Mercure et Uranus.
   */
  const premiere = phrasesBrique[0] ?? '';
  const cotes = premiere.split(/\s*:\s*/);
  return [cotes.reduce((a, b) => (b.split(/\s+/).length > a.split(/\s+/).length ? b : a), cotes[0])];
}

/**
 * Accroche le nom de la planète à la phrase, quelle que soit sa forme.
 *
 * Trois cas, parce que les briques sont écrites au fil de la parole :
 * « Il gère les tournants » → « Uranus gère les tournants » ;
 * « C'est le temps » → « Saturne, c'est le temps » ;
 * tout le reste → « Uranus : ce qui vient n'était pas au programme ».
 *
 * Sans ce dernier cas on écrivait « Pluton, il transforme », qui est du français
 * parlé, ou pire « Uranus, ce qui vient n'était pas au programme ».
 */
function attribuer(planete: PlanetId, phrase: string): string {
  const nom = PLANET_LABELS[planete];
  const pronom = /^(Il|Elle|Ils|Elles)\s+(.*)$/s.exec(phrase);
  if (pronom) return `${nom} ${pronom[2]}`;
  if (/^(C'est|Ce sont)\b/.test(phrase)) return `${nom}, ${minuscule(phrase)}`;
  return `${nom} : ${minuscule(phrase)}`;
}

const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Deux planètes sur dix portent un nom féminin ; « il touche » sonnerait faux. */
const FEMININES = new Set<PlanetId>(['moon', 'venus']);

/**
 * Le verbe qui relie la planète au point natal.
 *
 * Trois formes, choisies sur le même trio que le reste : sur une liste de six
 * cartes, « Il touche » six fois se remarque autant qu'une phrase répétée.
 */
const CONTACTS = ['touche', 'tombe sur', 'arrive sur'];

const choisir = <T,>(options: T[], cle: string): T => options[empreinte(cle) % options.length];

export function rareMeaning(transit: PlanetId, aspect: AspectId, natal: PointId): string {
  const t = TRANSIT_BLOCKS.find((b) => b.key === transit);
  const a = ASPECT_BLOCKS.find((b) => b.key === aspect);
  const n = NATAL_BLOCKS.find((b) => b.key === natal);
  if (!t || !a || !n) return '';

  /*
   * La clé est le trio, jamais la date : une même configuration doit donner le
   * même texte à chaque ouverture, hier comme dans six mois. C'est la règle de
   * stabilité des scores appliquée aux mots.
   */
  const cle = `${transit}|${aspect}|${natal}`;

  /*
   * L'ordre suit la lecture : la planète d'abord parce que c'est elle qui arrive,
   * le point natal ensuite parce que c'est lui qui est touché, l'angle en dernier
   * parce qu'il dit comment. Le lecteur reconnaît la planète avant de comprendre
   * l'angle, et une phrase qui commence par « un blocage » avant d'avoir nommé
   * quoi que ce soit se lit deux fois.
   */
  const planete = attribuer(transit, choisir(utilisables(phrases(t.draft), transit), `p:${cle}`));
  const pronom = FEMININES.has(transit) ? 'Elle' : 'Il';
  const contact = choisir(CONTACTS, `c:${cle}`);
  const point = minuscule(choisir(utilisables(phrases(n.draft), transit), `n:${cle}`));
  const angle = choisir(utilisables(phrases(a.draft), transit), `a:${cle}`);

  return `${planete}. ${pronom} ${contact} ${possessive(natal)} : ${point}. ${angle}.`;
}
