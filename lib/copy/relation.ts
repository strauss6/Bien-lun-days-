import type { PlanetId, PointId } from '@/lib/astro/types';
import type { SynastryLink } from '@/lib/astro/synastry';
import { PLANET_LABELS } from '@/lib/astro/ephemeris';
import { POINT_LABELS } from '@/lib/astro/natal';
import { ASPECTS } from '@/lib/astro/aspects';
import { aDefinite, definite, possessive } from '@/lib/astro/labels';
import type { BlockSource } from './blocks';
import { empreinte } from './phrase';

/**
 * Les briques de la comparaison de deux thèmes.
 *
 * ## Pourquoi elles ne peuvent pas être celles des transits
 *
 * Le corpus existant répond à « que fait cette planète **quand elle passe** ».
 * Ici la question est autre : « que fait cette planète **d'une personne sur une
 * autre** ». Même géométrie, autre sens, et la différence n'est pas un détail —
 * Saturne qui transite ton Soleil, c'est une saison difficile, et elle finit ;
 * le Saturne de quelqu'un sur ton Soleil, c'est permanent, et c'est cette
 * personne qui te structure et qui t'enferme. Réutiliser les briques de transit
 * aurait donné des textes qui sonnent juste et qui disent faux.
 *
 * ## Trois voix, et pourquoi il en faut trois
 *
 * Une première version n'en avait qu'une, celle où c'est toi qui agis, et
 * retournait le reste par une phrase passe-partout. Résultat : « le Pluton de
 * Marie en trigone à ta Lune » donnait « ça vient chercher la sensibilité de
 * Marie » — alors que la sensibilité touchée est la tienne. Le texte décrivait la
 * mauvaise personne, et deux liens sur trois en sortaient faux.
 *
 * Chaque planète est donc écrite trois fois : `yours` quand ta planète touche un
 * point de l'autre, `theirs` quand c'est l'inverse, `both` quand c'est le même
 * point des deux côtés et que personne n'agit. **Le conseil, lui, s'adresse
 * toujours à toi** dans les trois cas : tu es la seule personne dont tu peux
 * changer le comportement.
 *
 * ## Provenance — à lire avant de s'y fier
 *
 * **Aucune de ces briques n'est `direct`.** Le rédacteur n'a pas été interrogé sur
 * la relation planète par planète : il a donné la grille — ce qui est dur, ce qui
 * est surmontable, ce qui ne compte pas — et un exemple travaillé, celui de
 * Saturne : « on peut se comporter de façon trop rigide et trop enfermante, donc
 * faire des efforts et laisser de l'espace à l'autre ». Cette brique-là est
 * `dérivé`. Les neuf autres suivent le même gabarit depuis ses mots-clés de
 * planète, et sont `inféré`. Même honnêteté de provenance que `blocks.ts`, et
 * pour la même raison : un gabarit qui se fait passer pour de la parole d'auteur
 * finit corrigé une fois de trop, ou pas du tout.
 *
 * ## Deux règles de contenu, vérifiées par des tests
 *
 * **Rien n'est une fatalité.** Aucune de ces phrases ne conseille de renoncer à
 * quelqu'un, et aucune n'annonce ce qui va arriver. Un lien difficile dit où est
 * la résistance et quel effort elle demande.
 *
 * **On ne présume du genre de personne.** Ni celui du lecteur, ni celui de
 * l'autre : on ne les demande pas, donc on ne les écrit pas. **Aucun pronom de
 * troisième personne en sortie**, pas même pour un objet — « les moments calmes :
 * ils tombent juste » est correct, mais une règle qui souffre des exceptions ne
 * se vérifie plus. Aucun participe ou adjectif qui s'accorderait non plus :
 * « seul », « connu », « prêt » sont interdits. Le tout est testé.
 */

export interface RelationVoice {
  /** Ce qui se passe quand l'angle porte. */
  carries: string;
  /** Ce qui se passe quand l'angle frotte. */
  rubs: string;
}

