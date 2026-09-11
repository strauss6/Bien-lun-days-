import { computeNatalChart } from '../natal';
import { resolveBirthInstant } from '../time';
import type { BirthInput } from '../types';

/**
 * Thème de référence du projet.
 *
 * Il sert de socle à tous les tests parce qu'il a été relu, indépendamment du
 * moteur, par un astrologue professionnel : Pluton sur l'Ascendant, Saturne en
 * trigone au Soleil, Jupiter en conjonction au Soleil, maître du thème Uranus,
 * maison XI gouvernée par Jupiter. Chacun de ces points est vérifié quelque part
 * dans la suite de tests.
 *
 * L'heure retenue est 20h40 et non 20h50 : la lecture de référence situe la
 * maison X au dernier degré du Scorpion et note qu'« quatre minutes plus tard »
 * elle serait en Sagittaire, ce qui ne peut correspondre qu'à 20h40. L'acte de
 * naissance reste la seule pièce qui trancherait définitivement.
 */
export const REFERENCE_BIRTH: BirthInput = {
  date: '1993-08-06',
  time: '20:40',
  lat: 48.8352,
  lng: 2.2409,
};

/** Fuseau de résidence utilisé par les tests de scoring. */
export const REFERENCE_ZONE = 'Europe/Paris';

export const referenceChart = () =>
  computeNatalChart(resolveBirthInstant(REFERENCE_BIRTH), REFERENCE_BIRTH.lat, REFERENCE_BIRTH.lng);
