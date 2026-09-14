import type { AspectId, AxisId, PlanetId, PointId } from '../astro/types';

/**
 * Briques d'interprétation.
 *
 * Écrire 555 textes à la main est un travail de six semaines. Écrire les briques
 * dont ils sont faits en est un d'une demi-journée : ce que signifie chaque
 * planète *quand elle passe*, ce que fait chaque aspect, ce que représente chaque
 * point *natal*, et ce que chaque axe demande. Le modèle compose ensuite les
 * feuilles à partir des briques et d'exemples rédigés en entier, et le rédacteur
 * corrige au lieu d'écrire.
 *
 * **Les trente-deux briques ont un texte. Elles n'ont pas toutes une réponse.**
 * Deux livraisons — le 13 septembre 2026, dix briques demandées ; le 14, les
 * mots-clés de chaque planète. Le champ `source` de chaque brique dit laquelle
 * des trois situations s'applique, et il faut le lire avant de s'y fier :
 *
 * — **`direct` (12)** : les mots du rédacteur, en réponse à la question posée.
 * — **`dérivé` (15)** : sa matière, transposée par nous. Ce sont les mots-clés de
 *   planète, employés **deux fois** — une fois pour « ce qu'elle fait quand elle
 *   passe », une fois pour « ce qu'elle représente dans le thème ». Or ce sont
 *   deux questions différentes, et cette différence est le cœur du produit. Ces
 *   quinze briques sont les plus fragiles du corpus.
 * — **`inféré` (5)** : aucune réponse derrière. Les quatre axes du thème, écrits
 *   depuis les maisons correspondantes, et la conjonction, qu'il n'a jamais
 *   définie directement.
 *
 * Le générateur doit traiter `dérivé` et `inféré` comme des hypothèses, pas comme
 * de la parole d'auteur. Les cinq briques à redemander en priorité — celles qui
 * cumulent forte fréquence de lecture et provenance faible — sont listées dans
 * `docs/05-corpus-livraison-1.md`.
 *
 * Trois consignes de ton en sont ressorties, et elles valent pour tout le corpus.
 *
 * **On écrit « difficile », jamais « mauvais ».** Consigne explicite. Un aspect
 * dur montre où est la difficulté ; il ne la rend pas insurmontable.
 *
 * **Rien n'est une fatalité.** « L'aspect montre qu'il y a une difficulté ; à
 * nous de la vaincre. » Et un bon aspect ailleurs compense un aspect lent
 * difficile : « ça ne veut pas dire que la lutte n'est pas là, ça veut dire qu'on
 * arrive à le résoudre. »
 *
 * **Un bon aspect ne promet rien tout seul.** « Si on ne fait rien et qu'on reste
 * chez soi, il ne se passera rien de spécial. » Les briques favorables demandent
 * d'agir, elles n'annoncent pas un résultat.
 *
 * **Deux choses ont été écartées de la matière fournie**, et c'est le même
 * réflexe dans les deux cas : ce qui est exact en astrologie n'est pas toujours
 * publiable. Le rôle de Mars en astrologie médicale — les défenses de l'organisme
 * — parce que l'axe Énergie ne parle jamais de santé. Et la lecture littérale de
 * Pluton selon l'âge, parce qu'un produit grand public n'annonce pas une échéance
 * vitale à quelqu'un sur la foi d'un thème astral. Sa formule utile pour Pluton
 * était juste à côté — « mourir et renaître », « la fin d'un chapitre » — et c'est
 * celle-là qui est retenue, au figuré seulement. Un filtre global refuse désormais
 * le vocabulaire de la mort sur **tous** les axes, pas seulement sur l'Énergie.
 */

/**
 * D'où vient le texte d'une brique.
 *
 * Distinction qui n'est pas de la bureaucratie : elle dit **avec quelle confiance
 * le générateur peut s'appuyer dessus**. Une brique `direct` porte les mots du
 * rédacteur en réponse à la question posée. Une brique `dérivé` porte sa matière,
 * mais transposée par nous — le plus souvent un mot-clé de planète servi à la
 * fois pour « ce qu'elle fait quand elle passe » et pour « ce qu'elle représente
 * dans le thème », alors que ce sont deux questions différentes, et que cette
 * différence est le cœur du produit. Une brique `inféré` n'a pas de réponse
 * derrière elle : elle a été écrite depuis une matière voisine.
 */
