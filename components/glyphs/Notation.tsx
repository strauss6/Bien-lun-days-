import type { AspectId, PlanetId, PointId } from '@/lib/astro/types';
import { POINT_GLYPHS } from '@/lib/astro/natal';
import { ASPECTS } from '@/lib/astro/aspects';
import { AspectGlyph } from './AspectGlyph';
import { transitPhrase } from '@/lib/astro/labels';

/**
 * Notation technique d'un aspect : « ♃ △ ☉ ».
 *
 * Les symboles de planètes sont couverts par les polices système ; celui de
 * l'aspect est dessiné, parce qu'il ne l'est pas — voir `lib/design/aspect-paths.ts`.
 * L'ensemble porte la phrase en clair comme étiquette accessible : un lecteur
 * d'écran entend « Jupiter en trigone à ton Soleil », pas une suite de symboles.
 */
export function Notation({
  transit, aspect, natal, size = 13,
}: { transit: PlanetId; aspect: AspectId; natal: PointId; size?: number }) {
  return (
    <span
      role="img"
      aria-label={transitPhrase(transit, aspect, natal)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32em', letterSpacing: 0 }}
    >
      <span aria-hidden="true">{POINT_GLYPHS[transit]}</span>
      <AspectGlyph aspect={aspect} size={size} title={undefined} />
      <span aria-hidden="true">{POINT_GLYPHS[natal]}</span>
      <span className="sr-only">{ASPECTS[aspect].label}</span>
    </span>
  );
}
