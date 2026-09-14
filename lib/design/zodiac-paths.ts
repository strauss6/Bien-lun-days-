/**
 * Les douze glyphes du zodiaque, en polylignes.
 *
 * Règle qui unifie la série et qui est vérifiable : **aucune courbe de Bézier**.
 * Chaque glyphe est fait de segments droits, sur la même grille de 24×24, avec la
 * même épaisseur de trait. C'est ce qui leur donne l'air calculés plutôt que
 * dessinés, et c'est testé — un `C`, `Q`, `S` ou `A` dans un tracé est un bug.
 *
 * Zone utile 4 → 20. Le trait est porté par le composant, pas par les tracés,
 * afin qu'il reste constant à toutes les échelles.
 */

export const ZODIAC_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

export type ZodiacKey = (typeof ZODIAC_ORDER)[number];

export const ZODIAC_LABELS: Record<ZodiacKey, string> = {
  aries: 'Bélier', taurus: 'Taureau', gemini: 'Gémeaux', cancer: 'Cancer',
  leo: 'Lion', virgo: 'Vierge', libra: 'Balance', scorpio: 'Scorpion',
  sagittarius: 'Sagittaire', capricorn: 'Capricorne', aquarius: 'Verseau', pisces: 'Poissons',
};

/** Polygone régulier, en polyligne fermée — aucun arc. */
function polygon(cx: number, cy: number, r: number, sides = 14, phase = -Math.PI / 2): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = phase + (i / sides) * Math.PI * 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** Arc facetté : une portion de cercle rendue en segments droits. */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number, steps = 7): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')}`;
}

export const ZODIAC_PATHS: Record<ZodiacKey, string[]> = {
  // Cornes du bélier : hampe centrale, deux volutes symétriques.
  aries: [
    'M12 19.4 V10.6',
    'M12 10.6 L10.9 8.6 L9.1 7.2 L6.9 6.85 L5.15 7.9 L4.3 9.95 L4.45 12.25 L5.4 14.1',
    'M12 10.6 L13.1 8.6 L14.9 7.2 L17.1 6.85 L18.85 7.9 L19.7 9.95 L19.55 12.25 L18.6 14.1',
  ],
  // Tête et cornes du taureau : cercle facetté surmonté d'un croissant ouvert.
  taurus: [
    polygon(12, 15.1, 4.6),
    arc(12, 10.9, 5.2, 190, 350),
  ],
  // Les deux jumeaux : deux fûts, deux traverses légèrement bombées.
  gemini: [
    'M9.4 5.6 V18.4',
    'M14.6 5.6 V18.4',
    'M6.6 6.6 L9.4 5.6 L12 5.2 L14.6 5.6 L17.4 6.6',
    'M6.6 17.4 L9.4 18.4 L12 18.8 L14.6 18.4 L17.4 17.4',
  ],
  // Les pinces du cancer : deux traits parallèles refermés chacun sur une boucle.
  cancer: [
    polygon(7.4, 8.4, 1.9, 10),
    'M9.3 8.1 L12 7.2 L14.8 6.7 L17.6 6.5 L19.4 6.9',
    polygon(16.6, 15.6, 1.9, 10),
    'M14.7 15.9 L12 16.8 L9.2 17.3 L6.4 17.5 L4.6 17.1',
  ],
  // La crinière du lion : disque et queue qui remonte en volute.
  leo: [
    polygon(8.8, 15.3, 3.3, 12),
    'M11.5 13.3 L12.5 10.6 L13.3 8.2 L14.9 6.7 L16.9 6.8 L18.2 8.3 L18 10.4 L16.6 11.7 L15.1 11.4',
  ],
  // Le M de la vierge, dont la dernière jambe se referme et se barre.
  virgo: [
    'M5.6 7.2 V16.8',
    'M5.6 7.2 L8 8.6 L10.2 7.2 V16.8',
    'M10.2 7.2 L12.6 8.6 L14.8 7.2 V15.4',
    'M14.8 15.4 L16.4 16.9 L18.3 15.9 L18.9 13.7 L18 12',
    'M13.4 17.8 L19.4 12.2',
  ],
  // La balance : socle, fléau, et son arc.
  libra: [
    'M4.8 17.4 H19.2',
    'M6.4 13.2 H17.6',
    arc(12, 13.2, 5.6, 180, 360),
  ],
  // Le M du scorpion, dont la dernière jambe part en dard.
  scorpio: [
    'M5.4 7.8 V17',
    'M5.4 7.8 L7.7 9.2 L9.9 7.8 V17',
    'M9.9 7.8 L12.2 9.2 L14.4 7.8 V17',
    'M14.4 17 L19.4 12.4',
    'M16.5 12.1 L19.6 12.3 L19.4 15.4',
  ],
  // La flèche du sagittaire et sa traverse.
  sagittarius: [
    'M5.4 18.6 L18.6 5.4',
    'M13.4 5.4 L18.6 5.4 L18.6 10.6',
    'M8 11.2 L13.2 16.4',
  ],
  // La corne et la queue du capricorne.
  capricorn: [
    'M4.6 8.2 L6.3 6.5 L8.5 6.3 L9.8 7.8 L10.4 10.2 L10.8 13.4 L11 16.8',
    'M11 16.8 L12.7 15.2 L14.7 14.5 L16.5 15.3',
    polygon(15.9, 17.4, 2.3, 11),
  ],
  // Les ondes du verseau — le seul glyphe qui est nativement fait de segments.
  aquarius: [
    'M4.8 10.6 L7.7 8.3 L10.6 11.6 L13.4 8.3 L16.3 11.6 L19.2 9.3',
    'M4.8 15.4 L7.7 13.1 L10.6 16.4 L13.4 13.1 L16.3 16.4 L19.2 14.1',
  ],
  // Les deux poissons liés.
  pisces: [
    arc(11.4, 12, 6.2, 152, 208).replace('M', 'M'),
    arc(12.6, 12, 6.2, -28, 28),
    'M5.6 12 H18.4',
  ],
};

/** Épaisseur commune. Portée par le composant pour rester constante à toute échelle. */
export const ZODIAC_STROKE = 1.25;
export const ZODIAC_VIEWBOX = '0 0 24 24';
