'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TideRibbon, type RibbonDay } from '@/components/ribbon/TideRibbon';
import { AXIS_IDS } from '@/lib/astro/transits';
import { PEAK_SCORE } from '@/lib/design/ribbon-geometry';
import { buzz, crossesPeak } from '@/lib/ui/haptics';
import type { ExplainingAspect, ReadingDay, ReadingPayload } from '@/lib/api/reading';
import type { AxisId } from '@/lib/astro/types';

const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
/** Au-delà, on considère le défilement programmé terminé même sans `scrollend`. */
const SETTLE_MS = 500;

/**
 * Les trente jours.
 *
 * Un écran, une décision : le jour choisi, le score de l'axe qui compte pour la
 * personne, et les deux aspects qui l'expliquent. Les deux autres axes sont des
 * lignes, pas des blocs — budget de densité, règles 1 et 3.
 *
 * Deux gestes mènent au même endroit : le doigt sur le ruban, qui balaie les
 * trente jours d'un trait, et le balayage latéral des cartes, qui avance jour
 * par jour. Le second est la manière naturelle de lire sur un téléphone ; le
 * premier est la manière naturelle de chercher. Les deux pilotent le même index,
 * et la pastille ramène à aujourd'hui d'où qu'on soit.
 */
export function DaysScreen({ payload, onRare }: { payload: ReadingPayload; onRare: () => void }) {
  const [selected, setSelected] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  /**
   * Jour courant lisible en dehors du rendu.
   *
   * Le scrub doit comparer le jour visé au jour précédent pour décider de la
   * vibration. Le faire dans une mise à jour fonctionnelle d'état marcherait,
   * mais React rejoue ces fonctions en Strict Mode : on vibrerait deux fois.
   */
  const current = useRef(0);
  /** Vrai pendant un défilement que nous avons déclenché : ses événements ne comptent pas. */
  const programmatic = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const days: RibbonDay[] = useMemo(
    () => payload.days.map((d) => ({
      date: d.date,
      season: d.season as RibbonDay['season'],
      scores: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].score])) as RibbonDay['scores'],
      peakSign: Object.fromEntries(AXIS_IDS.map((a) => [a, d.axes[a].peakSign])) as RibbonDay['peakSign'],
    })),
    [payload],
  );

  /** Un jour est un pic là où le ruban pose un glyphe : même seuil, même condition. */
  const peaks = useMemo(
    () => days.map((d) => AXIS_IDS.some((a) => d.scores[a] >= PEAK_SCORE && d.peakSign[a] !== null)),
    [days],
  );

  const commit = useCallback((day: number) => {
    current.current = day;
    setSelected(day);
  }, []);

  const goTo = useCallback((day: number, smooth: boolean) => {
    commit(day);
    const el = track.current;
    if (!el) return;
    programmatic.current = true;
    clearTimeout(settle.current);
    el.scrollTo({ left: day * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    // Un saut instantané est fini à la frame suivante ; un défilement doux met le
    // temps qu'il met, et `scrollend` n'existe pas partout — d'où le garde-fou.
    if (smooth) {
      settle.current = setTimeout(() => { programmatic.current = false; }, SETTLE_MS);
    } else {
      requestAnimationFrame(() => { programmatic.current = false; });
    }
  }, [commit]);

  /** Le doigt sur le ruban : mise à jour immédiate, secousse au franchissement d'un pic. */
  const onScrub = useCallback((day: number) => {
    if (day === current.current) return;
    if (crossesPeak(current.current, day, peaks)) buzz();
    goTo(day, false);
  }, [goTo, peaks]);

  useEffect(() => () => clearTimeout(settle.current), []);

  const [primary, ...others] = payload.axisOrder as AxisId[];

  return (
    <main className="mx-auto max-w-[520px] px-5 pb-14 pt-6">
      <div className="surface p-4">
        <TideRibbon days={days} selected={selected} labels={payload.axisLabels} onScrub={onScrub} />
      </div>

      {/*
        Ligne de date et retour à aujourd'hui.
        Sortie de la carte et posée une seule fois au-dessus du rail : c'est la
        barre de navigation de l'écran, et c'est là qu'on cherche « aujourd'hui »
        — pas dans une pastille flottante, qui se posait sur le bouton des jours
        rares, noir sur noir. Le contrôle occupe la place que le rang occupait :
        aucun élément d'interface en plus.
      */}
      <p className="technical mt-6 flex items-center justify-between gap-4 text-[12px]">
        <span className="flex items-baseline gap-2">
          <strong className="text-[15px] font-semibold tracking-[0.02em]">
            {shortDate(payload.days[selected].date).toUpperCase()}
          </strong>
          {selected > 0 ? <span className="opacity-40">+{selected}</span> : null}
        </span>
        {selected === 0 ? (
          <span className="opacity-50">AUJOURD’HUI</span>
        ) : (
          <button
            type="button"
            data-testid="today-pill"
            onClick={() => goTo(0, true)}
            /*
              Contour et non aplat : le seul noir plein de l'écran reste « Les
              jours rares ». Deux pastilles noires, ce sont deux appels à
              l'action qui se disputent la même page.
            */
            className="-my-2 rounded-full border border-ink/15 bg-surface px-4 py-2 text-[11px] font-semibold tracking-[0.08em] shadow-[0_1px_2px_rgb(15_20_25/.05)]"
          >
            ↺ AUJOURD’HUI
          </button>
        )}
      </p>

      <div
        ref={track}
        className="day-track mt-3"
        data-testid="day-track"
        data-day={selected}
        tabIndex={0}
        role="group"
        aria-label="Les trente jours, une carte par jour"
        onScroll={(e) => {
          if (programmatic.current) return;
          const el = e.currentTarget;
          const at = Math.round(el.scrollLeft / el.clientWidth);
          if (at !== current.current && at >= 0 && at < days.length) commit(at);
        }}
      >
        {payload.days.map((d, index) => (
          <DayCard
            key={d.date}
            day={d}
            primary={primary}
            others={others}
            labels={payload.axisLabels}
            hidden={index !== selected}
          />
        ))}
      </div>

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

/**
 * Une journée.
 *
 * Les trente cartes existent toutes dans le rail — c'est ce qui rend le
 * défilement aimanté natif, donc fluide, sans réimplémenter l'inertie à la main.
 * Seule la carte sous le curseur est exposée : `inert` retire les autres du
 * clavier et des technologies d'assistance, et `aria-hidden` évite qu'un lecteur
 * d'écran annonce trente jours à la suite.
 */
function DayCard({
  day, primary, others, labels, hidden,
}: {
  day: ReadingDay;
  primary: AxisId;
  others: AxisId[];
  labels: Record<AxisId, string>;
  hidden: boolean;
}) {
  const lead = day.axes[primary];

  return (
    <div inert={hidden} aria-hidden={hidden || undefined}>
      <section className="surface p-6">
        <p
          className="technical text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums"
          style={{ color: `var(--axis-${primary})` }}
        >
          {lead.score}
        </p>
        {/*
          Un seul `h1` sur l'écran : il vit sur la carte visible, les autres
          descendent d'un cran. Trente titres de niveau 1 dans le rail feraient
          d'un plan de page clair une liste illisible au lecteur d'écran.
        */}
        {hidden ? (
          <h2 className="technical mt-2 text-[11px] font-semibold tracking-[0.12em]" style={{ color: `var(--axis-${primary}-text)` }}>
            {labels[primary].toUpperCase()}
          </h2>
        ) : (
          <h1 className="technical mt-2 text-[11px] font-semibold tracking-[0.12em]" style={{ color: `var(--axis-${primary}-text)` }}>
            {labels[primary].toUpperCase()}
          </h1>
        )}

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
            {lead.explaining.map((aspect: ExplainingAspect) => (
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
              {labels[axis].toUpperCase()}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
