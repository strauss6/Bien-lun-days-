/**
 * Exonymes français.
 *
 * La base GeoNames nomme chaque ville par son nom local ou anglais, sans
 * cohérence : Genève et Montréal y sont en français, Brussels et London non. Un
 * utilisateur français tape « Bruxelles ». Cette table donne le nom français,
 * qui devient le nom affiché, et le nom d'origine reste cherchable.
 *
 * Chaque entrée est vérifiée à la construction de l'index : un alias qui ne
 * correspond à aucune ville fait échouer le script plutôt que de disparaître en
 * silence. Ce garde-fou a déjà servi — Munich, Milan, Turin, Florence, Naples et
 * Fès portent déjà leur nom français dans la base et n'ont besoin d'aucun alias.
 */
export const FRENCH_EXONYMS: Array<{ french: string; name: string; country: string }> = [
  { french: 'Bruxelles', name: 'Brussels', country: 'BE' },
  { french: 'Anvers', name: 'Antwerpen', country: 'BE' },
  { french: 'Gand', name: 'Gent', country: 'BE' },
  { french: 'Bruges', name: 'Brugge', country: 'BE' },
  { french: 'Louvain', name: 'Leuven', country: 'BE' },
  { french: 'Malines', name: 'Mechelen', country: 'BE' },
  { french: 'Ostende', name: 'Ostend', country: 'BE' },
  { french: 'Bâle', name: 'Basel', country: 'CH' },
  { french: 'Berne', name: 'Bern', country: 'CH' },
  { french: 'Zurich', name: 'Zürich', country: 'CH' },
  { french: 'Lucerne', name: 'Luzern', country: 'CH' },
  { french: 'Londres', name: 'London', country: 'GB' },
  { french: 'Édimbourg', name: 'Edinburgh', country: 'GB' },
  { french: 'Cantorbéry', name: 'Canterbury', country: 'GB' },
  { french: 'Cologne', name: 'Köln', country: 'DE' },
  { french: 'Francfort', name: 'Frankfurt am Main', country: 'DE' },
  { french: 'Hambourg', name: 'Hamburg', country: 'DE' },
  { french: 'Nuremberg', name: 'Nürnberg', country: 'DE' },
  { french: 'Aix-la-Chapelle', name: 'Aachen', country: 'DE' },
  { french: 'Venise', name: 'Venice', country: 'IT' },
  { french: 'Gênes', name: 'Genoa', country: 'IT' },
  { french: 'Séville', name: 'Sevilla', country: 'ES' },
  { french: 'Saragosse', name: 'Zaragoza', country: 'ES' },
  { french: 'Cordoue', name: 'Córdoba', country: 'ES' },
  { french: 'Lisbonne', name: 'Lisbon', country: 'PT' },
  { french: 'La Haye', name: 'The Hague', country: 'NL' },
  { french: 'Copenhague', name: 'Copenhagen', country: 'DK' },
  { french: 'Vienne', name: 'Vienna', country: 'AT' },
  { french: 'Varsovie', name: 'Warsaw', country: 'PL' },
  { french: 'Cracovie', name: 'Kraków', country: 'PL' },
  { french: 'Bucarest', name: 'Bucharest', country: 'RO' },
  { french: 'Athènes', name: 'Athens', country: 'GR' },
  { french: 'Moscou', name: 'Moscow', country: 'RU' },
  { french: 'Saint-Pétersbourg', name: 'Saint Petersburg', country: 'RU' },
  { french: 'Le Caire', name: 'Cairo', country: 'EG' },
  { french: 'Alger', name: 'Algiers', country: 'DZ' },
  { french: 'Marrakech', name: 'Marrakesh', country: 'MA' },
  { french: 'Tanger', name: 'Tangier', country: 'MA' },
  { french: 'Pékin', name: 'Beijing', country: 'CN' },
  { french: 'Canton', name: 'Guangzhou', country: 'CN' },
  { french: 'Bombay', name: 'Mumbai', country: 'IN' },
  { french: 'Calcutta', name: 'Kolkata', country: 'IN' },
  { french: 'La Nouvelle-Orléans', name: 'New Orleans', country: 'US' },
];
