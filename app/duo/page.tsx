'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DuoScreen } from '@/components/screens/DuoScreen';
import { AppHeader } from '@/components/app/AppHeader';
import { loadProfile } from '@/lib/profile/store';
import type { ReadingInput } from '@/lib/api/reading';

type Me = Omit<ReadingInput, 'startDate' | 'days'>;

/**
 * La comparaison n'a pas besoin du rapport de trente jours, seulement des deux
 * thèmes. Elle lit donc le profil directement, sans passer par `ReadingGate` —
 * inutile d'attendre un calcul dont l'écran ne se sert pas.
 */
export default function DuoPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [cherche, setCherche] = useState(true);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) router.replace('/');
    else setMe(profile.request as Me);
    setCherche(false);
  }, [router]);

  if (!me) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pt-6" aria-busy={cherche}>
        <AppHeader />
      </main>
    );
  }
  return <DuoScreen me={me} onBack={() => router.push('/')} />;
}
