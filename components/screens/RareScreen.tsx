'use client';

import type { RarePayload, ReadingPayload } from '@/lib/api/reading';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** « 1er septembre », jamais « 1 septembre » : seul le premier du mois est ordinal. */
const jourMois = (iso: string) => {
  const jour = Number(iso.slice(8, 10));
  return `${jour === 1 ? '1er' : jour} ${MOIS[Number(iso.slice(5, 7)) - 1]}`;
};
const jourComplet = (iso: string) => `${jourMois(iso)} ${iso.slice(0, 4)}`;

/**
 * Durée en clair.
 *
 * Un nombre de jours ne se ressent pas : « 1 955 jours » ne dit rien, « cinq ans
 * et quatre mois » dit tout. C'est cette durée qui fait comprendre qu'un transit
 * de Pluton n'est pas un événement mais une saison de la vie.
 */
function duree(jours: number): string {
  if (jours < 14) return `${jours} jours`;
  if (jours < 60) return `${Math.round(jours / 7)} semaines`;
  if (jours < 400) return `${Math.round(jours / 30.44)} mois`;
  const ans = Math.floor(jours / 365.25);
  const mois = Math.round((jours - ans * 365.25) / 30.44);
  if (mois === 0) return ans === 1 ? 'un an' : `${ans} ans`;
  return `${ans === 1 ? 'un an' : `${ans} ans`} et ${mois} mois`;
}

/** Une même date de début et de fin dans l'année : on ne répète pas l'année. */
function plage(start: string, end: string): string {
  return start.slice(0, 4) === end.slice(0, 4)
    ? `du ${jourMois(start)} au ${jourComplet(end)}`
    : `du ${jourComplet(start)} au ${jourComplet(end)}`;
}

/**
 * Les jours rares.
 *
 * L'écran où le produit dit ce qu'aucun horoscope ne dit. Quatre informations,
 * dans cet ordre, parce que c'est l'ordre dans lequel on se les pose.
 *
 * **Quand.** Un aspect n'est pas un instant, c'est une plage : Pluton met cinq
 * ans à traverser l'orbe d'un point natal, Jupiter quelques semaines. Cette
 * durée est l'information principale — elle dit si on a le temps de voir venir.
 * L'écran annonçait auparavant « actif sur toute la période », ce qui ne voulait
 * rien dire pour qui n'avait pas écrit le code.
 *
 * **Quoi.** Ce que le transit signifie, composé à partir des briques du corpus.
 *
 * **À quelle cadence.** « Une fois tous les vingt-neuf ans » : c'est ce chiffre
 * qui donne son sens au mot « rare », et il ne doit disparaître d'aucune carte.
 *
 * **Déjà vécu ?** La dernière fois, traduite en âge. C'est la donnée qui vend le
 * produit, et c'est aussi celle qu'on ne fabrique jamais.
 *
 * **Et après ?** La prochaine occurrence, uniquement si elle a été calculée.
 *
 * **On ne dit jamais plus que ce qui a été calculé.** Trois formulations, trois
 * faits différents : « jamais depuis ta naissance » dit que le balayage a couvert
 * la vie de la personne sans rien trouver — pas que cela n'est jamais arrivé ;
 * une borne atteinte par la limite du balayage n'est pas annoncée comme une date ;
 * et une prochaine occurrence hors de portée n'est pas annoncée du tout.
 */
export function RareScreen({ payload, onBack }: { payload: ReadingPayload; onBack: () => void }) {
  // Les plus rares d'abord, et parmi elles celles qui ont une histoire à raconter.
  const rare = [...payload.rare].sort((a, b) => {
    const histoire = (r: RarePayload) => (r.previousAge !== null ? 0 : r.firstInLifetime ? 1 : 2);
    return histoire(a) - histoire(b);
  }).slice(0, 6);

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-14 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="technical -my-3 inline-flex min-h-11 items-center text-[11px] opacity-50 underline underline-offset-4"
      >
        Retour aux trente jours
      </button>

      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">
        Les jours rares
      </h1>
      <p className="technical mt-2 text-[11px] leading-relaxed opacity-45">
        Les planètes lentes. Elles ne passent que quelques fois dans une vie, et elles restent
        des mois.
      </p>

      {rare.length === 0 ? (
        <p className="reading mt-6">
          Aucun aspect rare sur ces trente jours. C’est une information, pas un manque : les
          planètes lentes ne passent que quelques fois dans une vie, et il n’y en a aucune sur
          la période étudiée.
        </p>
      ) : null}

      <ul className="mt-6 grid gap-3">
        {rare.map((event) => (
          <li key={event.notation + event.orb} className="surface p-5" data-testid="rare-event">
            <p className="technical text-[13px] font-semibold leading-snug">{event.phrase}</p>

            {/* Quand : la plage, sa durée, et le jour où c'est le plus net. */}
            {event.span ? (
              <p className="technical mt-2 text-[10.5px] leading-relaxed tracking-[0.02em] opacity-55">
                {event.span.openStart || event.span.openEnd
                  ? `Au plus près le ${jourComplet(event.span.peak)} · en cours`
                  : `${plage(event.span.start, event.span.end)}`}
                <span className="opacity-70"> · {duree(event.span.days)}</span>
                {!event.span.openStart && !event.span.openEnd ? (
                  <><br />Au plus près le {jourComplet(event.span.peak)}, à {event.span.peakOrb}</>
                ) : null}
              </p>
            ) : null}

            {/* Quoi : le sens, composé depuis les briques du corpus. */}
            <p className="reading mt-3.5 border-t border-ink/8 pt-3.5 text-[17px] leading-snug">
              {event.meaning}
            </p>

            {/* À quelle cadence, déjà vécu ? et après ? */}
            <p className="technical mt-3.5 text-[11px] leading-relaxed opacity-60">
              <span className="opacity-75">
                {event.recurrence.charAt(0).toUpperCase() + event.recurrence.slice(1)}.
              </span>{' '}
              {event.previousAge !== null ? (
                <>
                  La dernière fois, tu avais{' '}
                  <strong className="font-semibold opacity-100">{event.previousAge} ans</strong>
                  {event.previousDate ? ` — ${event.previousDate.slice(0, 4)}` : ''}.
                </>
              ) : event.firstInLifetime ? (
                <>Jamais depuis ta naissance.</>
              ) : (
                <>Aucune occurrence antérieure trouvée sur la période balayée.</>
              )}
              {event.nextYear ? (
                <>
                  {' '}La prochaine en{' '}
                  <strong className="font-semibold opacity-100">{event.nextYear}</strong>
                  {event.nextAge !== null ? `, tu auras ${event.nextAge} ans` : ''}.
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>

      <footer className="reading mt-10 text-[15px] leading-relaxed opacity-50">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion
        personnelle.
      </footer>
    </main>
  );
}
