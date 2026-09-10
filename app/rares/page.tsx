'use client';

import { useRouter } from 'next/navigation';
import { RareScreen } from '@/components/screens/RareScreen';
import { useStoredReading } from '@/lib/quiz/useStoredReading';

export default function RaresPage() {
  const router = useRouter();
  const payload = useStoredReading();
  if (!payload) return <main className="min-h-dvh" aria-busy="true" />;
  return <RareScreen payload={payload} onBack={() => router.push('/jours')} />;
}
