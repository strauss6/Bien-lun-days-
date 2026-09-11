'use client';

import Link from 'next/link';
import { TodayScreen } from '@/components/screens/TodayScreen';
import { AppHeader } from '@/components/app/AppHeader';
import { useReading } from '@/lib/profile/useReading';

/**
 * L'entrée du produit.
 *
 * Elle ouvre **toujours** sur aujourd'hui. Peu importe qu'on ait exploré le mois
 * la dernière fois : une nouvelle visite ramène au rendez-vous du jour, pas là
 * où l'on s'était arrêté.
 */
export default function Home() {
  const state = useReading();

  if (state.status === 'sans-profil') return <Bienvenue />;
  if (state.status === 'erreur') return <Panne message={state.message} />;
  if (state.status !== 'prêt') return <Attente calculating={state.status === 'calcul'} />;

  return <TodayScreen payload={state.payload} />;
}

/** Première visite : une promesse, une porte. Rien à déverrouiller. */
function Bienvenue() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pb-10 pt-6">
      <AppHeader />
      <div className="flex flex-1 flex-col justify-center py-12">
        <h1 className="technical text-[26px] font-semibold leading-tight tracking-[-0.02em]">
          Tes journées ne se valent pas.
        </h1>
        <p className="reading mt-4 opacity-70">
          Calculé sur l’heure et la ville exactes de ta naissance. Pas sur ton signe.
        </p>
        <Link
          href="/quiz"
          className="technical mt-9 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 text-[14px] font-semibold text-paper no-underline"
        >
          Commencer
        </Link>
      </div>
      <footer className="reading text-[15px] leading-relaxed opacity-50">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion
        personnelle.
      </footer>
    </main>
  );
}

/**
 * L'attente.
 *
 * Elle dure ce que dure le calcul, et pas une seconde de plus : aucune fausse
 * progression, aucun pourcentage inventé. Le détail du travail réellement
 * effectué est sur l'écran de calcul de la première visite ; ici, au retour
 * quotidien, il n'y a rien à raconter.
 */
function Attente({ calculating }: { calculating: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pt-6" aria-busy="true">
      <AppHeader />
      {calculating ? (
        <p className="technical mt-10 text-[12px] opacity-45">Calcul de ta journée…</p>
      ) : null}
    </main>
  );
}

function Panne({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pt-6">
      <AppHeader />
      <div className="surface mt-8 p-6">
        <p className="technical text-[12px] font-semibold tracking-[0.06em]">CALCUL INDISPONIBLE</p>
        <p className="reading mt-3 opacity-75">{message}</p>
        <p className="reading mt-3 text-[15px] opacity-55">
          Rien n’est perdu : tes données sont enregistrées sur cet appareil. Réessaie dans un
          moment.
        </p>
        <Link
          href="/profil"
          className="technical mt-5 inline-flex min-h-11 items-center text-[11px] underline underline-offset-4 opacity-60"
        >
          Vérifier mes données de naissance
        </Link>
      </div>
    </main>
  );
}
