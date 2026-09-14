'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app/AppHeader';
import { forgetAll, loadProfile, type StoredProfile } from '@/lib/profile/store';
import { residentZone } from '@/lib/app/today';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const longDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/**
 * Mes données.
 *
 * Deux choses à y dire honnêtement, et l'écran ne sert qu'à ça.
 *
 * **Où elles vivent.** Sur cet appareil, dans ce navigateur. Il n'y a pas de
 * compte : laisser croire qu'un profil se retrouve sur un autre téléphone serait
 * un mensonge qu'on paierait le jour du changement d'appareil.
 *
 * **Ce qu'une heure inconnue coûte.** Sans heure de naissance, l'Ascendant et le
 * Milieu du Ciel ne sont pas calculables, et l'axe Énergie perd son point le plus
 * lourd. Le produit fonctionne quand même, mais il le dit.
 */
export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StoredProfile | null | undefined>(undefined);
  const [zone, setZone] = useState('');

  useEffect(() => {
    setProfile(loadProfile());
    setZone(residentZone());
  }, []);

  if (profile === undefined) return <main className="min-h-dvh" aria-busy="true" />;

  if (profile === null) {
    return (
      <main className="mx-auto max-w-[520px] px-5 pt-6">
        <AppHeader />
        <p className="reading mt-8 opacity-70">Aucune donnée enregistrée sur cet appareil.</p>
        <Link href="/quiz" className="technical mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[13px] font-semibold text-paper no-underline">
          Commencer
        </Link>
      </main>
    );
  }

  const r = profile.request;

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-14 pt-6">
      <AppHeader
        action={(
          <Link href="/" className="technical inline-flex min-h-11 items-center text-[11px] underline underline-offset-4 opacity-50">
            Aujourd’hui
          </Link>
        )}
      />

      <h1 className="technical mt-7 text-[20px] font-semibold tracking-[-0.01em]">Mes données</h1>

      <dl className="surface technical mt-4 grid px-5 text-[12px]">
        {[
          ['Prénom', r.firstName],
          ['Naissance', longDate(r.birthDate)],
          ['Heure', r.timeKnown ? r.birthTime! : 'Inconnue'],
          ['Ville', `${r.city} (${r.country})`],
          ['Fuseau de résidence', zone],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-[9.5em_1fr] items-baseline gap-x-3 py-3.5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-ink/8">
            <dt className="opacity-45">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {!r.timeKnown ? (
        <p className="reading mt-4 text-[15px] leading-relaxed opacity-70">
          Sans heure de naissance, l’Ascendant et le Milieu du Ciel ne sont pas calculables :
          le calcul part de midi et l’axe Énergie perd son point le plus lourd. Les scores
          restent justes, ils sont simplement moins personnels.
        </p>
      ) : null}

      <p className="reading mt-6 text-[15px] leading-relaxed opacity-60">
        Ces données sont enregistrées <strong className="font-medium">sur cet appareil</strong>,
        dans ce navigateur. Il n’y a pas de compte : sur un autre téléphone, il faudra les
        saisir à nouveau.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/quiz"
          className="technical inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[13px] font-semibold text-paper no-underline"
        >
          Corriger mes données
        </Link>
        <button
          type="button"
          className="technical min-h-11 text-[11px] underline underline-offset-4 opacity-50"
          onClick={() => {
            forgetAll();
            router.replace('/');
          }}
        >
          Tout effacer de cet appareil
        </button>
      </div>
    </main>
  );
}
