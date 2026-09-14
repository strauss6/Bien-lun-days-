'use client';

import type { ReadingPayload } from '@/lib/api/reading';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const longDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/**
 * Les jours rares.
 *
 * Uniquement les transits classés rares ou au-dessus. La donnée qui vend le
 * produit est ici : la dernière fois que c'est arrivé, traduite en âge.
 *
 * **On ne fabrique jamais de rareté**, et on ne dit jamais plus que ce qui a été
 * calculé. Trois formulations, trois faits différents, à ne pas confondre :
 *
 * — « Jamais depuis ta naissance » : le balayage a couvert la vie de la personne
 *   et n'a rien trouvé. Ce n'est pas « cela n'est jamais arrivé » dans l'absolu,
 *   et l'écran ne le dit pas.
 * — « La dernière fois, tu avais X ans » : une occurrence a été trouvée et datée.
 * — Une prochaine occurrence n'est annoncée que si elle a été **calculée**. Hors
 *   de la portée du balayage, on se tait plutôt que d'extrapoler.
 */
export function RareScreen({ payload, onBack }: { payload: ReadingPayload; onBack: () => void }) {
  // Les plus rares d'abord, et parmi elles celles qui ont une histoire à raconter.
  const rare = [...payload.rare].sort((a, b) => {
    const story = (r: typeof a) => (r.previousAge !== null ? 0 : r.firstInLifetime ? 1 : 2);
    return story(a) - story(b);
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
            <p className="technical mt-1.5 text-[10.5px] tracking-[0.04em] opacity-50">
              {event.exactDate ? `Exact le ${longDate(event.exactDate)}` : 'Actif sur toute la période'}
              {' · '}
              {event.recurrence}
            </p>

            <p className="reading mt-3 text-[17px] leading-snug">
              {event.previousAge !== null ? (
                <>
                  La dernière fois, tu avais <strong className="font-medium">{event.previousAge} ans</strong>
                  {event.previousDate ? ` — ${event.previousDate.slice(0, 4)}` : ''}.
                  {event.nextYear ? <> La prochaine, en <strong className="font-medium">{event.nextYear}</strong>.</> : null}
                </>
              ) : event.firstInLifetime ? (
                <>
                  Jamais depuis ta naissance.
                  {event.nextYear ? <> La prochaine, en <strong className="font-medium">{event.nextYear}</strong>.</> : null}
                </>
              ) : (
                /* Ni date antérieure, ni balayage concluant : on le dit tel quel. */
                <>Aucune occurrence antérieure trouvée sur la période balayée.</>
              )}
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
