'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type { AxisId, Season } from '@/lib/astro/types';
import {
  BAND_HEIGHT, BASELINE, LABEL_GUTTER, PEAK_SCORE, RIBBON_WIDTH, bandMarks, columnCenter,
  dayAtX, seasonStops, tickPositions,
} from '@/lib/design/ribbon-geometry';
import { AXIS_COLORS } from '@/lib/design/tokens';
import { ZodiacGlyph } from '@/components/glyphs/ZodiacGlyph';

const GRADUATION_HEIGHT = 20;
/** Bandeau de saison : présent, jamais dominant. */
const SEASON_STRIP = 5;
const AXES: AxisId[] = ['business', 'love', 'energy'];

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
  /**
   * Nom du premier jour. « AUJ. » quand la fenêtre commence aujourd'hui, « J1 »
   * sur une démonstration à dates fixes — y écrire « aujourd'hui » deviendrait
   * faux dès le lendemain.
   */
  firstLabel?: string;
  /**
   * Le doigt déplace le curseur. Absent, le ruban reste une image : c'est le cas
   * sur la page de démonstration, où le ruban illustre et ne pilote rien.
   */
  onScrub?: (day: number) => void;
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
export function TideRibbon({ days, selected, labels, firstLabel, onScrub, className }: Props) {
  const gradientId = useId();
  const clipId = useId();
  const svg = useRef<SVGSVGElement>(null);
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

  /**
   * Abscisse du doigt, ramenée dans le repère du `viewBox`.
   *
   * Le SVG est mis à l'échelle en largeur : un pixel d'écran ne vaut pas une
   * unité utilisateur, et convertir avec la seule largeur du `viewBox` ferait
   * dériver le curseur sur les grands écrans.
   */
  const dayUnderFinger = (clientX: number) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return dayAtX(((clientX - box.left) / box.width) * RIBBON_WIDTH, days.length);
  };

  const scrub = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!onScrub) return;
    // Capture dès l'appui : le doigt peut sortir du ruban en glissant sans
    // que le geste s'interrompe.
    event.currentTarget.setPointerCapture(event.pointerId);
    onScrub(dayUnderFinger(event.clientX));
  };

  const n = days.length;
  const stops = seasonStops(days.map((d) => d.season));
  const ticks = tickPositions(n, firstLabel);
  const bandsTop = SEASON_STRIP + 8;
  const totalHeight = bandsTop + BAND_HEIGHT * AXES.length + GRADUATION_HEIGHT;

  return (
    <svg
      ref={svg}
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

      {onScrub ? (
        <rect
          data-testid="ribbon-scrub"
          x={LABEL_GUTTER}
          y={0}
          width={RIBBON_WIDTH - LABEL_GUTTER}
          height={totalHeight}
          fill="transparent"
          style={{ touchAction: 'none', cursor: 'ew-resize' }}
          onPointerDown={scrub}
          onPointerMove={(e) => {
            if (e.buttons === 0 && e.pointerType === 'mouse') return;
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            onScrub?.(dayUnderFinger(e.clientX));
          }}
          onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        />
      ) : null}

      {/* Poignée du curseur : sans elle, le doigt n'a rien à saisir. */}
      <circle
        cx={columnCenter(selected, n)}
        cy={bandsTop - 3.5}
        r={3}
        fill="var(--color-ink)"
        fillOpacity={0.55}
        pointerEvents="none"
      />
      <line
        pointerEvents="none"
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
