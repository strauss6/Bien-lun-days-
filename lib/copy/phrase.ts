import type { AxisId } from '@/lib/astro/types';

/**
 * Phrases de jour, par gabarit déterministe.
 *
 * Elles citent les deux aspects retenus puis disent quoi en faire. Aucun appel
 * réseau : le chemin complet ne doit pas dépendre d'une clé d'API — voir
 * QUESTIONS.md Q6. La génération par le modèle viendra en surcouche sur le même
 * contrat, et remplira la même table de cache.
 *
 * Trois règles y sont tenues par construction :
 * — jamais de formule de voyance ;
 * — l'axe Énergie ne parle que de rythme, jamais de santé ;
 * — quarante-cinq mots au maximum, budget de densité oblige.
 */

export interface PhraseAspect {
  phrase: string;
  sign: '+' | '−';
}

/**
 * Ce que chaque axe demande de faire, selon que le jour porte ou résiste.
 *
 * **Six formulations par cas, et non une.** Une seule phrase par axe et par
 * polarité, c'était la même consigne tous les deux jours : au bout d'une semaine
 * le lecteur ne la lit plus. Six suffisent à ce qu'un axe prioritaire ne se
 * répète pas dans le mois.
 *
 * **Le choix se fait sur l'événement, pas sur la date ni au hasard.** Un même
 * transit garde donc sa formulation tant qu'il dure — c'est voulu : changer les
 * mots chaque matin sur une situation qui n'a pas bougé, c'est fabriquer de la
 * nouveauté, ce que la direction produit interdit. C'est la clause de continuité
 * qui dit l'évolution : « ça commence », « ça dure depuis quatre jours ».
 *
 * **Le registre.** Concret, imagé, adulte. Une consigne qu'on pourrait donner à
 * quelqu'un en face de soi. Jamais une promesse sur ce qu'une autre personne va
 * faire ou ressentir — on dit ce que la personne peut faire, elle.
 *
 * L'axe Énergie ne parle que de rythme et d'élan. Jamais de santé, et le filtre
 * de sortie le vérifie.
 */
const VERDICTS: Record<AxisId, { good: string[]; bad: string[] }> = {
  business: {
    good: [
      'Va chercher l’occasion. Aujourd’hui, demander coûte moins que d’habitude.',
      'C’est le jour pour demander. Demande.',
      'Une paire d’as en main ne rapporte rien si tu ne mises pas.',
      'Relance ce que tu as laissé en attente. Ça passe mieux aujourd’hui.',
      'Propose le chiffre que tu n’osais pas proposer.',
      'Fais le premier pas plutôt que d’attendre qu’on le fasse.',
    ],
    bad: [
      'Redouble de vigilance. Mieux vaut laisser passer que forcer.',
      'Ne signe rien aujourd’hui. Prépare, envoie demain.',
      'Ce n’est pas le jour pour demander. C’est le jour pour préparer le dossier.',
      'Vérifie deux fois ce que tu envoies.',
      'Laisse passer la tempête. Elle n’est pas contre toi, elle passe.',
      'Décale ce qui peut l’être. Le reste, prudemment.',
    ],
  },
  love: {
    good: [
      'Dis ce que tu as à dire. C’est un jour qui relie.',
      'Sors. Ce qui se noue aujourd’hui tient.',
      'Le message que tu repousses depuis trois jours, envoie-le.',
      'Propose quelque chose plutôt que d’attendre qu’on te propose.',
      'Donne du temps à la personne qui compte. C’est ce qui se voit le plus aujourd’hui.',
      'Ce que tu formules aujourd’hui sort mieux qu’hier.',
    ],
    bad: [
      'Tu seras vite contrarié sur ce terrain. Ne force aucune conversation.',
      'Ce n’est pas le jour pour mettre les choses à plat.',
      'Garde pour demain ce que tu voulais dire aujourd’hui.',
      'Ne relance pas. L’insistance te coûtera plus qu’elle ne te rapporte.',
      'Écoute plus que tu ne parles.',
      'Laisse la conversation venir au lieu d’aller la chercher.',
    ],
  },
  energy: {
    // Rythme et élan uniquement. Jamais un symptôme, jamais un conseil de santé.
    good: [
      'Va te dépenser. Tu tiendras l’effort mieux qu’hier.',
      'Sors, bouge. Rester chez toi aujourd’hui, c’est du gâchis.',
      'Attaque ce qui demande du nerf. Tu l’as.',
      'Le rythme te porte. Charge.',
      'La séance que tu repousses, fais-la aujourd’hui.',
      'Tu as du carburant. Brûle-le.',
    ],
    bad: [
      'Lève le pied. Garde le nerf pour un autre jour.',
      'Ralentis. Ce n’est pas un jour à forcer.',
      'Fais moins, et fais-le bien.',
      'Reporte ce qui demande du nerf.',
      'Ménage ton élan. Il remontera.',
      'Ce n’est pas un jour de charge, c’est un jour d’entretien.',
    ],
  },
};

