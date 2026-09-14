import { ZODIAC_LABELS, ZODIAC_PATHS, ZODIAC_STROKE, ZODIAC_VIEWBOX, type ZodiacKey } from '@/lib/design/zodiac-paths';
import { SEASON_COLORS, SIGN_SEASON } from '@/lib/design/tokens';
import { ZODIAC_ORDER } from '@/lib/design/zodiac-paths';

interface Props {
  sign: ZodiacKey | number;
  /** Côté du glyphe en pixels. Le trait reste à 1,25 px quelle que soit la valeur. */
  size?: number;
  /** `season` teinte le glyphe selon la saison du signe ; sinon il prend l'encre courante. */
  tone?: 'ink' | 'season';
  className?: string;
  /**
   * Le glyphe est un repère de position, pas une étiquette : il n'annonce jamais
   * « tu es Balance ». Sans `title` il est purement décoratif pour un lecteur
   * d'écran, ce qui est le cas par défaut dans le ruban.
   */
  title?: string;
}

export function ZodiacGlyph({ sign, size = 24, tone = 'ink', className, title }: Props) {
  const key: ZodiacKey = typeof sign === 'number' ? ZODIAC_ORDER[((sign % 12) + 12) % 12] : sign;
  const index = ZODIAC_ORDER.indexOf(key);
  const color = tone === 'season' ? SEASON_COLORS[SIGN_SEASON[index]] : 'currentColor';

  return (
    <svg
      viewBox={ZODIAC_VIEWBOX}
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke={color}
      strokeWidth={ZODIAC_STROKE}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      vectorEffect="non-scaling-stroke"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title === '' ? ZODIAC_LABELS[key] : title}</title> : null}
      {ZODIAC_PATHS[key].map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export { ZODIAC_ORDER, ZODIAC_LABELS };
export type { ZodiacKey };
