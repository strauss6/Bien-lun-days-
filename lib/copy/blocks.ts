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
 * **Première livraison du rédacteur : 13 septembre 2026.** Les briques marquées
 * d'un `✳` dans leur commentaire portent sa matière ; les autres restent des
 * amorces de travail en attendant la suite. Il a répondu à bien plus que les dix
 * demandées — dix-neuf des trente-deux sont renseignées.
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
 */

export interface Block<K extends string> {
  key: K;
  label: string;
  /** Question posée au rédacteur. */
  prompt: string;
  /** Amorce, à remplacer par le texte du rédacteur. */
  draft: string;
}

export const TRANSIT_BLOCKS: Array<Block<PlanetId>> = [
  { key: 'sun', label: 'Soleil en transit', prompt: 'Que met en lumière le Soleil quand il passe sur un point du thème ?', draft: 'Met en lumière. Ce qui était latent devient visible, pour une journée.' },
  // ✳ Rédacteur, 13 septembre 2026.
  { key: 'moon', label: 'Lune en transit', prompt: 'Que fait la Lune, qui repasse chaque mois ?', draft: 'Elle touche l\'émotionnel, et ne reste que deux jours dans un signe : rien de ce qu\'elle apporte ne dure. En aspect difficile, on se méfie, on cherche midi à quatorze heures. En bon aspect, on se sent mieux, et l\'élan vient de là.' },
  // ✳ Rédacteur : c'est Mercure qui fait signer, pas Vénus.
  { key: 'mercury', label: 'Mercure en transit', prompt: 'Que déclenche Mercure ?', draft: 'C\'est le mental et le mouvement. Il gouverne les contrats, les arrangements, les signatures — et les déplacements. C\'est lui qu\'on regarde avant de conclure quelque chose.' },
  // ✳ Rédacteur : Vénus n'est pas la planète qui fait signer — c'est Mercure.
  // Elle gouverne le sentimental et l'amical, pas la conclusion d'un accord.
  { key: 'venus', label: 'Vénus en transit', prompt: 'Que fait Vénus quand elle touche un point du thème ?', draft: 'Elle adoucit le relationnel — l\'amour, mais l\'amitié aussi, qui est une forme d\'amour. En bon aspect, tu passes de bons moments avec les gens qui comptent. En aspect difficile, tu es plus vite contrarié sur ce terrain-là.' },
  // ✳ Rédacteur. Sa matière comprenait le rôle de Mars en astrologie médicale :
  // **écartée**, l'axe Énergie ne parle jamais de santé.
  { key: 'mars', label: 'Mars en transit', prompt: 'Que fait Mars ?', draft: 'Il donne l\'énergie et le courage de se battre. En bon aspect, on gagne ce qu\'on engage. Il met en mouvement avec friction : rien ne se fait sans pousser.' },
  // ✳ Rédacteur.
  { key: 'jupiter', label: 'Jupiter en transit', prompt: 'Que fait Jupiter, qui revient tous les douze ans ?', draft: 'Il apporte la chance et les occasions à saisir. C\'est la planète du business et de l\'argent : ce qu\'on entreprend prend de l\'ampleur. Ce qu\'on néglige aussi.' },
  // ✳ Rédacteur : Chronos, le dieu du temps. Et surtout — les blocages se
  // débloquent. « L'aspect montre qu'il y a difficulté ; à nous de la vaincre. »
  { key: 'saturn', label: 'Saturne en transit', prompt: 'Que fait Saturne, en bien comme en mal ?', draft: 'C\'est le temps. Il construit quand il aide, il retarde quand il contrarie. Un aspect difficile de Saturne annonce un blocage, pas une impasse : il montre où est la résistance, à toi de la lever.' },
  // ✳ Rédacteur : le tournant. En maison 10 on change de travail, en maison 7
  // d'associé — ou de conjoint.
  { key: 'uranus', label: 'Uranus en transit', prompt: 'Que fait Uranus, une fois par vie sur un point donné ?', draft: 'Il gère les tournants. Ce qui vient n\'était pas au programme, et on ne revient pas en arrière. C\'est aussi l\'indépendance : ce qui enfermait cesse de tenir.' },
  // ✳ Rédacteur : l'instinct.
  { key: 'neptune', label: 'Neptune en transit', prompt: 'Que fait Neptune ?', draft: 'Il parle à l\'instinct. Les contours se dissolvent : on sent avant de comprendre. Il inspire ou il brouille, rarement les deux à la fois.' },
  { key: 'pluto', label: 'Pluton en transit', prompt: 'Que fait Pluton, qui ne passe qu\'une fois ?', draft: 'Transforme sans retour possible. On ne remet pas les choses comme avant.' },
];

