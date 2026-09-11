import type { AspectId } from '@/lib/astro/types';
import { ASPECT_PATHS, ASPECT_STROKE } from '@/lib/design/aspect-paths';

/**
 * Symbole d'aspect. Même facture que les glyphes du zodiaque : contour seul,
 * trait constant, aucune courbe, et aucune dépendance à la couverture d'une police.
 */
export function AspectGlyph({ aspect, size = 13, title }: { aspect: AspectId; size?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={ASPECT_STROKE}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      vectorEffect="non-scaling-stroke"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
    >
      {title ? <title>{title}</title> : null}
      {ASPECT_PATHS[aspect].map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