export type BlockSource = 'direct' | 'dérivé' | 'inféré';

export interface Block<K extends string> {
  key: K;
  label: string;
  /** Question posée au rédacteur. */
  prompt: string;
  /** Texte de la brique. */
  draft: string;
  /** Provenance — voir `BlockSource`. À relire avant de s'y fier. */
  source: BlockSource;
}

export const TRANSIT_BLOCKS: Array<Block<PlanetId>> = [
  // ✳ Rédacteur : la vie, tout simplement.
  { key: 'sun', label: 'Soleil en transit', prompt: 'Que met en lumière le Soleil quand il passe sur un point du thème ?', draft: 'Il met en lumière. Le Soleil, c\'est la vie : là où il passe, ce qui était latent devient visible, le temps d\'une journée.', source: 'dérivé' },
  // ✳ Rédacteur, 13 septembre 2026.
  { key: 'moon', label: 'Lune en transit', prompt: 'Que fait la Lune, qui repasse chaque mois ?', draft: 'Elle touche l\'émotionnel, et ne reste que deux jours dans un signe : rien de ce qu\'elle apporte ne dure. En aspect difficile, on se méfie, on cherche midi à quatorze heures. En bon aspect, on se sent mieux, et l\'élan vient de là.', source: 'direct' },
  // ✳ Rédacteur : c'est Mercure qui fait signer, pas Vénus.
  { key: 'mercury', label: 'Mercure en transit', prompt: 'Que déclenche Mercure ?', draft: 'C\'est la communication avant tout, donc le rapport aux autres. Il gouverne les contrats, les arrangements, les signatures — et les déplacements. C\'est lui qu\'on regarde avant de conclure.', source: 'dérivé' },
  // ✳ Rédacteur : Vénus n'est pas la planète qui fait signer — c'est Mercure.
  // Elle gouverne le sentimental et l'amical, pas la conclusion d'un accord.
  { key: 'venus', label: 'Vénus en transit', prompt: 'Que fait Vénus quand elle touche un point du thème ?', draft: 'Elle adoucit tout le relationnel — l\'amour, l\'amitié, la famille — et les plaisirs : la table, la séduction. En bon aspect, tu passes de bons moments avec les gens qui comptent. En aspect difficile, tu es plus vite contrarié là-dessus.', source: 'direct' },
  // ✳ Rédacteur. Sa matière comprenait le rôle de Mars en astrologie médicale :
  // **écartée**, l'axe Énergie ne parle jamais de santé.
  { key: 'mars', label: 'Mars en transit', prompt: 'Que fait Mars ?', draft: 'C\'est l\'action : entrer en action, se battre. Il donne l\'énergie et le courage, et il met en mouvement avec friction. En bon aspect, on gagne ce qu\'on engage ; rien ne se fait sans pousser.', source: 'dérivé' },
  // ✳ Rédacteur.
  { key: 'jupiter', label: 'Jupiter en transit', prompt: 'Que fait Jupiter, qui revient tous les douze ans ?', draft: 'Il apporte la chance et les occasions à saisir. C\'est la planète du business et de l\'argent : ce qu\'on entreprend prend de l\'ampleur. Ce qu\'on néglige aussi.', source: 'dérivé' },
  // ✳ Rédacteur : Chronos, le dieu du temps. Et surtout — les blocages se
  // débloquent. « L'aspect montre qu'il y a difficulté ; à nous de la vaincre. »
  { key: 'saturn', label: 'Saturne en transit', prompt: 'Que fait Saturne, en bien comme en mal ?', draft: 'C\'est le temps, donc les obstacles et les retards. Il est carré : en bon aspect, c\'est ce qui rend son travail très constructif. Un aspect difficile annonce un blocage, pas une impasse — il montre où est la résistance, à toi de la lever.', source: 'dérivé' },
  // ✳ Rédacteur : le tournant. En maison 10 on change de travail, en maison 7
  // d'associé — ou de conjoint.
  { key: 'uranus', label: 'Uranus en transit', prompt: 'Que fait Uranus, une fois par vie sur un point donné ?', draft: 'Il gère les tournants. C\'est l\'exact inverse de Saturne : rien de carré, la liberté et l\'émancipation. Ce qui vient n\'était pas au programme, ce qui enfermait cesse de tenir, et on ne revient pas en arrière.', source: 'dérivé' },
  // ✳ Rédacteur : l'instinct.
  { key: 'neptune', label: 'Neptune en transit', prompt: 'Que fait Neptune ?', draft: 'Il parle à l\'instinct et au rêve. Les contours se dissolvent : on sent avant de comprendre, et c\'est de là que vient l\'inspiration. Il inspire ou il brouille, rarement les deux à la fois.', source: 'dérivé' },
  /*
   * ✳ Rédacteur : « mourir et renaître ». Sa formule, et elle est bonne — mais
   * **au figuré seulement**. Sa matière comprenait aussi une lecture littérale
   * selon l'âge de la personne : **écartée**, et un filtre global refuse désormais
   * le vocabulaire de la mort sur tous les axes.
   */
  { key: 'pluto', label: 'Pluton en transit', prompt: 'Que fait Pluton, qui ne passe qu\'une fois ?', draft: 'Il transforme sans retour possible. C\'est la fin d\'un chapitre et le début d\'un autre : quelque chose s\'achève, et on ne remet pas les choses comme avant.', source: 'dérivé' },
];

