'use client';

import { useMemo, useState } from 'react';
import { TideRibbon, type RibbonDay } from '@/components/ribbon/TideRibbon';
import { AXIS_IDS } from '@/lib/astro/transits';
import { duree, jourMois, plage, plageCourte } from '@/lib/copy/duration';
import { noPeriodLine, periodLine, type PeriodRank } from '@/lib/copy/quarter';
import type { PeriodPayload, ReadingPayload } from '@/lib/api/reading';
import type { AxisId } from '@/lib/astro/types';

/**
 * Les trois mois qui viennent.
 *
 * ## Pourquoi cet écran ne montre pas des journées
 *
 * À quatre-vingt-dix jours sur un téléphone, une journée fait trois virgule six
 * pixels. La question n'est plus « combien je fais le 12 novembre » — c'est
 * « quand est-ce que ça vaut le coup ». Mesure à l'appui : sur le thème de
 * référence, les trois axes changent de sens 13, 25 et 31 fois en 88 jours, le
 * score global du jour 36 fois. Les axes tiennent parce que des planètes lentes
 * les portent et qu'un même aspect dure des semaines ; le score du jour oscille
 * parce que la Lune en fait les trois quarts. Tracé sur un trimestre il ferait
 * une barrière de piquets, et il n'est donc pas ici : il reste l'affaire de la
 * vue du jour.
 *
 * ## Un écran, une décision
 *
 * L'axe qui compte pour la personne, et ses fenêtres. Les deux autres axes sont
 * dans le ruban, à portée d'un geste, mais la liste ne parle que d'un seul :
 * quinze fenêtres sur trois axes ne sont pas une décision, ce sont des données.
 *
 * Aucun grand nombre sur cet écran, et c'est voulu : on ne note pas un trimestre.
 */

const RIBBON_DAYS = 90;

function rangs(periods: PeriodPayload[]): Map<PeriodPayload, PeriodRank> {
  const out = new Map<PeriodPayload, PeriodRank>();
  const hautes = periods.filter((p) => p.favourable);
  const basses = periods.filter((p) => !p.favourable);
  /*
   * La meilleure est la plus haute en moyenne, pas la plus longue : six semaines
   * juste au-dessus de la ligne ne valent pas dix jours nettement au-dessus, et
   * c'est la seconde qu'on cherche en ouvrant cet écran.
   */
  const mieux = (a: PeriodPayload, b: PeriodPayload) => (a.average > b.average ? a : b);
  const pire = (a: PeriodPayload, b: PeriodPayload) => (a.average < b.average ? a : b);
  if (hautes.length > 0) out.set(hautes.reduce(mieux), 'meilleure');
  if (basses.length > 0) out.set(basses.reduce(pire), 'plus-dure');
  for (const p of periods) if (!out.has(p)) out.set(p, 'ordinaire');
  return out;
}

