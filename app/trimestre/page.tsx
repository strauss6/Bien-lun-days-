'use client';

import { useRouter } from 'next/navigation';
import { QuarterScreen } from '@/components/screens/QuarterScreen';
import { ReadingGate } from '@/components/app/ReadingGate';

/** Le trimestre : une lecture du même rapport, jamais un second calcul. */
export default function TrimestrePage() {
  const router = useRouter();
  return (
    <ReadingGate>
      {(payload) => <QuarterScreen payload={payload} onBack={() => router.push('/mois')} />}
    </ReadingGate>
  );
}