export interface RelationGestures {
  /** Le geste concret sous un angle porteur. */
  doThis: string;
  /** Le geste concret sous un angle dur. Jamais « renoncer ». */
  avoidThis: string;
}

export interface RelationBrick {
  key: PlanetId;
  /** Ta planète touche un point de l'autre. */
  yours: RelationVoice & RelationGestures;
  /** La planète de l'autre touche un de tes points. */
  theirs: RelationVoice & RelationGestures;
  /** Le même point des deux côtés : personne n'agit. Les gestes sont ceux de `yours`. */
  both: RelationVoice;
  source: BlockSource;
}

/** `{nom}` est remplacé par le prénom de la seconde personne. */
export const RELATION_BLOCKS: RelationBrick[] = [
  {
    key: 'sun',
    yours: {
      carries: 'tu donnes de l’assurance à {nom}',
      rubs: 'tu prends toute la lumière',
      doThis: 'Mets {nom} en avant devant les autres : c’est là que ça compte.',
      avoidThis: 'Évite de ramener à toi ce que {nom} vient de raconter.',
    },
    theirs: {
      carries: '{nom} te donne de l’assurance',
      rubs: '{nom} prend toute la place sans le voir',
      doThis: 'Accepte l’élan que {nom} te donne au lieu de le relativiser.',
      avoidThis: 'Évite de t’effacer : dis-le quand tu n’as pas eu ton tour.',
    },
    both: {
      carries: 'vous tirez tous les deux dans le même sens',
      rubs: 'vous voulez la même place au même moment',
    },
    source: 'inféré',
  },
  {
    key: 'moon',
    yours: {
      carries: 'tu mets {nom} à l’aise sans rien forcer',
      rubs: 'tes humeurs arrivent chez {nom} sans filtre',
      doThis: 'C’est à toi de proposer les moments calmes : tu sais quand.',
      avoidThis: 'Évite de décider quoi que ce soit un jour où tu es à cran.',
    },
    theirs: {
      carries: '{nom} te met à l’aise sans rien forcer',
      rubs: 'les humeurs de {nom} te touchent plus que tu ne l’admets',
      doThis: 'Laisse {nom} donner le rythme des moments calmes.',
      avoidThis: 'Évite de prendre pour toi ce qui n’était qu’une journée difficile.',
    },
    both: {
      carries: 'vous ressentez les choses au même moment',
      rubs: 'vos journées difficiles tombent ensemble',
    },
    source: 'inféré',
  },
  {
    key: 'mercury',
    yours: {
      carries: 'tu te fais comprendre de {nom} en trois mots',
      rubs: 'tu expliques à côté de ce que {nom} demande',
      doThis: 'Les choses difficiles, dis-les à {nom} directement : ça passe.',
      avoidThis: 'Évite de régler un désaccord par message.',
    },
    theirs: {
      carries: '{nom} met des mots sur ce que tu penses',
      rubs: '{nom} parle à côté de ce que tu attendais',
      doThis: 'Demande à {nom} de reformuler : c’est là que ça devient clair.',
      avoidThis: 'Évite de faire semblant d’avoir compris pour clore le sujet.',
    },
    both: {
      carries: 'vous suivez la même logique',
      rubs: 'vous vous parlez à côté l’un de l’autre',
    },
    source: 'inféré',
  },
  {
    key: 'venus',
    yours: {
      carries: 'tu rends les choses agréables à {nom}',
      rubs: 'tu attends de {nom} un accord qui ne vient pas',
      doThis: 'Les moments partagés valent plus ici que les grandes explications.',
      avoidThis: 'Évite d’attendre que {nom} devine ce qui te ferait plaisir.',
    },
    theirs: {
      carries: '{nom} adoucit ce qui te pèse',
      rubs: '{nom} attend de toi un accord que tu ne donnes pas',
      doThis: 'Dis à {nom} ce qui t’a fait plaisir : ça se perd sinon.',
      avoidThis: 'Évite de laisser croire que tu es d’accord pour avoir la paix.',
    },
    both: {
      carries: 'vous aimez les mêmes choses',
      rubs: 'vous tenez chacun à des choses que l’autre ne voit pas',
    },
    source: 'inféré',
  },
  {
    key: 'mars',
    yours: {
      carries: 'tu mets {nom} en mouvement',
      rubs: 'tu vas plus vite que {nom} ne suit',
      doThis: 'Propose, lance, embarque {nom} : sans toi ça resterait une idée.',
      avoidThis: 'Évite de pousser quand {nom} traîne : ça ne fait qu’ancrer.',
    },
    theirs: {
      carries: '{nom} te sort de l’inertie',
      rubs: '{nom} te bouscule là où tu avais besoin de temps',
      doThis: 'Laisse {nom} donner le premier coup : tu suivras plus vite.',
      avoidThis: 'Évite de céder au rythme de {nom} si ce n’est pas le tien.',
    },
    both: {
      carries: 'vous vous lancez au même moment',
      rubs: 'vous vous heurtez sur la manière de faire',
    },
    source: 'inféré',
  },
  {
    key: 'jupiter',
    yours: {
      carries: 'tu ouvres des portes à {nom}',
      rubs: 'tu promets à {nom} plus que tu ne tiens',
      doThis: 'Présente {nom} aux gens que tu connais : c’est ton meilleur apport.',
      avoidThis: 'Évite d’annoncer avant d’avoir vérifié.',
    },
    theirs: {
      carries: '{nom} t’ouvre des portes',
      rubs: '{nom} t’emmène plus loin que ce que tu voulais',
      doThis: 'Prends les occasions que {nom} t’amène, même mal ficelées.',
      avoidThis: 'Évite de t’engager sur l’enthousiasme de {nom} sans regarder.',
    },
    both: {
      carries: 'vous voyez grand ensemble',
      rubs: 'vous en faites trop tous les deux en même temps',
    },
    source: 'inféré',
  },
  {
    /*
     * La seule brique adossée à un exemple travaillé par le rédacteur : « un
     * Saturne difficile veut dire qu'on peut se comporter de façon trop rigide et
     * trop enfermante, donc faire des efforts et laisser de l'espace à l'autre. »
     */
    key: 'saturn',
    yours: {
      carries: 'tu tiens le cadre pour {nom}',
      rubs: 'tu enfermes {nom} sans t’en rendre compte',
      doThis: 'C’est toi qui fais tenir les choses dans la durée : assume-le.',
      avoidThis: 'Évite de vouloir tout cadrer : laisse de l’espace à {nom}.',
    },
    theirs: {
      carries: '{nom} te donne un cadre qui tient',
      rubs: '{nom} te serre plus que nécessaire',
      doThis: 'Appuie-toi sur {nom} pour ce qui demande de la constance.',
      avoidThis: 'Évite de t’y plier en silence : dis-le quand ça serre.',
    },
    both: {
      carries: 'vous prenez les mêmes choses au sérieux',
      rubs: 'vous vous freinez l’un l’autre',
    },
    source: 'dérivé',
  },
  {
    key: 'uranus',
    yours: {
      carries: 'tu déverrouilles des choses chez {nom}',
      rubs: 'tu déstabilises {nom} sans le vouloir',
      doThis: 'Emmène {nom} hors des habitudes : c’est ce que tu apportes de mieux.',
      avoidThis: 'Évite de changer les plans au dernier moment.',
    },
    theirs: {
      carries: '{nom} débloque chez toi ce qui ne bougeait plus',
      rubs: '{nom} déplace tes repères sans prévenir',
      doThis: 'Suis {nom} sur ce que tu n’aurais pas tenté autrement.',
      avoidThis: 'Évite de bâtir sur un plan que {nom} n’a pas encore confirmé.',
    },
    both: {
      carries: 'vous vous passez des règles ensemble',
      rubs: 'rien ne tient en place entre vous',
    },
    source: 'inféré',
  },
  {
    key: 'neptune',
    yours: {
      carries: 'tu inspires {nom}',
      rubs: 'tu brouilles ce que {nom} croyait clair',
      doThis: 'Les projets un peu fous marchent mieux à deux qu’expliqués.',
      avoidThis: 'Évite le flou sur le concret : dates, montants, engagements.',
    },
    theirs: {
      carries: '{nom} te donne des idées que tu n’aurais pas eues',
      rubs: 'tu prêtes à {nom} des intentions qui n’y sont pas',
      doThis: 'Écoute les intuitions de {nom} même mal formulées.',
      avoidThis: 'Évite de deviner : demande à {nom} ce qui est vraiment prévu.',
    },
    both: {
      carries: 'vous rêvez la même chose',
      rubs: 'vous entretenez le flou à deux',
    },
    source: 'inféré',
  },
  {
    key: 'pluto',
    yours: {
      carries: 'tu touches {nom} en profondeur',
      rubs: 'tu cherches à garder la main sur {nom}',
      doThis: 'Les sujets de fond se disent ici sans détour : c’est rare, sers-t’en.',
      avoidThis: 'Évite de tester {nom} pour voir jusqu’où ça tient.',
    },
    theirs: {
      carries: '{nom} te fait aller là où tu n’irais pas de toi-même',
      rubs: '{nom} appuie là où tu ne veux pas regarder',
      doThis: 'Va au bout des conversations que {nom} ouvre, même les longues.',
      avoidThis: 'Évite de laisser {nom} décider de ce que tu dois affronter.',
    },
    both: {
      carries: 'vous allez au fond des choses ensemble',
      rubs: 'vous vous testez l’un l’autre',
    },
    source: 'inféré',
  },
];

