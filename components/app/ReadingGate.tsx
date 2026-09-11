'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app/AppHeader';
import { useReading } from '@/lib/profile/useReading';
import type { ReadingPayload } from '@/lib/api/reading';

/**
 * Garde d'entrée des vues secondaires.
 *
 * Elles lisent le rapport du jour, jamais le leur. Sans profil, on renvoie au
 * questionnaire plutôt que d'afficher un écran vide ; sans rapport, on affiche
 * l'attente réelle du calcul. Aucune de ces vues ne montre d'exemple de
 * démonstration à la place d'un résultat personnel.
 */
export function ReadingGate({ children }: { children: (payload: ReadingPayload) => React.ReactNode }) {
  const router = useRouter();
  const state = useReading();

  useEffect(() => {
    if (state.status === 'sans-profil') router.replace('/');
  }, [state.status, router]);

  if (state.status === 'prêt') return <>{children(state.payload)}</>;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pt-6" aria-busy={state.status !== 'erreur'}>
      <AppHeader />
      {state.status === 'erreur' ? (
        <div className="surface mt-8 p-6">
          <p className="technical text-[12px] font-semibold tracking-[0.06em]">CALCUL INDISPONIBLE</p>
          <p className="reading mt-3 opacity-75">{state.message}</p>
        </div>
      ) : state.status === 'calcul' ? (
        <p className="technical mt-10 text-[12px] opacity-45">Calcul de tes trente jours…</p>
      ) : null}
    </main>
  );
}
