'use client';

import { useRouter } from 'next/navigation';
import { DaysScreen } from '@/components/screens/DaysScreen';
import { ReadingGate } from '@/components/app/ReadingGate';

/**
 * Le mois — trente jours glissants.
 *
 * Vue secondaire et pleinement accessible : rien n'y est verrouillé, rien n'y
 * est flouté. Elle lit le rapport déjà calculé pour aujourd'hui, donc elle ne
 * relance aucun calcul et ne peut pas donner un autre score à une même date.
 */
export default function MoisPage() {
  const router = useRouter();
  return (
    <ReadingGate>
      {(payload) => <DaysScreen payload={payload} onRare={() => router.push('/rares')} />}
    </ReadingGate>
  );
}