/**
 * Ce que le point touché reçoit, dans les deux propriétés.
 *
 * Deux formes et pas une seule : le point touché appartient tantôt au lecteur,
 * tantôt à l'autre, et c'est exactement là que la première version se trompait de
 * personne. Nommé au plus près — « ta sensibilité » se comprend, « ta Lune »
 * demande de savoir ce qu'est une Lune, et le budget de densité interdit le
 * jargon non traduit.
 */
const RECEIVES: Record<PointId, { mine: string; theirs: string }> = {
  sun: { mine: 'ce que tu as de plus central', theirs: 'ce que {nom} a de plus central' },
  moon: { mine: 'ta sensibilité', theirs: 'la sensibilité de {nom}' },
  mercury: { mine: 'ta façon de penser et de parler', theirs: 'la façon de penser de {nom}' },
  venus: { mine: 'ce à quoi tu tiens', theirs: 'ce à quoi {nom} tient' },
  mars: { mine: 'ta façon d’agir', theirs: 'la façon d’agir de {nom}' },
  jupiter: { mine: 'ce sur quoi tu mises', theirs: 'ce sur quoi {nom} mise' },
  saturn: { mine: 'ce que tu prends au sérieux', theirs: 'ce que {nom} prend au sérieux' },
  uranus: { mine: 'ton besoin de liberté', theirs: 'le besoin de liberté de {nom}' },
  neptune: { mine: 'ce que tu imagines', theirs: 'ce que {nom} imagine' },
  pluto: { mine: 'ce que tu ne montres pas', theirs: 'ce que {nom} ne montre pas' },
  asc: { mine: 'ta façon de te présenter', theirs: 'la façon dont {nom} se présente' },
  dsc: { mine: 'ce que tu attends d’une relation', theirs: 'ce que {nom} attend d’une relation' },
  mc: { mine: 'ton image publique', theirs: 'l’image publique de {nom}' },
  ic: { mine: 'ce dont tu as besoin chez toi', theirs: 'ce dont {nom} a besoin chez soi' },
};