/** Même principe pour l'ouverture : plusieurs façons de dire la même forme. */
const OPENERS: Record<string, string[]> = {
  bothGood: [
    'Deux ouvertures le même jour.',
    'Deux choses vont dans le même sens.',
    'Tout pousse du même côté.',
  ],
  bothBad: [
    'Deux résistances le même jour.',
    'Deux choses tirent en arrière.',
    'Ça coince des deux côtés.',
  ],
  mixed: [
    'Une ouverture et une résistance.',
    'Ça tire dans deux sens.',
    'Un appui et un frein le même jour.',
  ],
  singleGood: [
    'Une seule chose, mais elle porte.',
    'Un seul appui, et il est solide.',
  ],
  singleBad: [
    'Une seule chose, et elle pèse.',
    'Un seul frein, mais il freine.',
  ],
};

/**
 * Empreinte stable d'une chaîne — FNV-1a, trente-deux bits.
 *
 * Sert à choisir une formulation sans tirage au sort : la même situation rend
 * toujours la même phrase, sur n'importe quelle machine et à n'importe quel
 * moment. Un `Math.random` donnerait un texte différent à chaque ouverture de la
 * même journée, ce que la direction produit interdit explicitement.
 */
export function empreinte(cle: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < cle.length; i += 1) {
    h ^= cle.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const choisir = <T,>(options: T[], cle: string): T => options[empreinte(cle) % options.length];

export const MAX_WORDS = 45;

export function buildPhrase(
  axis: AxisId,
  aspects: PhraseAspect[],
  /**
   * Où en est la journée dans son propre mouvement — voir `continuity.ts`.
   * Absente, la phrase reste celle d'avant : le produit lit encore, il ne
   * raconte simplement pas la suite.
   */
  continuity?: string | null,
  /**
   * Mots déjà réservés sur le budget de l'écran par du texte courant affiché
   * **avec** cette phrase — en pratique la traduction de l'aspect, qui vit dans
   * le même bloc juste en dessous.
   *
   * Sans cette réserve, chacun tenait son budget de son côté et l'écran passait
   * à quarante-six mots pour un plafond de quarante-cinq : personne n'était
   * fautif, et la règle était quand même enfreinte. Le budget se compte là où il
   * se lit, en un seul endroit.
   */
  reserve = 0,
): string {
  if (!aspects.length) {
    return 'Rien de marquant ce jour-là. C’est une journée ordinaire, et c’est une information.';
  }

  const positive = aspects[0].sign === '+';
  const cited = aspects.map((a) => a.phrase).join(', et ');

  /*
   * La clé du choix : l'axe et les aspects cités, pas la date. Deux journées
   * portées par le même transit gardent la même formulation — c'est la clause de
   * continuité qui dit que ça dure, pas un synonyme différent chaque matin.
   */
  const cle = `${axis}|${aspects.map((a) => a.phrase).join('|')}`;
  const forme = aspects.length > 1
    ? (aspects[0].sign === aspects[1].sign ? (positive ? 'bothGood' : 'bothBad') : 'mixed')
    : (positive ? 'singleGood' : 'singleBad');

  const opener = choisir(OPENERS[forme], cle);
  const verdict = choisir(positive ? VERDICTS[axis].good : VERDICTS[axis].bad, cle);

  /*
   * Quarante-cinq mots, budget de densité. La clause de continuité est ce que
   * la nouvelle direction produit demande d'ajouter — « ça dure depuis quatre
   * jours » vaut mieux qu'une fausse nouveauté — mais elle ne peut pas faire
   * déborder l'écran. Quand il faut couper, c'est l'ouverture qui saute : elle
   * commente la forme, la continuité apporte un fait.
   */
  /*
   * Quarante-cinq mots, budget de densité, `reserve` comprise. On essaie les
   * formes de la plus complète à la plus courte et on garde la première qui
   * tient. L'ouverture saute avant la continuité — elle commente la forme, la
   * continuité apporte un fait — et en dernier ressort la consigne est remplacée
   * par la plus brève de son propre jeu : une variante imagée peut faire douze
   * mots là où une autre en fait six, et c'est ce qui faisait déborder l'écran.
   * La consigne elle-même ne saute jamais : un jour sans consigne ne dit rien.
   */
  const budget = MAX_WORDS - reserve;
  const brève = [...(positive ? VERDICTS[axis].good : VERDICTS[axis].bad)]
    .sort((a, b) => wordCount(a) - wordCount(b))[0];

  const formes = [
    continuity ? `${cited}. ${opener} ${continuity} ${verdict}` : `${cited}. ${opener} ${verdict}`,
    continuity ? `${cited}. ${continuity} ${verdict}` : `${cited}. ${verdict}`,
    `${cited}. ${verdict}`,
    `${cited}. ${brève}`,
  ];
  return formes.find((f) => wordCount(f) <= budget) ?? formes[formes.length - 1];
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Lexique interdit sur l'axe Énergie, vérifié en sortie. */
export const MEDICAL_TERMS = [
  'opération', 'chirurgie', 'médecin', 'symptôme', 'diagnostic', 'traitement',
  'médicament', 'maladie', 'douleur', 'consultation', 'hôpital', 'ordonnance',
  'guérison', 'santé', 'thérapie',
];

/** Formules de voyance interdites partout. */
export const FORBIDDEN_PHRASES = [
  'les astres', 'l’univers t’envoie', 'l\'univers t\'envoie', 'énergies négatives',
  'vibrations', 'le destin', 'les planètes te',
];

/**
 * Le vocabulaire de la mort, interdit sur **tous** les axes.
 *
 * Le rédacteur du corpus a donné de Pluton une lecture exacte en astrologie et
 * inacceptable dans un produit : « si tu as un aspect difficile de Pluton et que
 * tu as 95 ans, tu risques d'y passer ». Sa formule utile est juste à côté —
 * « mourir et renaître », « la fin d'un chapitre, le début d'un autre » — et
 * c'est celle-là qu'on garde, au sens figuré seulement.
 *
 * Un produit grand public qui annonce une échéance vitale à quelqu'un sur la foi
 * d'un thème astral, c'est le pire que ce projet puisse produire. Le filtre est
 * donc global, pas réservé à l'axe Énergie.
 *
 * Recherche par **frontière de mot** et non par sous-chaîne : « amortir »,
 * « immortel » et « mortier » contiennent tous « mort », et les interdire
 * appauvrirait la langue sans rien protéger.
 */
export const MORTALITY_TERMS = [
  'mort', 'morte', 'morts', 'mourir', 'meurt', 'mourrez', 'mourras',
  'décès', 'décéder', 'décède', 'mortel', 'mortelle', 'funérailles',
  'enterrement', 'obsèques', 'agonie', 'trépas',
];

const MORTALITY_RE = new RegExp(`\\b(${MORTALITY_TERMS.join('|')})\\b`, 'i');

/** Expressions de fin de vie, qui échappent au mot isolé. */
export const MORTALITY_PHRASES = [
  'fin de vie', 'espérance de vie', 'y passer', 'dernier souffle', 'tes derniers',
];

export function violatesContentRules(axis: AxisId, text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_PHRASES) {
    if (lower.includes(term)) return `formule de voyance : « ${term} »`;
  }
  const mortel = MORTALITY_RE.exec(lower);
  if (mortel) return `vocabulaire de la mort : « ${mortel[1]} »`;
  for (const term of MORTALITY_PHRASES) {
    if (lower.includes(term)) return `annonce de fin de vie : « ${term} »`;
  }
  if (axis === 'energy') {
    for (const term of MEDICAL_TERMS) {
      if (lower.includes(term)) return `terme médical sur l’axe Énergie : « ${term} »`;
    }
  }
  return null;
}
