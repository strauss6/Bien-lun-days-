'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { AxisId, Season } from '@/lib/astro/types';
import {
  BAND_HEIGHT, BASELINE, LABEL_GUTTER, RIBBON_WIDTH, bandMarks, columnCenter,
  seasonStops, tickPositions,
} from '@/lib/design/ribbon-geometry';
import { AXIS_COLORS } from '@/lib/design/tokens';
import { ZodiacGlyph } from '@/components/glyphs/ZodiacGlyph';

const GRADUATION_HEIGHT = 20;
/** Bandeau de saison : présent, jamais dominant. */
const SEASON_STRIP = 5;
const AXES: AxisId[] = ['business', 'love', 'energy'];
const PEAK_SCORE = 88;

export interface RibbonDay {
  date: string;
  season: Season;
  scores: Record<AxisId, number>;
  /** Signe où se trouve la planète responsable du pic — une position, pas une identité. */
  peakSign: Record<AxisId, number | null>;
}

interface Props {
  days: RibbonDay[];
  /** Jour sous le curseur. */
  selected: number;
  labels: Record<AxisId, string>;
  className?: string;
}

/**
 * Le ruban des trente jours.
 *
 * Trois bandes empilées, une par axe, distinguées par leur mode de tracé et non
 * par leur couleur. Le fond glisse d'une saison à l'autre : c'est le seul endroit
 * du produit où l'on voit le temps passer.
 *
 * Le tracé se révèle de gauche à droite une seule fois par session — au-delà, la
 * répétition devient un péage. Sous `prefers-reduced-motion`, il est là d'emblée.
 */
export function TideRibbon({ days, selected, labels, className }: Props) {
  const gradientId = useId();
  const clipId = useId();
  const revealed = useRef(false);
  const [drawn, setDrawn] = useState(true);

  useEffect(() => {
    if (revealed.current) {
      // Strict Mode rejoue l’effet après avoir annulé la première frame.
      // Sans remise en état final, le clip reste à zéro et masque tout le ruban.
      setDrawn(true);
      return;
    }
    revealed.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = (() => {
      try {
        return sessionStorage.getItem('ribbon-revealed') === '1';
      } catch {
        return false;
      }
    })();
    if (reduced || seen) return;
    setDrawn(false);
    const frame = requestAnimationFrame(() => setDrawn(true));
    try {
      sessionStorage.setItem('ribbon-revealed', '1');
    } catch {
      /* navigation privée : on se passe du souvenir, pas de l'animation */
    }
    return () => cancelAnimationFrame(frame);
  }, []);

  const n = days.length;
  const stops = seasonStops(days.map((d) => d.season));
  const ticks = tickPositions(n);
  const bandsTop = SEASON_STRIP + 8;
  const totalHeight = bandsTop + BAND_HEIGHT * AXES.length + GRADUATION_HEIGHT;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${RIBBON_WIDTH} ${totalHeight}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={`Trente jours, du ${days[0].date} au ${days[n - 1].date}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          {stops.map((s, i) => (
            <stop key={`${s.offset}-${i}`} offset={`${s.offset}%`} stopColor={s.color} />
          ))}
        </linearGradient>
        {/* Un dégradé par axe : profond en haut, lumineux vers la ligne de base. */}
        {AXES.map((axis) => (
          <linearGradient key={axis} id={`${gradientId}-${axis}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AXIS_COLORS[axis].deep} />
            <stop offset="100%" stopColor={AXIS_COLORS[axis].bright} />
          </linearGradient>
        ))}
        <clipPath id={clipId}>
          <rect
            x="0"
            y="0"
            width={drawn ? RIBBON_WIDTH : 0}
            height={totalHeight}
            style={{ transition: 'width 900ms cubic-bezier(.22,1,.36,1)' }}
          />
        </clipPath>
      </defs>

      {/* Bandeau de saison : la seule trace du calendrier, au-dessus des bandes. */}
      <rect
        x={LABEL_GUTTER}
        y={0}
        width={RIBBON_WIDTH - LABEL_GUTTER}
        height={SEASON_STRIP}
        rx={SEASON_STRIP / 2}
        fill={`url(#${gradientId})`}
      />

      <g clipPath={`url(#${clipId})`}>
        {AXES.map((axis, band) => (
          <g key={axis} transform={`translate(0 ${bandsTop + band * BAND_HEIGHT})`}>
            {bandMarks(days.map((d) => d.scores[axis]), n, axis).map((m, i) => (
              <rect
                key={i}
                x={m.x}
                y={m.y}
                width={m.width}
                height={m.height}
                rx={m.radius}
                fill={`url(#${gradientId}-${axis})`}
                fillOpacity={m.opacity}
              />
            ))}
            {days.map((d, i) =>
              d.scores[axis] >= PEAK_SCORE && d.peakSign[axis] !== null ? (
                <g
                  key={`peak-${i}`}
                  transform={`translate(${columnCenter(i, n) - 5} ${Math.min(BAND_HEIGHT - 11, Math.max(1, columnTop(d.scores[axis]) - 12))})`}
                >
                  <ZodiacGlyph sign={d.peakSign[axis]!} size={10} />
                </g>
              ) : null,
            )}
            <text
              data-testid="axis-label"
              x={4}
              y={BASELINE + 3}
              fontSize={8}
              fill={`var(--axis-${axis}-text)`}
              fontWeight={600}
              letterSpacing="0.1em"
            >
              {labels[axis].toUpperCase()}
            </text>
          </g>
        ))}
      </g>

      <g transform={`translate(0 ${bandsTop + BAND_HEIGHT * AXES.length})`}>
        {ticks.map((t) => (
          <g key={t.day}>
            <line
              x1={t.x}
              y1={0}
              x2={t.x}
              y2={t.labelled ? 5 : 2.5}
              stroke="var(--color-ink)"
              strokeOpacity={t.labelled ? 0.35 : 0.16}
            />
            {t.label ? (
              <text
                x={t.x}
                y={15}
                textAnchor="middle"
                fontSize={8.5}
                fill="var(--color-ink)"
                fillOpacity={0.5}
                letterSpacing="0.05em"
              >
                {t.label}
              </text>
            ) : null}
          </g>
        ))}
      </g>

      <line
        x1={columnCenter(selected, n)}
        y1={bandsTop}
        x2={columnCenter(selected, n)}
        y2={bandsTop + BAND_HEIGHT * AXES.length}
        stroke="var(--color-ink)"
        strokeWidth={1.1}
        strokeOpacity={0.35}
        data-testid="ribbon-cursor"
      />
    </svg>
  );
}

/** Sommet de la colonne, pour poser le glyphe juste au-dessus sans le laisser déborder. */
function columnTop(score: number): number {
  const intensity = Math.abs(score - 50) / 50;
  return score > 50 ? BASELINE - intensity * (BASELINE - 6) : BASELINE;
}