const nommer = (gabarit: string, nom: string): string => gabarit.replaceAll('{nom}', nom);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Jointures entre ce qui se passe et ce que ça touche.
 *
 * Six formes, choisies par empreinte sur le lien lui-même. Il y en avait trois au
 * premier jet, et sur un écran de six conseils la même jointure sortait quatre
 * fois — trop peu de cases pour que le hachage les répartisse. Même règle que partout ailleurs — la variation vient de
 * l'événement, jamais de la date, pour qu'un même couple lise toujours pareil.
 */
const JOINTURES = [
  'et ça touche',
  'et ça arrive droit sur',
  'et ça vient chercher',
  'et ça tombe sur',
  'et ça appuie sur',
  'et ça atteint',
];

const choisir = <T,>(options: T[], cle: string): T => options[empreinte(cle) % options.length];

/** « Ton Saturne en carré à la Lune de Marie », ou « Vos deux Vénus en carré ». */
export function linkTitle(link: SynastryLink, nom: string): string {
  const aspect = ASPECTS[link.aspect].label;
  if (link.mutual) return `Vos deux ${POINT_LABELS[link.actor]} en ${aspect}`;
  return link.direction === 'a-to-b'
    // `possessive` porte le genre : « Ton Soleil », mais « Ta Lune ».
    ? `${majuscule(possessive(link.actor))} en ${aspect} ${aDefinite(link.receiver)} de ${nom}`
    : `${majuscule(definite(link.actor))} de ${nom} en ${aspect} à ${possessive(link.receiver)}`;
}

