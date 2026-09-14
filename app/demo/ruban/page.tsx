import { RibbonDemo } from './RibbonDemo';
import { ReadingRequest, buildReading } from '@/lib/api/reading';

/**
 * Page de démonstration du ruban, alimentée par un vrai calcul.
 *
 * Elle sert de cible aux captures de conformité : le composant y est isolé du
 * reste du produit, avec des données réelles et non un jeu d'essai.
 */
export const dynamic = 'force-static';

export default function RibbonDemoPage() {
  const payload = buildReading(ReadingRequest.parse({
    firstName: 'Elioth',
    birthDate: '1993-08-06',
    birthTime: '20:40',
    timeKnown: true,
    lat: 48.8352,
    lng: 2.2409,
    city: 'Boulogne-Billancourt',
    country: 'FR',
    priorityAxis: 'business',
    startDate: '2026-09-10',
  }));

  return <RibbonDemo payload={payload} />;
}
