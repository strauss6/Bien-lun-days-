import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { TodayScreen } from '@/components/screens/TodayScreen';
import { DaysScreen } from '@/components/screens/DaysScreen';
import { RareScreen } from '@/components/screens/RareScreen';
import { QuizFlow } from '@/components/screens/QuizFlow';
import { ReadingGate } from '@/components/app/ReadingGate';
import { AppHeader } from '@/components/app/AppHeader';
import { buildReading, ReadingRequest, type ReadingInput, type ReadingPayload } from '@/lib/api/reading';
import { searchCities } from '@/lib/cities/search';
import { setReadingSource, useReading } from '@/lib/profile/useReading';
import { saveProfile, saveReading, loadProfile } from '@/lib/profile/store';
import { residentZone } from '@/lib/app/today';
import { draftFromRequest, type QuizDraft } from '@/lib/quiz/steps';
import Link, { usePath, useRouter } from './router';

/**
 * La page autonome, pour essayer le produit sur un téléphone sans rien déployer.
 *
 * Tout tourne dans le navigateur : éphémérides, index de villes et fuseaux,
 * étalonnage, scoring, jours rares. Aucun appel réseau, donc aucun élément du
 * calcul n'est simulé — c'est le même moteur et les **mêmes écrans** que la
 * version servie, à une seule couture près : la source de calcul, remplacée ici
 * par un appel local.
 */

setReadingSource(async (request, today, zone) => {
  // Le calcul est synchrone et lourd — un étalonnage de 780 jours au premier
  // appel. On rend la main au navigateur pour qu'il peigne l'écran d'attente
  // avant de le bloquer, sinon la page reste blanche une demi-seconde.
  await new Promise((r) => setTimeout(r, 30));
  return buildReading(ReadingRequest.parse({ ...request, startDate: today, zone }));
});

function Quiz() {
  const router = useRouter();
  const [initial, setInitial] = useState<QuizDraft | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) setInitial(draftFromRequest(profile.request as ReadingInput));
  }, []);

  return (
    <QuizFlow
      initial={initial}
      search={async (q) => searchCities(q)}
      onComplete={(request: ReadingInput) => {
        const zone = request.zone ?? residentZone();
        const payload: ReadingPayload = buildReading(ReadingRequest.parse(request));
        const { startDate, days, ...profil } = request;
        void days;
        saveProfile(profil, zone);
        saveReading(payload, startDate, zone);
        router.replace('/');
      }}
    />
  );
}

/** Mes données, en version autonome : même contenu, sans la route Next. */
function Profil() {
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile>>(null);
  useEffect(() => setProfile(loadProfile()), []);
  const r = profile?.request;

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
      {r ? (
        <>
          <dl className="surface technical mt-4 grid px-5 text-[12px]">
            {[
              ['Prénom', r.firstName],
              ['Naissance', r.birthDate],
              ['Heure', r.timeKnown ? r.birthTime! : 'Inconnue'],
              ['Ville', `${r.city} (${r.country})`],
              ['Fuseau de résidence', residentZone()],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[9.5em_1fr] items-baseline gap-x-3 py-3.5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-ink/8">
                <dt className="opacity-45">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="reading mt-6 text-[15px] leading-relaxed opacity-60">
            Ces données sont enregistrées <strong className="font-medium">sur cet appareil</strong>,
            dans ce navigateur. Il n’y a pas de compte : sur un autre téléphone, il faudra les
            saisir à nouveau.
          </p>
        </>
      ) : (
        <p className="reading mt-8 opacity-70">Aucune donnée enregistrée sur cet appareil.</p>
      )}
      <Link
        href="/quiz"
        className="technical mt-8 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[13px] font-semibold text-paper no-underline"
      >
        {r ? 'Corriger mes données' : 'Commencer'}
      </Link>
    </main>
  );
}

/** L'accueil : aujourd'hui si un profil existe, la porte d'entrée sinon. */
function Accueil() {
  const state = useReading();

  if (state.status === 'sans-profil') {
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

  if (state.status === 'prêt') return <TodayScreen payload={state.payload} />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pt-6" aria-busy="true">
      <AppHeader />
      {state.status === 'erreur' ? (
        <div className="surface mt-8 p-6">
          <p className="technical text-[12px] font-semibold tracking-[0.06em]">CALCUL INDISPONIBLE</p>
          <p className="reading mt-3 opacity-75">{state.message}</p>
        </div>
      ) : (
        <p className="technical mt-10 text-[12px] opacity-45">Calcul de ta journée…</p>
      )}
    </main>
  );
}

function App() {
  const path = usePath();
  const router = useRouter();

  if (path === '/quiz') return <Quiz />;
  if (path === '/profil') return <Profil />;
  if (path === '/mois') {
    return (
      <ReadingGate>
        {(payload) => <DaysScreen payload={payload} onRare={() => router.push('/rares')} />}
      </ReadingGate>
    );
  }
  if (path === '/rares') {
    return (
      <ReadingGate>
        {(payload) => <RareScreen payload={payload} onBack={() => router.push('/mois')} />}
      </ReadingGate>
    );
  }
  return <Accueil />;
}

createRoot(document.getElementById('app')!).render(<App />);