/**
 * Le conseil, en deux phrases : ce qui se passe, puis quoi en faire.
 *
 * Reste sous les quarante-cinq mots du budget de densité — c'est la règle qui
 * décide de la longueur, pas le confort de rédaction.
 */
export function linkAdvice(link: SynastryLink, nom: string): string {
  const brique = RELATION_BLOCKS.find((b) => b.key === link.actor);
  if (!brique) return '';

  const porte = link.strength > 0;
  const cle = `${link.direction}|${link.actor}|${link.receiver}|${link.aspect}`;

  // Le point touché appartient à l'autre seulement quand c'est toi qui agis.
  const aMoi = link.direction === 'b-to-a';
  const recu = nommer(aMoi ? RECEIVES[link.receiver].mine : RECEIVES[link.receiver].theirs, nom);

  const voix = link.mutual ? brique.both : aMoi ? brique.theirs : brique.yours;
  const gestes = aMoi ? brique.theirs : brique.yours;

  const constat = nommer(porte ? voix.carries : voix.rubs, nom);
  const geste = nommer(porte ? gestes.doThis : gestes.avoidThis, nom);

  /*
   * Une configuration mutuelle ne « touche » rien : elle est là des deux côtés. La
   * jointure n'a donc pas de sens, et la phrase se passe très bien d'elle.
   */
  return link.mutual
    ? `${majuscule(constat)}. ${geste}`
    : `${majuscule(constat)}, ${choisir(JOINTURES, cle)} ${recu}. ${geste}`;
}

/**
 * Ce qu'on dit d'une tension majeure.
 *
 * Le rédacteur les appelle « rédhibitoires ». Le produit ne reprend pas le mot :
 * il interdit d'annoncer une catastrophe ou de conseiller de renoncer, et
 * « rédhibitoire » fait les deux en quatre syllabes. Ce qui est dit à la place est
 * ce que le mot recouvre réellement — la configuration la plus exigeante, celle
 * qui demande le plus de travail et qui ne se résorbe pas d'elle-même.
 */
export function tensionNote(link: SynastryLink, nom: string): string {
  const aMoi = link.direction === 'b-to-a';
  const recu = nommer(aMoi ? RECEIVES[link.receiver].mine : RECEIVES[link.receiver].theirs, nom);
  const quoi = aMoi
    ? `${definite(link.actor)} de ${nom} sur ${recu}`
    : `ton ${PLANET_LABELS[link.actor]} sur ${recu}`;
  return `C’est la configuration la plus exigeante entre vous : ${quoi}. `
    + 'Rien ne l’use avec le temps et rien ne la contourne : ça se travaille, '
    + 'à condition que vous sachiez tous les deux que c’est là.';
}
