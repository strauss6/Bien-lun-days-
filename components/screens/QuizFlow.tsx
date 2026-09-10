'use client';

import { useEffect, useRef, useState } from 'react';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { CityField } from '@/components/quiz/CityField';
import {
  AXIS_CHOICES, QUIZ_STEPS, blankDraft, isStepComplete, toReadingRequest,
} from '@/lib/quiz/steps';
import type { QuizDraft } from '@/lib/quiz/steps';
import type { City } from '@/lib/cities/search';
import type { ReadingInput } from '@/lib/api/reading';

/**
 * Le quiz : une question par écran, transition immédiate.
 *
 * L'avancement passe par la graduation du ruban, pas par une barre de progression :
 * elle appartient au produit, et elle prépare l'œil à l'objet qu'il verra ensuite.
 */
interface Props {
  onComplete: (request: ReadingInput) => void;
  /** Injectable : la version autonome cherche dans l'index embarqué, sans serveur. */
  search?: (query: string) => Promise<City[]>;
}

export function QuizFlow({ onComplete, search }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<QuizDraft>(blankDraft);
  const field = useRef<HTMLInputElement>(null);

  const current = QUIZ_STEPS[step];
  const ready = isStepComplete(current.id, draft);
  const last = step === QUIZ_STEPS.length - 1;

  useEffect(() => {
    if (current.id !== 'city') field.current?.focus();
  }, [step, current.id]);

  function next() {
    if (!ready) return;
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    const startDate = new Date().toISOString().slice(0, 10);
    onComplete(toReadingRequest(draft, startDate));
  }

  const set = <K extends keyof QuizDraft>(key: K, value: QuizDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-5 pb-10 pt-7">
      <QuizProgress step={step} total={QUIZ_STEPS.length} axis={draft.priorityAxis} />

      <form
        className="surface mt-7 flex-1 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{current.question}</h1>

        <div className="mt-8">
          {current.id === 'firstName' ? (
            <input
              ref={field}
              id="quiz-firstName"
              className="w-full border-b border-ink/15 bg-transparent pb-2 text-[26px] font-medium tracking-[-0.02em] outline-none placeholder:text-ink/25"
              type="text"
              autoComplete="given-name"
              placeholder="Elioth"
              aria-label="Prénom"
              value={draft.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
          ) : null}

          {current.id === 'birthDate' ? (
            <input
              ref={field}
              id="quiz-birthDate"
              className="w-full border-b border-ink/15 bg-transparent pb-2 text-[26px] font-medium tracking-[-0.02em] outline-none"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
              aria-label="Date de naissance"
              value={draft.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
            />
          ) : null}

          {current.id === 'birthTime' ? (
            <>
              <input
                ref={field}
                id="quiz-birthTime"
                className="w-full border-b border-ink/15 bg-transparent pb-2 text-[26px] font-medium tracking-[-0.02em] outline-none disabled:opacity-30"
                type="time"
                aria-label="Heure de naissance"
                disabled={!draft.timeKnown}
                value={draft.birthTime}
                onChange={(e) => set('birthTime', e.target.value)}
              />
              <label className="mt-6 flex items-start gap-3 text-[13px] leading-relaxed" htmlFor="quiz-timeUnknown">
                <input
                  id="quiz-timeUnknown"
                  type="checkbox"
                  className="mt-0.5 size-4 accent-ink"
                  checked={!draft.timeKnown}
                  onChange={(e) => setDraft((d) => ({ ...d, timeKnown: !e.target.checked, birthTime: '' }))}
                />
                <span>
                  Je ne la connais pas.
                  <span className="block opacity-55">
                    On calculera sur midi. L’Ascendant et la Lune seront approchés, et le rapport
                    le dira.
                  </span>
                </span>
              </label>
            </>
          ) : null}

          {current.id === 'city' ? (
            <CityField value={draft.city} onChange={(city) => set('city', city)} search={search} />
          ) : null}

          {current.id === 'priorityAxis' ? (
            <ul className="grid gap-3">
              {AXIS_CHOICES.map((choice) => {
                const chosen = draft.priorityAxis === choice.id;
                return (
                  <li key={choice.id}>
                    <button
                      type="button"
                      aria-pressed={chosen}
                      className="w-full rounded-2xl border px-4 py-4 text-left transition-colors"
                      style={{
                        borderColor: chosen ? `var(--axis-${choice.id})` : 'rgb(15 20 25 / 0.12)',
                        color: chosen ? `var(--axis-${choice.id}-text)` : undefined,
                        // Trait doublé sans décalage : l'état choisi se lit aussi à
                        // l'épaisseur, pas seulement à la teinte.
                        boxShadow: chosen ? 'inset 0 0 0 1px currentColor' : undefined,
                      }}
                      onClick={() => set('priorityAxis', choice.id)}
                    >
                      <span className="block text-[17px] font-semibold tracking-[-0.01em]">{choice.label}</span>
                      <span className="block text-[12.5px] opacity-60">{choice.blurb}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {current.hint ? (
            <p className="mt-6 text-[12.5px] leading-relaxed opacity-55">{current.hint}</p>
          ) : null}
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            type="submit"
            disabled={!ready}
            className="rounded-full bg-ink px-6 py-3.5 text-[14px] font-semibold text-paper disabled:opacity-25"
          >
            {last ? 'Calculer mes jours' : 'Continuer'}
          </button>
          {step > 0 ? (
            <button
              type="button"
              className="text-[13px] opacity-50 underline underline-offset-4"
              onClick={() => setStep((s) => s - 1)}
            >
              Retour
            </button>
          ) : null}
        </div>
      </form>
    </main>
  );
}
