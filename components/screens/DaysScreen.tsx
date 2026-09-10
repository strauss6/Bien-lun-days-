'use client';

import { useMemo, useState } from 'react';
import { TideRibbon, type RibbonDay } from '@/components/ribbon/TideRibbon';
import { AXIS_IDS } from '@/lib/astro/transits';
import type { ReadingPayload } from '@/lib/api/reading';
import type { AxisId } from '@/lib/astro/types';

const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/**
 * Les trente jours.
 *
 * Un écran, une décision : le jour choisi, le score de l'axe qui compte pour la
 * personne, et les deux aspects qui l'expliquent. Les deux autres axes sont des
 * lignes, pas des blocs — budget de densité, règles 1 et 3.
 */
export function DaysScreen({ payload, onRare }: { payload: ReadingPayload; onRare: () => void }) {
  const [selected, setSelected] = useState(0);

  const days: RibbonDay[] = useMemo(
    () => payload.days.map((d) => ({
      date: d.date,
      season: d.season as RibbonDay['season'],
      scores: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].score])) as RibbonDay['scores'],
      peakSign: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].peakSign])) as RibbonDay['peakSign'],
    })),
    [payload],
  );

  const day = payload.days[selected];
  const [primary, ...others] = payload.axisOrder as AxisId[];
  const lead = day.axes[primary];

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-14 pt-6">
      <div className="surface p-4">
        <TideRibbon days={days} selected={selected} labels={payload.axisLabels} />
        <label className="sr-only" htmlFor="jour">Jour affiché</label>
        <input
          id="jour"
          className="mt-3 w-full accent-ink"
          type="range"
          min={0}
          max={payload.days.length - 1}
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
        />
      </div>

      <p className="technical mt-6 flex items-baseline justify-between text-[12px]">
        <strong className="text-[15px] font-semibold tracking-[0.02em]">
          {shortDate(day.date).toUpperCase()}
        </strong>
        <span className="opacity-50">
          {selected === 0 ? 'AUJOURD’HUI' : `AUJOURD’HUI + ${selected}`}
        </span>
      </p>

      <section className="surface mt-3 p-6" aria-labelledby="axe-principal">
        <p
          className="technical text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums"
          style={{ color: `var(--axis-${primary})` }}
        >
          {lead.score}
        </p>
        <h1
          id="axe-principal"
          className="technical mt-2 text-[11px] font-semibold tracking-[0.12em]"
          style={{ color: `var(--axis-${primary}-text)` }}
        >
          {payload.axisLabels[primary].toUpperCase()}
        </h1>

        {/*
          La phrase cite elle-même les deux aspects, comme le demande le brief : les
          répéter au-dessus en liste technique ferait lire deux fois la même chose.
          L'orbe et le détail s'affichent au tap, jamais par défaut.
        */}
        <p className="reading mt-5 border-t border-ink/8 pt-5">{lead.phrase}</p>

        <details className="technical mt-4">
          <summary className="cursor-pointer text-[10.5px] tracking-[0.06em] opacity-45">
            Le détail
          </summary>
          <ul className="mt-3 grid gap-1.5">
            {lead.explaining.map((aspect) => (
              <li key={aspect.notation} className="flex items-baseline justify-between gap-3 text-[11px] opacity-65">
                <span>{aspect.phrase}</span>
                <span className="tabular-nums opacity-70">{aspect.orb} {aspect.sign}</span>
              </li>
            ))}
            <li className="mt-1 text-[11px] leading-relaxed opacity-50">{lead.explaining[0]?.plain}</li>
          </ul>
        </details>
      </section>

      <dl className="surface technical mt-3 grid gap-0 px-5">
        {others.map((axis) => (
          <div
            key={axis}
            className="grid grid-cols-[2.6em_1fr] items-baseline gap-x-4 py-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-ink/8"
          >
            <dt
              className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: `var(--axis-${axis})` }}
            >
              {day.axes[axis].score}
            </dt>
            <dd className="text-[10px] font-semibold tracking-[0.1em]" style={{ color: `var(--axis-${axis}-text)` }}>
              {payload.axisLabels[axis].toUpperCase()}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={onRare}
        className="technical mt-6 flex w-full items-center justify-between rounded-full bg-ink px-6 py-3.5 text-[13px] font-semibold text-paper"
      >
        Les jours rares
        <span className="tabular-nums opacity-60">{payload.rare.length}</span>
      </button>

      <footer className="reading mt-10 text-[15px] leading-relaxed opacity-50">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion
        personnelle.
      </footer>
    </main>
  );
}
