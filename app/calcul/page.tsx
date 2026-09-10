'use client';

import { useEffect, useState } from 'react';
import { DRAFT_STORAGE_KEY } from '@/lib/quiz/steps';

/**
 * Écran de calcul — squelette.
 *
 * T08 y fera défiler les vraies étapes du calcul, avec les vraies valeurs. Pour
 * l'instant il prouve seulement que le quiz a transmis une demande complète.
 */
export default function CalculPage() {
  const [ready, setReady] = useState<string | null>(null);

  useEffect(() => {
    try {
      setReady(sessionStorage.getItem(DRAFT_STORAGE_KEY));
    } catch {
      setReady(null);
    }
  }, []);

  return (
    <main className="mx-auto max-w-[520px] px-5 py-10">
      <p className="technical text-[11px] tracking-[0.1em] opacity-50">CALCUL EN COURS</p>
      <pre data-testid="draft" className="technical mt-4 overflow-x-auto text-[11px] leading-relaxed opacity-70">
        {ready ?? '—'}
      </pre>
    </main>
  );
}