export const ASPECT_BLOCKS: Array<Block<AspectId>> = [
  // ✳ Rédacteur, 13 septembre 2026.
  { key: 'conjunction', label: 'Conjonction (0°)', prompt: 'Que veut dire « la planète arrive dessus » ?', draft: 'La planète arrive dessus et prend le point en charge. Ce qu\'elle apporte dépend entièrement de laquelle : Jupiter ouvre, Saturne ralentit.' },
  // ✳ Rédacteur : favorable, un cran en dessous du trigone.
  { key: 'sextile', label: 'Sextile (60°)', prompt: 'En quoi un sextile diffère d\'un trigone ?', draft: 'Favorable, un cran en dessous du trigone. L\'occasion est là, elle ne se saisit pas toute seule : si tu ne fais rien, il ne se passera rien de spécial.' },
  // ✳ Rédacteur : un blocage, et le domaine dépend de la maison touchée.
  { key: 'square', label: 'Carré (90°)', prompt: 'Qu\'impose un carré ?', draft: 'Un blocage. Il indique qu\'il y a un problème, et le domaine dépend de l\'endroit du thème où il tombe. Il montre où est la difficulté — à toi de la lever.' },
  // ✳ Rédacteur : le vent en poupe, à condition de sortir de chez soi.
  { key: 'trine', label: 'Trigone (120°)', prompt: 'Que donne un trigone ?', draft: 'Le vent en poupe. Le plus favorable des angles, plus fort encore que le sextile. Mais si on reste chez soi sans rien tenter, il ne se passera rien de spécial.' },
  // ✳ Rédacteur : le doute, et c'est ce qui le distingue du carré. Le carré
  // bloque, l'opposition fait hésiter.
  { key: 'opposition', label: 'Opposition (180°)', prompt: 'Que met en face une opposition ?', draft: 'Pile en face, à 180°. Elle donne un doute : on est devant deux choix et on ne sait pas lequel prendre. Là où le carré bloque, l\'opposition fait hésiter.' },
];

