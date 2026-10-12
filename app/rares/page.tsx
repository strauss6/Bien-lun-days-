'use client';

import { useRouter } from 'next/navigation';
import { RareScreen } from '@/components/screens/RareScreen';
import { ReadingGate } from '@/components/app/ReadingGate';

/** Les jours rares : une lecture du même rapport, jamais un calcul à part. */
export default function RaresPage() {
  const router = useRouter();
  return (
    <ReadingGate>
      {(payload) => <RareScreen payload={payload} onBack={() => router.push('/mois')} />}
    </ReadingGate>
  );
}
