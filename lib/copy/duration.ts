/**
 * Une durée en clair.
 *
 * Un nombre de jours ne se ressent pas : « 1 955 jours » ne dit rien, « cinq ans
 * et quatre mois » dit tout. C'est cette traduction qui fait comprendre qu'un
 * transit de Pluton n'est pas un événement mais une saison de la vie, et qu'une
 * fenêtre de trente-neuf jours n'est pas un coup de mou mais six semaines.
 *
 * Partagée entre les jours rares et le trimestre. Elle vivait dans l'écran des
 * jours rares ; deux exemplaires auraient fini par arrondir différemment, et
 * l'un des deux écrans aurait menti sur la même plage.
 */
export function duree(jours: number): string {
  if (jours < 14) return `${jours} jours`;
  if (jours < 60) return `${Math.round(jours / 7)} semaines`;
  if (jours < 400) return `${Math.round(jours / 30.44)} mois`;
  const ans = Math.floor(jours / 365.25);
  const mois = Math.round((jours - ans * 365.25) / 30.44);
  if (mois === 0) return ans === 1 ? 'un an' : `${ans} ans`;
  return `${ans === 1 ? 'un an' : `${ans} ans`} et ${mois} mois`;
}

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 1er septembre », jamais « 1 septembre » : seul le premier du mois est ordinal. */
export function jourMois(iso: string): string {
  const jour = Number(iso.slice(8, 10));
  return `${jour === 1 ? '1er' : jour} ${MOIS[Number(iso.slice(5, 7)) - 1]}`;
}

export function jourComplet(iso: string): string {
  return `${jourMois(iso)} ${iso.slice(0, 4)}`;
}

/** « du 12 au 27 novembre 2026 » — l'année une seule fois quand elle ne change pas. */
export function plage(start: string, end: string): string {
  return start.slice(0, 4) === end.slice(0, 4)
    ? `du ${jourMois(start)} au ${jourComplet(end)}`
    : `du ${jourComplet(start)} au ${jourComplet(end)}`;
}

/**
 * La même plage, sans l'année quand elle ne change pas.
 *
 * Sur un écran qui annonce déjà son trimestre en tête, répéter « 2026 » à chaque
 * ligne coûte deux lignes de rendu sur un téléphone — la date passait à la ligne
 * en laissant l'année orpheline. L'année reste quand la plage traverse le nouvel
 * an, seul cas où elle porte une information.
 */
export function plageCourte(start: string, end: string): string {
  return start.slice(0, 4) === end.slice(0, 4)
    ? `du ${jourMois(start)} au ${jourMois(end)}`
    : `du ${jourComplet(start)} au ${jourComplet(end)}`;
}