export const NATAL_BLOCKS: Array<Block<PointId>> = [
  // ✳ Rédacteur : le principe de vie. Et les transformations qu'on ne choisit pas.
  { key: 'sun', label: 'Soleil natal', prompt: 'Que touche-t-on en touchant le Soleil natal ?', draft: 'Le principe de vie, la lumière — ce qu\'il y a de plus central. Un aspect difficile de Saturne y apporte des retards à lever ; de Pluton, une transformation devant laquelle on est obligé de faire face.' },
  // ✳ Rédacteur : l'émotivité, la sensibilité, et les femmes qu'on rencontre.
  { key: 'moon', label: 'Lune natale', prompt: 'Que représente la Lune natale ?', draft: 'Toute ton émotivité et ta sensibilité — et les femmes que tu rencontres. Bien touchée, l\'intérieur suit ; touchée durement, c\'est là que ça se tend.' },
  // ✳ Rédacteur : le mental, les contrats, le déplacement.
  { key: 'mercury', label: 'Mercure natal', prompt: 'Que représente Mercure natal ?', draft: 'Ton mental : ta façon de penser, de parler, de t\'arranger. C\'est aussi ce qui gouverne tes contrats et tes déplacements.' },
  // ✳ Rédacteur : l'accord avec les autres, amoureux comme amical.
  { key: 'venus', label: 'Vénus natale', prompt: 'Que représente Vénus natale ?', draft: 'L\'accord avec ceux qui t\'entourent, qu\'il s\'agisse de liens amoureux ou d\'amitiés. C\'est le point dont on préfère qu\'il soit bien aspecté.' },
  // ✳ Rédacteur. Le versant médical de Mars, fourni, est **écarté** du produit.
  { key: 'mars', label: 'Mars natal', prompt: 'Que représente Mars natal ?', draft: 'Ton énergie et ton courage — ta façon d\'aller au combat. Bien aspecté, tu gagnes ce que tu engages. Durement aspecté, tu te bats quand même, plus longtemps.' },
  // ✳ Rédacteur : la chance, la réussite, l'argent.
  { key: 'jupiter', label: 'Jupiter natal', prompt: 'Que représente Jupiter natal ?', draft: 'Là où la chance te sourit et où tu vas de l\'avant. C\'est aussi l\'argent et la réussite. Et l\'endroit où tu en fais trop.' },
  // ✳ Rédacteur : le pragmatisme et la construction.
  { key: 'saturn', label: 'Saturne natal', prompt: 'Que représente Saturne natal ?', draft: 'Ta façon de voir les choses de manière carrée, et ce que tu construis dans la durée. Bien aspecté, tu bâtis ; durement aspecté, tu bâtis quand même, mais contre plus de résistance.' },
  // ✳ Rédacteur : liberté, indépendance — et les nouvelles technologies.
  { key: 'uranus', label: 'Uranus natal', prompt: 'Que représente Uranus natal ?', draft: 'Ton besoin de liberté et d\'indépendance. Tu supportes mal les cadres trop rigides. C\'est aussi ce qui te tourne vers l\'informatique et les technologies.' },
  // ✳ Rédacteur : l'instinct.
  { key: 'neptune', label: 'Neptune natal', prompt: 'Que représente Neptune natal ?', draft: 'Ton instinct. Ce que tu perçois avant de pouvoir l\'expliquer — et, quand il est mal aspecté, ce que tu prends pour une intuition sans en être une.' },
  { key: 'pluto', label: 'Pluton natal', prompt: 'Que représente Pluton natal ?', draft: 'Ta capacité à repartir de zéro.' },
  { key: 'asc', label: 'Ascendant', prompt: 'Que touche-t-on en touchant l\'Ascendant ?', draft: 'Ton allure, ta façon d\'entrer dans une pièce, le corps.' },
  { key: 'mc', label: 'Milieu du Ciel', prompt: 'Que représente le Milieu du Ciel ?', draft: 'Ta carrière, ta réputation, ce pour quoi on te connaît.' },
  { key: 'dsc', label: 'Descendant', prompt: 'Que représente le Descendant ?', draft: 'L\'autre : associé, conjoint, partie adverse. Tout ce qui se signe à deux.' },
  { key: 'ic', label: 'Fond du Ciel', prompt: 'Que représente le Fond du Ciel ?', draft: 'Ta base, ta famille, ce d\'où tu viens.' },
];

export const AXIS_BLOCKS: Array<Block<AxisId>> = [
  // ✳ Rédacteur : agir, aller chercher l'occasion. « Titiller la chance. »
  { key: 'business', label: 'Axe Business', prompt: 'Qu\'est-ce qu\'un bon jour Business demande de faire, concrètement ?', draft: 'Agir. Observer autour de soi et aller chercher l\'occasion au lieu de l\'attendre : demander l\'augmentation, relancer, proposer. Un jour difficile ne demande pas de renoncer — il demande de redoubler de vigilance, quitte à laisser passer.' },
  // ✳ Rédacteur. **Le contexte change la consigne** : en couple, partager et dire
  // les choses ; seul, sortir et rencontrer. Le produit ne connaît pas encore ce
  // contexte — voir QUESTIONS.md Q14.
  { key: 'love', label: 'Axe Amour', prompt: 'Qu\'est-ce qu\'un bon jour Amour demande de faire ?', draft: 'Partager le plus possible avec la personne qui compte — ou, si tu es seul, sortir, parce que c\'est un jour où un lien peut se tisser. Un jour difficile contrarie ce terrain-là : ne force aucune conversation.' },
  // ✳ Rédacteur. Sa matière comprenait le rôle de Mars en astrologie médicale —
  // les défenses de l'organisme. **Écarté** : cet axe ne parle jamais de santé,
  // et le filtre de sortie l'arrêterait de toute façon.
  { key: 'energy', label: 'Axe Énergie', prompt: 'Qu\'est-ce qu\'un jour Énergie dit — sans jamais parler de santé ?', draft: 'Aller se dépenser. Sortir, bouger, tenir un effort qu\'on ne tiendrait pas un autre jour. Surtout ne pas rester chez soi à ne rien faire. Un jour bas demande l\'inverse : lever le pied, garder le nerf.' },
];

export function blockCount(): number {
  return TRANSIT_BLOCKS.length + ASPECT_BLOCKS.length + NATAL_BLOCKS.length + AXIS_BLOCKS.length;
}
