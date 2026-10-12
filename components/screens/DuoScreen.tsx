'use client';

import { useMemo, useState } from 'react';
import { CityField } from '@/components/quiz/CityField';
import type { City } from '@/lib/cities/search';
import { computeNatalChart } from '@/lib/astro/natal';
import { resolveBirthInstant } from '@/lib/astro/time';
import { computeSynastry, type SynastryLink } from '@/lib/astro/synastry';
import { linkAdvice, linkTitle, tensionNote } from '@/lib/copy/relation';
import { type DuoPerson, forgetDuo, loadDuo, saveDuo } from '@/lib/duo/store';
import type { ReadingInput } from '@/lib/api/reading';

/**
 * La comparaison de deux thèmes.
 *
 * ## Ce que l'écran promet, et rien de plus
 *
 * Le livrable demandé par le rédacteur du corpus : « trois conseils de choses à
 * éviter et trois conseils de choses à faire pour que ça marche bien avec telle
 * ou telle personne. » Pas de note sur dix — il dit qu'une note rate complètement
 * l'intérêt, et il a raison : un chiffre clôt la question au lieu de l'ouvrir.
 * L'écran ne porte donc **aucun grand nombre**, ce qui le met d'office en règle
 * avec le budget de densité.
 *
 * ## Deux données saisies sur cet appareil
 *
 * La seconde personne ne reçoit rien à remplir : on saisit sa date de naissance
 * comme on saisit la sienne. Rien ne part sur le réseau, rien ne passe par
 * l'adresse, et le calcul est celui du reste du produit.
 *
 * ## Ce que l'écran dit quand il ne sait pas
 *
 * Sans l'heure de naissance des deux côtés, l'Ascendant n'est pas exploitable et
 * sort du calcul — donc la comparaison n'est pas la même. C'est écrit à l'endroit
 * où ça compte, sous le résultat, pas dans une note de bas de page.
 */

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const enClair = (iso: string) => {
  const jour = Number(iso.slice(8, 10));
  return `${jour === 1 ? '1er' : jour} ${MOIS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
};

interface DuoScreenProps {
  /** Le thème du lecteur, tel qu'il a été saisi au questionnaire. */
  me: Omit<ReadingInput, 'startDate' | 'days'>;
  onBack: () => void;
  /** Injectable pour la version autonome, qui cherche les villes sans serveur. */
  citySearch?: (query: string) => Promise<City[]>;
}

export function DuoScreen({ me, onBack, citySearch }: DuoScreenProps) {
  const [person, setPerson] = useState<DuoPerson | null>(() => loadDuo());
  return person
    ? <Resultat me={me} person={person} onBack={onBack} onChange={() => { forgetDuo(); setPerson(null); }} />
    : <Formulaire onBack={onBack} citySearch={citySearch} onReady={(p) => { saveDuo(p); setPerson(p); }} />;
}

function Retour({ onBack, libelle }: { onBack: () => void; libelle: string }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="technical -my-3 inline-flex min-h-11 items-center text-[11px] opacity-50 underline underline-offset-4"
    >
      {libelle}
    </button>
  );
}

function Formulaire({
  onReady, onBack, citySearch,
}: { onReady: (p: DuoPerson) => void; onBack: () => void; citySearch?: (q: string) => Promise<City[]> }) {
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [city, setCity] = useState<City | null>(null);

  const complet = firstName.trim().length > 0
    && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)
    && city !== null;

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-14 pt-6">
      <Retour onBack={onBack} libelle="Retour" />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">Vous deux</h1>
      <p className="technical mt-2 text-[11px] leading-relaxed opacity-45">
        Sa date de naissance suffit à commencer. Ces informations restent sur cet appareil.
      </p>

      <form
        className="mt-7 grid gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!complet || !city) return;
          onReady({
            firstName: firstName.trim(),
            birthDate,
            birthTime,
            city,
          });
        }}
      >
        <label className="grid gap-2">
          <span className="technical text-[11px] tracking-[0.08em] opacity-55">SON PRÉNOM</span>
          <input
            id="duo-firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border-b border-ink/15 bg-transparent pb-2 text-[20px] outline-none placeholder:text-ink/25"
            placeholder="Marie"
            autoComplete="off"
          />
        </label>

        <label className="grid gap-2">
          <span className="technical text-[11px] tracking-[0.08em] opacity-55">SA DATE DE NAISSANCE</span>
          <input
            id="duo-birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full border-b border-ink/15 bg-transparent pb-2 text-[20px] outline-none"
          />
        </label>

        <label className="grid gap-2">
          <span className="technical text-[11px] tracking-[0.08em] opacity-55">SON HEURE DE NAISSANCE</span>
          <input
            id="duo-birthTime"
            type="time"
            required
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full border-b border-ink/15 bg-transparent pb-2 text-[20px] outline-none"
          />
          {/*
            Obligatoire des deux côtés. Une comparaison dont un seul thème a son
            heure perd l'Ascendant et le Milieu du Ciel **des deux**, puisque le
            moteur écarte les angles dès qu'il en manque un. Autant le dire à la
            saisie plutôt que sous un résultat déjà amputé.
          */}
          <span className="technical text-[10.5px] leading-relaxed opacity-50">
            Elle est sur sa copie intégrale d’acte de naissance. Sans elle, la comparaison
            perd l’Ascendant des deux côtés.
          </span>
        </label>

        <div className="grid gap-2">
          <span className="technical text-[11px] tracking-[0.08em] opacity-55">SA VILLE DE NAISSANCE</span>
          <CityField value={city} onChange={setCity} search={citySearch} />
        </div>

        <button
          type="submit"
          disabled={!complet}
          className="mt-2 min-h-11 rounded-full bg-ink px-6 py-3.5 text-[13px] font-medium text-paper disabled:opacity-25"
        >
          Comparer les deux thèmes
        </button>
      </form>
    </main>
  );
}

function Liste({ titre, liens, nom }: { titre: string; liens: SynastryLink[]; nom: string }) {
  if (liens.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="technical text-[11px] font-semibold tracking-[0.1em] opacity-55">{titre}</h2>
      <ul className="mt-3 grid gap-3">
        {liens.map((lien) => (
          <li key={`${lien.direction}${lien.actor}${lien.receiver}${lien.aspect}`} className="surface p-5" data-testid="duo-link">
            <p className="technical text-[13px] font-semibold leading-snug">{linkTitle(lien, nom)}</p>
            <p className="reading mt-3 border-t border-ink/8 pt-3 text-[17px] leading-snug">
              {linkAdvice(lien, nom)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Resultat({
  me, person, onBack, onChange,
}: { me: DuoScreenProps['me']; person: DuoPerson; onBack: () => void; onChange: () => void }) {
  const duo = useMemo(() => {
    const mien = computeNatalChart(
      resolveBirthInstant({
        date: me.birthDate,
        time: me.birthTime,
        lat: me.lat,
        lng: me.lng,
      }),
      me.lat,
      me.lng,
    );
    const sien = computeNatalChart(
      resolveBirthInstant({
        date: person.birthDate,
        time: person.birthTime,
        lat: person.city.lat,
        lng: person.city.lng,
      }),
      person.city.lat,
      person.city.lng,
    );
    return computeSynastry(mien, sien);
  }, [me, person]);

  const nom = person.firstName;

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-14 pt-6">
      <Retour onBack={onBack} libelle="Retour" />

      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">
        Toi et {nom}
      </h1>
      <p className="technical mt-2 text-[11px] leading-relaxed opacity-45">
        {enClair(person.birthDate)}
        {person.birthTime ? `, ${person.birthTime}` : ''} · {person.city.name}
      </p>

      <Liste titre="TROIS CHOSES À FAIRE" liens={duo.supports} nom={nom} />
      <Liste titre="TROIS CHOSES À ÉVITER" liens={duo.frictions} nom={nom} />

      {duo.tensions.length > 0 ? (
        <section className="mt-8" data-testid="duo-tension">
          <h2 className="technical text-[11px] font-semibold tracking-[0.1em] opacity-55">
            LE POINT DUR
          </h2>
          {duo.tensions.map((lien) => (
            <p
              key={`${lien.direction}${lien.actor}${lien.receiver}`}
              className="reading mt-3 text-[17px] leading-snug"
            >
              {tensionNote(lien, nom)}
            </p>
          ))}
        </section>
      ) : null}

      {/*
        Une limite qui change un résultat se dit là où elle compte. Sans les deux
        heures de naissance, l'Ascendant et le Milieu du Ciel sortent du calcul :
        ce n'est pas la même comparaison, et le taire serait la vendre pour ce
        qu'elle n'est pas.
      */}
      {!duo.anglesUsed ? (
        <p className="technical mt-8 text-[11px] leading-relaxed opacity-55" data-testid="duo-limite">
          Une heure de naissance manque. Ta façon de te présenter et celle de {nom} — l’Ascendant —
          ne sont pas dans ce calcul : il porte sur les planètes seules.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onChange}
        className="technical mt-8 inline-flex min-h-11 items-center text-[11px] opacity-50 underline underline-offset-4"
      >
        Comparer avec quelqu’un d’autre
      </button>

      <footer className="reading mt-8 text-[15px] leading-relaxed opacity-50">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion
        personnelle.
      </footer>
    </main>
  );
}
