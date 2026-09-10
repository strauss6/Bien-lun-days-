'use client';

import { useRouter } from 'next/navigation';
import { QuizFlow } from '@/components/screens/QuizFlow';
import { DRAFT_STORAGE_KEY } from '@/lib/quiz/steps';
import type { ReadingInput } from '@/lib/api/reading';

/** Enrobage : le quiz vit dans un composant partagé avec la version autonome. */
export default function QuizPage() {
  const router = useRouter();

  return (
    <QuizFlow
      onComplete={(request: ReadingInput) => {
        try {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(request));
        } catch {
          /* navigation privée : l'écran suivant redemandera */
        }
        router.push('/calcul');
      }}
    />
  );
}
