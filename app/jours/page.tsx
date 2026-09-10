'use client';

import { useRouter } from 'next/navigation';
import { DaysScreen } from '@/components/screens/DaysScreen';
import { useStoredReading } from '@/lib/quiz/useStoredReading';

export default function JoursPage() {
  const router = useRouter();
  const payload = useStoredReading();
  if (!payload) return <main className="min-h-dvh" aria-busy="true" />;
  return <DaysScreen payload={payload} onRare={() => router.push('/rares')} />;
}
