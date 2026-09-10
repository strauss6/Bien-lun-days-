'use client';

import { useState } from 'react';
import { TideRibbon, type RibbonDay } from '@/components/ribbon/TideRibbon';
import type { ReadingPayload } from '@/lib/api/reading';
import { AXIS_IDS } from '@/lib/astro/transits';

const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const fmt = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

export function RibbonDemo({ payload }: { payload: ReadingPayload }) {
  const [selected, setSelected] = useState(0);

  const days: RibbonDay[] = payload.days.map((d) => ({
    date: d.date,
    season: d.season as RibbonDay['season'],
    scores: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].score])) as RibbonDay['scores'],
    peakSign: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].peakSign])) as RibbonDay['peakSign'],
  }));

  const day = payload.days[selected];

  return (
    <main className="mx-auto max-w-[560px] px-5 py-8">
      <div className="surface p-4">
        <TideRibbon days={days} selected={selected} labels={payload.axisLabels} />
      </div>

      <p className="technical mt-5 flex items-baseline justify-between text-[12px]">
        <strong className="text-[15px] font-semibold tracking-[0.02em]">{fmt(day.date).toUpperCase()}</strong>
        <span className="opacity-50">{selected === 0 ? 'AUJOURD’HUI' : `AUJOURD’HUI + ${selected}`}</span>
      </p>

      <input
        id="ribbon-day"
        className="mt-4 w-full accent-ink"
        type="range"
        min={0}
        max={payload.days.length - 1}
        value={selected}
        aria-label="Jour affiché"
        onChange={(e) => setSelected(Number(e.target.value))}
      />

      <dl className="technical surface mt-6 grid gap-0 px-5">
        {payload.axisOrder.map((axis, rank) => (
          <div
            key={axis}
            className="grid grid-cols-[3.4em_1fr] items-baseline gap-x-4 gap-y-1 py-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-ink/8"
          >
            {/*
              Un seul nombre au-dessus de 24 px par écran — règle 3 du budget de
              densité. L'axe qui compte pour la personne le porte ; les deux autres
              sont des lignes, pas des blocs.
            */}
            <dt
              className={`row-span-2 font-semibold tabular-nums tracking-[-0.03em] ${
                rank === 0 ? 'text-[30px]' : 'text-[20px]'
              }`}
              style={{ color: `var(--axis-${axis})` }}
            >
              {day.axes[axis].score}
            </dt>
            <dd
              className="text-[10px] font-semibold tracking-[0.1em]"
              style={{ color: `var(--axis-${axis}-text)` }}
            >
              {payload.axisLabels[axis].toUpperCase()}
            </dd>
            {/* En toutes lettres : la plupart des lecteurs ne savent pas lire un symbole. */}
            <dd className="text-[11.5px] leading-relaxed opacity-70">
              {day.axes[axis].explaining.map((e) => (
                <span key={e.notation} className="block">
                  {e.phrase}
                  <span className="ml-1.5 opacity-50">{e.sign}</span>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