export const ASPECT_BLOCKS: Array<Block<AspectId>> = [
  // ✳ Rédacteur, 13 septembre 2026.
  { key: 'conjunction', label: 'Conjonction (0°)', prompt: 'Que veut dire « la planète arrive dessus » ?', draft: 'La planète arrive dessus et prend le point en charge. Ce qu\'elle apporte dépend entièrement de laquelle : Jupiter ouvre, Saturne ralentit.', source: 'inféré' },
  // ✳ Rédacteur : favorable, un cran en dessous du trigone.
  { key: 'sextile', label: 'Sextile (60°)', prompt: 'En quoi un sextile diffère d\'un trigone ?', draft: 'Favorable, un cran en dessous du trigone. L\'occasion est là, elle ne se saisit pas toute seule : si tu ne fais rien, il ne se passera rien de spécial.', source: 'direct' },
  // ✳ Rédacteur : un blocage, et le domaine dépend de la maison touchée.
  { key: 'square', label: 'Carré (90°)', prompt: 'Qu\'impose un carré ?', draft: 'Un blocage. Il indique qu\'il y a un problème, et le domaine dépend de l\'endroit du thème où il tombe. Il montre où est la difficulté — à toi de la lever.', source: 'direct' },
  // ✳ Rédacteur : le vent en poupe, à condition de sortir de chez soi.
  { key: 'trine', label: 'Trigone (120°)', prompt: 'Que donne un trigone ?', draft: 'Le vent en poupe. Le plus favorable des angles, plus fort encore que le sextile. Mais si on reste chez soi sans rien tenter, il ne se passera rien de spécial.', source: 'direct' },
  // ✳ Rédacteur : le doute, et c'est ce qui le distingue du carré. Le carré
  // bloque, l'opposition fait hésiter.
  { key: 'opposition', label: 'Opposition (180°)', prompt: 'Que met en face une opposition ?', draft: 'Pile en face, à 180°. Elle donne un doute : on est devant deux choix et on ne sait pas lequel prendre. Là où le carré bloque, l\'opposition fait hésiter.', source: 'direct' },
];

