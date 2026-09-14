'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RESULT_STORAGE_KEY } from './steps';
import type { ReadingPayload } from '@/lib/api/reading';

/**
 * Le rapport calculé, gardé le temps de la session.
 *
 * Sans rapport en mémoire, on renvoie au quiz : arriver sur `/jours` par une URL
 * collée ne doit pas produire un écran vide.
 */
export function useStoredReading(): ReadingPayload | null {
  const router = useRouter();
  const [payload, setPayload] = useState<ReadingPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
      if (raw) setPayload(JSON.parse(raw));
      else router.replace('/quiz');
    } catch {
      router.replace('/quiz');
    }
  }, [router]);

  return payload;
}
