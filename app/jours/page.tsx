import { redirect } from 'next/navigation';

/**
 * Ancienne adresse des trente jours.
 *
 * La vue existe toujours, elle s'appelle `/mois` depuis que le produit s'ouvre
 * sur la journée. Le renvoi est gardé pour que les liens déjà partagés ne
 * tombent pas dans le vide.
 */
export default function JoursPage() {
  redirect('/mois');
}
