'use client';

import { useState } from 'react';
import { TideRibbon, type RibbonDay } from '@/components/ribbon/TideRibbon';
import type { ReadingPayload } from '@/lib/api/reading';
import { AXIS_IDS } from '@/lib/astro/transits';
import { Notation } from '@/components/glyphs/Notation';
import type { AspectId, PlanetId, PointId } from '@/lib/astro/types';

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
      <TideRibbon days={days} selected={selected} labels={payload.axisLabels} />

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

      <dl className="technical mt-6 grid gap-0">
        {payload.axisOrder.map((axis) => (
          <div key={axis} className="grid grid-cols-[3.2em_1fr_auto] items-baseline gap-4 border-t border-ink/12 py-3">
            <dt className="text-[22px] font-medium tracking-[-0.02em] tabular-nums">{day.axes[axis].score}</dt>
            <dd className="text-[10px] tracking-[0.1em] opacity-55">{payload.axisLabels[axis]}</dd>
            <dd className="flex justify-end gap-4 text-[13px] opacity-70">
              {day.axes[axis].explaining.map((e) => (
                <Notation
                  key={e.notation}
                  transit={e.transit as PlanetId}
                  aspect={e.aspect as AspectId}
                  natal={e.natal as PointId}
                />
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