export function QuarterScreen({ payload, onBack }: { payload: ReadingPayload; onBack: () => void }) {
  const [axis, setAxis] = useState<AxisId>(payload.axisOrder[0]);

  const days: RibbonDay[] = useMemo(
    () => payload.days.slice(0, RIBBON_DAYS).map((d) => ({
      date: d.date,
      season: d.season as RibbonDay['season'],
      scores: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].score])) as RibbonDay['scores'],
      /*
       * Pas de glyphe sur le ruban du trimestre : à 3,6 px par jour ils se
       * chevaucheraient, et un symbole à déchiffrer est déjà interdit ailleurs.
       */
      peakSign: Object.fromEntries(AXIS_IDS.map((a) => [a, null])) as RibbonDay['peakSign'],
    })),
    [payload],
  );

  const fenetres = useMemo(() => payload.periods.filter((p) => p.axis === axis), [payload, axis]);
  const fonds = useMemo(
    () => payload.houseBackdrops.filter((b) => b.axis === axis),
    [payload, axis],
  );
  const rang = useMemo(() => rangs(fenetres), [fenetres]);

  const premier = payload.days[0]?.date ?? '';
  const dernier = payload.days[Math.min(RIBBON_DAYS, payload.days.length) - 1]?.date ?? '';

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
        Les trois mois qui viennent
      </h1>
      <p className="technical mt-2 text-[11px] leading-relaxed opacity-45">
        {plage(premier, dernier)} · les tendances de fond, pas les journées.
      </p>

      <div className="surface mt-6 px-3 pt-4 pb-1">
        <TideRibbon days={days} selected={null} labels={payload.axisLabels} />
      </div>

      <div className="mt-6 grid grid-cols-3 border-b border-ink/12">
        {payload.axisOrder.map((id) => {
          const actif = id === axis;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setAxis(id)}
              aria-pressed={actif}
              data-testid={`quarter-axis-${id}`}
              className="technical min-h-11 border-b-2 pb-2 text-[11px] font-semibold tracking-[0.1em]"
              style={{
                color: actif ? `var(--axis-${id}-text)` : 'rgb(15 20 25 / 0.45)',
                borderBottomColor: actif ? `var(--axis-${id})` : 'transparent',
              }}
            >
              {payload.axisLabels[id].toUpperCase()}
            </button>
          );
        })}
      </div>

      {/*
        Le fond de période, avant les fenêtres : c'est la première chose qu'un
        astrologue regarde — « tu as Jupiter en maison 7 cette année » — et le
        moteur n'en voyait rien jusqu'au 11 octobre 2026. Volontairement hors du
        score : un fond constant sur des mois ne distingue aucun jour et se fait
        réabsorber par l'étalonnage. Il se dit, il ne se chiffre pas.
      */}
      {fonds.length > 0 ? (
        <section className="mt-6" data-testid="quarter-backdrop">
          <h2 className="technical text-[11px] font-semibold tracking-[0.1em] opacity-55">
            LE FOND DE LA PÉRIODE
          </h2>
          {fonds.slice(0, 2).map((f) => (
            <p key={`${f.planet}${f.house}`} className="reading mt-3 text-[17px] leading-snug">
              {f.planet} traverse ta maison {f.house} — {f.topic} —{' '}
              {f.openEnd ? 'et continue au-delà des trois mois' : `jusqu’au ${jourMois(f.end)}`}.
            </p>
          ))}
        </section>
      ) : null}

      {fenetres.length === 0 ? (
        <p className="reading mt-6 text-[17px] leading-snug" data-testid="quarter-empty">
          {noPeriodLine()}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {fenetres.map((f) => (
            <li key={`${f.axis}${f.start}`} className="surface p-5" data-testid="quarter-period">
              <p className="technical flex items-baseline justify-between gap-3 text-[13px] font-semibold leading-snug">
                <span>{f.favourable ? '▲' : '▼'} {plageCourte(f.start, f.end)}</span>
                <span className="whitespace-nowrap opacity-45">{duree(f.days)}</span>
              </p>
              <p className="technical mt-1.5 text-[10.5px] tracking-[0.02em] opacity-55">
                {/*
                  Une borne atteinte parce que le calcul s'arrête là n'est pas une
                  date : on le dit, comme pour les plages d'aspect.
                */}
                {f.openStart ? 'Commencé avant aujourd’hui · ' : ''}
                {f.openEnd ? 'Continue au-delà des trois mois · ' : ''}
                Au plus net le {jourMois(f.peakDate)}
              </p>
              <p className="reading mt-3.5 border-t border-ink/8 pt-3.5 text-[17px] leading-snug">
                {periodLine(f, rang.get(f) ?? 'ordinaire')}
              </p>
            </li>
          ))}
        </ul>
      )}

      <footer className="reading mt-10 text-[15px] leading-relaxed opacity-50">
        Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion
        personnelle.
      </footer>
    </main>
  );
}