export const NATAL_BLOCKS: Array<Block<PointId>> = [
  // ✳ Rédacteur : le principe de vie. Et les transformations qu'on ne choisit pas.
  { key: 'sun', label: 'Soleil natal', prompt: 'Que touche-t-on en touchant le Soleil natal ?', draft: 'Le principe de vie, la lumière — ce qu\'il y a de plus central. Un aspect difficile de Saturne y apporte des retards à lever ; de Pluton, une transformation devant laquelle on est obligé de faire face.', source: 'direct' },
  // ✳ Rédacteur : l'émotivité, la sensibilité, et les femmes qu'on rencontre.
  { key: 'moon', label: 'Lune natale', prompt: 'Que représente la Lune natale ?', draft: 'Toute ton émotivité et ta sensibilité — et les femmes que tu rencontres. Bien touchée, l\'intérieur suit ; touchée durement, c\'est là que ça se tend.', source: 'direct' },
  // ✳ Rédacteur : le mental, les contrats, le déplacement.
  { key: 'mercury', label: 'Mercure natal', prompt: 'Que représente Mercure natal ?', draft: 'Ton mental : ta façon de penser, de parler, de t\'arranger. C\'est aussi ce qui gouverne tes contrats et tes déplacements.', source: 'dérivé' },
  // ✳ Rédacteur : l'accord avec les autres, amoureux comme amical.
  { key: 'venus', label: 'Vénus natale', prompt: 'Que représente Vénus natale ?', draft: 'L\'accord avec ceux qui t\'entourent — amoureux, amical, familial — et ton rapport au plaisir : la table, la séduction. C\'est le point dont on préfère qu\'il soit bien aspecté.', source: 'direct' },
  // ✳ Rédacteur. Le versant médical de Mars, fourni, est **écarté** du produit.
  { key: 'mars', label: 'Mars natal', prompt: 'Que représente Mars natal ?', draft: 'Ton énergie et ton courage — ta façon d\'entrer en action et d\'aller au combat, le versant physique de toi. Bien aspecté, tu gagnes ce que tu engages. Durement aspecté, tu te bats plus longtemps.', source: 'dérivé' },
  // ✳ Rédacteur : la chance, la réussite, l'argent.
  { key: 'jupiter', label: 'Jupiter natal', prompt: 'Que représente Jupiter natal ?', draft: 'Là où la chance te sourit et où tu vas de l\'avant. C\'est aussi l\'argent et la réussite. Et l\'endroit où tu en fais trop.', source: 'dérivé' },
  // ✳ Rédacteur : le pragmatisme et la construction.
  { key: 'saturn', label: 'Saturne natal', prompt: 'Que représente Saturne natal ?', draft: 'Ta façon de voir les choses de manière carrée, et ce que tu construis dans la durée. Bien aspecté, tu bâtis ; durement aspecté, tu bâtis quand même, mais contre plus de résistance.', source: 'dérivé' },
  // ✳ Rédacteur : liberté, indépendance — et les nouvelles technologies.
  /*
   * ✳ Rédacteur : liberté, émancipation, et l'inventeur — « beaucoup de gens qui
   * ont déposé des brevets ont un Uranus important ». L'électricité, l'informatique,
   * et l'astrologie elle-même.
   */
  { key: 'uranus', label: 'Uranus natal', prompt: 'Que représente Uranus natal ?', draft: 'Ton besoin de liberté et d\'émancipation : tu supportes mal les cadres rigides. C\'est aussi le point de l\'inventeur — ce qui tourne vers les sciences, l\'informatique, tout ce qui n\'existait pas avant.', source: 'dérivé' },
  // ✳ Rédacteur : l'instinct.
  // ✳ Rédacteur : l'instinct et le rêve. « Les artistes qui peignent un beau
  // tableau ont un Neptune important. »
  { key: 'neptune', label: 'Neptune natal', prompt: 'Que représente Neptune natal ?', draft: 'Ton instinct et ton rêve — ce que tu perçois avant de pouvoir l\'expliquer, et d\'où vient ce que tu crées. Mal aspecté, c\'est ce que tu prends pour une intuition sans en être une.', source: 'dérivé' },
  // ✳ Rédacteur : mourir et renaître — au figuré, et seulement au figuré.
  { key: 'pluto', label: 'Pluton natal', prompt: 'Que représente Pluton natal ?', draft: 'Ta capacité à repartir de zéro. C\'est le point qui sait finir un chapitre pour en ouvrir un autre, et se transformer au lieu de s\'accrocher.', source: 'dérivé' },
  // ✳ Rédacteur, via la maison 1. C'est aussi là que se lit une planète
  // dominante : collée à l'Ascendant, elle colore toute la personne.
  { key: 'asc', label: 'Ascendant', prompt: 'Que touche-t-on en touchant l\'Ascendant ?', draft: 'Ton allure et ta façon d\'entrer dans une pièce. C\'est aussi l\'endroit le plus révélateur du thème : une planète posée dessus colore toute la personne.', source: 'inféré' },
  // ✳ Rédacteur, via la maison 10 — l'une des quatre maisons importantes.
  { key: 'mc', label: 'Milieu du Ciel', prompt: 'Que représente le Milieu du Ciel ?', draft: 'Le boulot, et la réputation qui va avec. C\'est ce pour quoi on te connaît, et l\'endroit du thème où se lisent les changements de métier.', source: 'inféré' },
  // ✳ Rédacteur, via la maison 7 : « les associés, les partenaires, tout contrat
  // signé avec quelqu'un d'autre ». Il la tient pour aussi importante que la 10.
  { key: 'dsc', label: 'Descendant', prompt: 'Que représente le Descendant ?', draft: 'L\'autre : l\'associé, le partenaire, le conjoint. Tout ce qui se signe à deux passe par là, dans le travail comme ailleurs.', source: 'inféré' },
  // ✳ Rédacteur, via la maison 4 : la famille, le domicile, tout bien immobilier.
  { key: 'ic', label: 'Fond du Ciel', prompt: 'Que représente le Fond du Ciel ?', draft: 'Ta base : la famille, le domicile, ce que tu possèdes en murs. C\'est d\'où tu viens, et ce sur quoi tu t\'appuies.', source: 'inféré' },
];

