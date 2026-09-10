'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { TideRibbon, type RibbonDay } from '@/components/ribbon/TideRibbon';
import type { ReadingPayload } from '@/lib/api/reading';
import { AXIS_IDS } from '@/lib/astro/transits';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmt = (iso: string) => dateFormat.format(new Date(`${iso}T12:00:00Z`));

export function RibbonDemo({ payload }: { payload: ReadingPayload }) {
  const [selected, setSelected] = useState(0);
  const [activeAxis, setActiveAxis] = useState(payload.axisOrder[0]);
  const days = useMemo<RibbonDay[]>(() => payload.days.map((d) => ({
    date: d.date,
    season: d.season as RibbonDay['season'],
    scores: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].score])) as RibbonDay['scores'],
    peakSign: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].peakSign])) as RibbonDay['peakSign'],
  })), [payload]);
  const day = payload.days[selected];
  const current = day.axes[activeAxis];

  return (
    <main className="app-shell">
      <header className="app-header">
        <Link href="/" className="wordmark" aria-label="Bien.Luné, accueil">Bien.Luné</Link>
        <span className="technical secondary">Démonstration</span>
      </header>

      <div className="report-heading">
        <h1 className="technical report-title">Le fil de tes jours.</h1>
        <p className="technical secondary">{fmt(days[0].date)} — {fmt(days[days.length - 1].date)} {day.date.slice(0, 4)}</p>
      </div>

      <div className="report-layout">
        <section className="ribbon-panel" aria-label="Calendrier de démonstration">
          <div className="surface ribbon-surface">
            <TideRibbon days={days} selected={selected} labels={payload.axisLabels} />
            <label htmlFor="ribbon-day" className="sr-only">Jour affiché</label>
            <input
              id="ribbon-day"
              className="day-range"
              type="range"
              min={0}
              max={payload.days.length - 1}
              value={selected}
              aria-valuetext={fmt(day.date)}
              onChange={(e) => setSelected(Number(e.target.value))}
            />
          </div>
          <nav className="day-navigation" aria-label="Choisir un jour">
            <button type="button" className="quiet-button" disabled={selected === 0} onClick={() => setSelected(selected - 1)} aria-label="Jour précédent">‹</button>
            <span className="technical secondary">Jour {selected + 1} / {days.length}</span>
            <button type="button" className="quiet-button" disabled={selected === days.length - 1} onClick={() => setSelected(selected + 1)} aria-label="Jour suivant">›</button>
          </nav>
        </section>

        <section className="surface day-card" aria-label="Détail du jour">
          <div className="day-card-heading">
            <time className="technical" dateTime={day.date}>{fmt(day.date)}</time>
            <button type="button" className="text-button" onClick={() => setSelected(0)} disabled={selected === 0}>Début</button>
          </div>
          <div className="axis-options" role="group" aria-label="Axe à explorer">
            {payload.axisOrder.map((axis) => (
              <button
                key={axis} type="button" className="axis-option" aria-pressed={activeAxis === axis}
                style={{ '--axis-tone': `var(--axis-${axis}-text)` } as React.CSSProperties}
                onClick={() => setActiveAxis(axis)}
              >
                <span>{payload.axisLabels[axis]}</span>
                <span className="axis-small-score">{day.axes[axis].score}</span>
              </button>
            ))}
          </div>
          <div className="score-block" style={{ color: `var(--axis-${activeAxis}-text)` }} aria-live="polite" aria-atomic="true">
            <span className="technical score-number" data-testid="primary-score">{current.score}</span>
            <span className="technical score-scale">/ 100</span>
            <span className="sr-only">{payload.axisLabels[activeAxis]}, {fmt(day.date)}</span>
          </div>
          <div className="aspects" key={`${selected}-${activeAxis}`}>
            {current.explaining.length ? current.explaining.map((aspect) => (
              <details className="aspect-detail" key={aspect.notation}>
                <summary>
                  <span className="technical aspect-name">{aspect.phrase}</span>
                  <span className="reading aspect-plain">{aspect.plain}</span>
                </summary>
                <p className="technical aspect-measure">Orbe {aspect.orb} · Contribution {aspect.sign}</p>
              </details>
            )) : <p className="reading">Aucun aspect retenu pour cet axe ce jour-là.</p>}
          </div>
        </section>
      </div>
      <footer className="app-footer technical">Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion personnelle.</footer>
    </main>
  );
}
