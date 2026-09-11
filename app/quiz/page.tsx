'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QuizFlow } from '@/components/screens/QuizFlow';
import { DRAFT_STORAGE_KEY, draftFromRequest, type QuizDraft } from '@/lib/quiz/steps';
import { loadProfile } from '@/lib/profile/store';
import type { ReadingInput } from '@/lib/api/reading';

/**
 * Le questionnaire.
 *
 * Première visite, il part vide. Venu de « Corriger mes données », il part
 * rempli : changer une heure de naissance ne doit pas obliger à ressaisir une
 * ville et un prénom.
 */
export default function QuizPage() {
  const router = useRouter();
  // Le formulaire est monté tout de suite, vide, et se remplit quand le
  // stockage local a répondu : un écran blanc en attendant serait pire que le
  // remplissage différé, et il n'y a rien à saisir dans cet intervalle.
  const [initial, setInitial] = useState<QuizDraft | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) setInitial(draftFromRequest(profile.request as ReadingInput));
  }, []);

  return (
    <QuizFlow
      initial={initial ?? null}
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