export const AXIS_BLOCKS: Array<Block<AxisId>> = [
  // ✳ Rédacteur : agir, aller chercher l'occasion. « Titiller la chance. »
  { key: 'business', label: 'Axe Business', prompt: 'Qu\'est-ce qu\'un bon jour Business demande de faire, concrètement ?', draft: 'Agir. Observer autour de soi et aller chercher l\'occasion au lieu de l\'attendre : demander l\'augmentation, relancer, proposer. Un jour difficile ne demande pas de renoncer — il demande de redoubler de vigilance, quitte à laisser passer.', source: 'direct' },
  // ✳ Rédacteur. **Le contexte change la consigne** : en couple, partager et dire
  // les choses ; seul, sortir et rencontrer. Le produit ne connaît pas encore ce
  // contexte — voir QUESTIONS.md Q14.
  { key: 'love', label: 'Axe Amour', prompt: 'Qu\'est-ce qu\'un bon jour Amour demande de faire ?', draft: 'Partager le plus possible avec la personne qui compte — ou, si tu es seul, sortir, parce que c\'est un jour où un lien peut se tisser. Un jour difficile contrarie ce terrain-là : ne force aucune conversation.', source: 'direct' },
  // ✳ Rédacteur. Sa matière comprenait le rôle de Mars en astrologie médicale —
  // les défenses de l'organisme. **Écarté** : cet axe ne parle jamais de santé,
  // et le filtre de sortie l'arrêterait de toute façon.
  { key: 'energy', label: 'Axe Énergie', prompt: 'Qu\'est-ce qu\'un jour Énergie dit — sans jamais parler de santé ?', draft: 'Aller se dépenser. Sortir, bouger, tenir un effort qu\'on ne tiendrait pas un autre jour. Surtout ne pas rester chez soi à ne rien faire. Un jour bas demande l\'inverse : lever le pied, garder le nerf.', source: 'direct' },
];

export function blockCount(): number {
  return TRANSIT_BLOCKS.length + ASPECT_BLOCKS.length + NATAL_BLOCKS.length + AXIS_BLOCKS.length;
}
