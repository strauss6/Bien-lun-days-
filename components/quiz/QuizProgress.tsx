import type { AxisId } from '@/lib/astro/types';

const TICKS = 30;

/**
 * L'avancement du quiz, sans barre de progression.
 *
 * C'est la graduation des trente jours qui s'étend : elle est vide à la première
 * question, complète à la dernière. L'œil apprend à lire le ruban avant de le
 * voir rempli, et une fois l'axe choisi la graduation prend sa couleur — le
 * produit répond avant même d'avoir calculé.
 */
export function QuizProgress({ step, total, axis }: { step: number; total: number; axis: AxisId | null }) {
  const revealed = Math.round(((step + 1) / total) * TICKS);
  const color = axis ? `var(--axis-${axis})` : 'var(--color-ink)';

  return (
    <svg
      viewBox="0 0 300 12"
      className="block w-full"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step + 1}
      aria-label={`Question ${step + 1} sur ${total}`}
    >
      {Array.from({ length: TICKS }, (_, i) => {
        const on = i < revealed;
        const x = 1 + i * (298 / (TICKS - 1));
        return (
          <line
            key={i}
            x1={x}
            y1={on ? 2 : 5}
            x2={x}
            y2={10}
            stroke={on ? color : 'var(--color-ink)'}
            strokeOpacity={on ? 1 : 0.14}
            strokeWidth={1.6}
            strokeLinecap="round"
            style={{ transition: 'y1 260ms ease, stroke-opacity 260ms ease' }}
          />
        );
      })}
    </svg>
  );
}
