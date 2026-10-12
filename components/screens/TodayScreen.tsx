'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/app/AppHeader';
import { AXIS_IDS } from '@/lib/astro/transits';
import { COUNT_MS, countAt } from '@/lib/ui/count-up';
import type { ExplainingAspect, ReadingDay, ReadingPayload } from '@/lib/api/reading';
import type { AxisId } from '@/lib/astro/types';
import { ASPECTS } from '@/lib/astro/aspects';

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Le nom du jour, calculé sur la date civile seule — aucun fuseau ne s'y glisse. */
function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${d} ${MONTHS[m - 1]}`;
}

/** Les trois jours de la navigation principale. Ils avancent avec la date locale. */
export const DAY_TABS = ['Aujourd’hui', 'Demain', 'Après-demain'];

/**
 * L'écran quotidien.
 *
 * Le rendez-vous. On doit comprendre sa journée en quelques secondes : la date,
 * l'axe qui compte pour soi, un seul grand score, une lecture courte, les deux
 * aspects qui l'expliquent. Les deux autres axes sont à un geste, pas à un
 * écran. Le ruban n'est pas ici — il appartient au mois, et le mettre en haut de
 * cet écran repousserait la journée sous un graphique.
 */
export function TodayScreen({ payload }: { payload: ReadingPayload }) {
  const [offset, setOffset] = useState(0);
  const [axis, setAxis] = useState<AxisId>(payload.axisOrder[0]);
  const progress = useCountUp();

  // Le rapport commence toujours aujourd'hui : les trois onglets sont donc les
  // trois premiers jours, et ils avancent d'eux-mêmes quand le rapport se
  // recalcule au passage de minuit.
  const trois = useMemo(() => payload.days.slice(0, DAY_TABS.length), [payload]);
  const day: ReadingDay = trois[offset] ?? payload.days[0];
  const lead = day.axes[axis];
  const autres = AXIS_IDS.filter((a) => a !== axis);

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-16 pt-6">
      <AppHeader
        action={(
          <Link href="/profil" className="technical inline-flex min-h-11 items-center text-[11px] opacity-45 underline underline-offset-4">
            Mes données
          </Link>
        )}
      />

      <nav aria-label="Les trois prochains jours" className="mt-6 flex gap-2">
        {DAY_TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={i === offset ? 'date' : undefined}
            onClick={() => setOffset(i)}
            className={`technical min-h-11 flex-1 rounded-full px-3 text-[11px] font-semibold tracking-[0.06em] transition-colors ${
              i === offset ? 'bg-ink text-paper' : 'border border-ink/12 bg-surface'
            }`}
          >
            {label.toUpperCase()}
          </button>
        ))}
      </nav>

      {/*
        La date et le score du jour, sur une ligne.
        Le score global est porté aux trois quarts par la Lune : c'est la seule
        planète dont le passage se mesure en heures, donc la seule qui distingue
        un jeudi d'un vendredi. Il est en encre et non en couleur d'axe — il ne
        mesure aucun domaine, il mesure la journée. Et il reste sous 24 px : le
        seul grand nombre de l'écran demeure celui de l'axe prioritaire, comme le
        demande le brief.
      */}
      <div className="technical mt-6 flex items-baseline justify-between gap-4">
        <p className="text-[15px] font-semibold tracking-[0.02em]">
          {longDate(day.date).toUpperCase()}
        </p>
        <p className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] opacity-40">LE JOUR</span>
          <span data-testid="overall" className="text-[20px] font-bold tabular-nums tracking-[-0.02em]">
            {countAt(day.overall.score, progress)}
          </span>
        </p>
      </div>

      {/*
        Ce que la Lune touche, en toutes lettres. C'est ce qui explique pourquoi
        un jour se détache de la veille — et les jours où elle ne touche rien du
        thème, on l'écrit plutôt que de meubler.
      */}
      <p className="technical mt-1.5 text-[11px] leading-relaxed opacity-45">
        {day.overall.contact ?? 'La Lune ne touche aucun point de ton thème aujourd’hui.'}
      </p>

      <section className="surface mt-3 p-6" aria-live="polite">
        <p
          data-testid="score"
          className="technical text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums"
          style={{ color: `var(--axis-${axis})` }}
        >
          {countAt(lead.score, progress)}
        </p>
        <h1
          className="technical mt-2 text-[11px] font-semibold tracking-[0.12em]"
          style={{ color: `var(--axis-${axis}-text)` }}
        >
          {payload.axisLabels[axis].toUpperCase()}
        </h1>

        {/*
          La phrase, puis la traduction du terme technique à son premier emploi :
          « conjonction » ne veut rien dire pour quelqu'un qui n'en a jamais lu.
          Elle est dans le même bloc que la phrase pour que le budget de densité
          — quarante-cinq mots de texte courant — les compte ensemble.
        */}
        <div className="reading mt-5 border-t border-ink/8 pt-5">
          <p>{lead.phrase}</p>
          {lead.explaining[0] ? (
            <p className="mt-2 text-[15px] leading-snug opacity-45">
              {capitalise(ASPECTS[lead.explaining[0].aspect].label)} : {lead.explaining[0].plain}.
            </p>
          ) : null}
        </div>

        {/*
          Le résumé fait 44 px de haut sans en avoir l'air, et reste en `block`
          pour garder son triangle de dépliage. L'orbe — l'écart à l'angle exact —
          et le sens de la contribution ne s'affichent qu'ici.
        */}
        <details className="technical mt-1">
          <summary className="-my-3 block min-h-11 cursor-pointer py-3 text-[10.5px] tracking-[0.06em] opacity-45">
            Le détail
          </summary>
          <ul className="mt-1 grid gap-1.5">
            {lead.explaining.map((a: ExplainingAspect) => (
              <li key={a.notation} className="flex items-baseline justify-between gap-3 text-[11px] opacity-65">
                <span>{a.phrase}</span>
                <span className="tabular-nums opacity-70">{a.orb} {a.sign}</span>
              </li>
            ))}
            <li className="mt-1 text-[11px] leading-relaxed opacity-50">{lead.explaining[0]?.plain}</li>
          </ul>
        </details>
      </section>

      {/*
        Les deux autres axes : leur score, et un geste pour passer dessus. C'est
        la même journée qu'on regarde autrement, jamais un autre calcul.
      */}
      <div className="surface technical mt-3 grid px-5">
        {autres.map((other) => (
          <button
            key={other}
            type="button"
            onClick={() => setAxis(other)}
            className="grid min-h-11 grid-cols-[2.6em_1fr_auto] items-baseline gap-x-4 py-4 text-left [&:not(:first-child)]:border-t [&:not(:first-child)]:border-ink/8"
          >
            <span
              className="text-[20px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: `var(--axis-${other})` }}
            >
              {countAt(day.axes[other].score, progress)}
            </span>
            <span className="text-[10px] font-semibold tracking-[0.1em]" style={{ color: `var(--axis-${other}-text)` }}>
              {payload.axisLabels[other].toUpperCase()}
            </span>
            <span className="text-[10px] opacity-35">Voir</span>
          </button>
        ))}
      </div>

      <Link
        href="/mois"
        className="technical mt-6 flex min-h-11 w-full items-center justify-between rounded-full border border-ink/12 bg-surface px-6 text-[13px] font-semibold no-underline"
      >
        Voir le mois
        <span className="opacity-40">30 jours</span>
      </Link>

      <footer className="reading mt-10 text-[15px] leading-relaxed opacity-50">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion
        personnelle.
      </footer>
    </main>
  );
}

/** Montée des compteurs, une fois par session. Voir `count-up.ts`. */
function useCountUp(): number {
  const [progress, setProgress] = useState(() => {
    if (typeof window === 'undefined') return 1;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 1;
    try {
      return sessionStorage.getItem('scores-counted') === '1' ? 1 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (progress === 1) return;
    try {
      sessionStorage.setItem('scores-counted', '1');
    } catch {
      /* navigation privée : on se passe du souvenir, pas de l'animation */
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      setProgress(t);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return progress;
}
