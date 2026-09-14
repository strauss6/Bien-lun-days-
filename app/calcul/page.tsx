'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DRAFT_STORAGE_KEY } from '@/lib/quiz/steps';
import { saveProfile, saveReading } from '@/lib/profile/store';
import { residentZone } from '@/lib/app/today';
import type { ReadingInput, ReadingPayload } from '@/lib/api/reading';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const longDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/**
 * L'écran de calcul.
 *
 * Les étapes affichées portent les **vraies valeurs** renvoyées par le calcul :
 * la position réelle du Soleil à l'heure de naissance, l'Ascendant réel, le
 * nombre réel de combinaisons testées. Rien n'est simulé, et l'écran ne dure pas
 * plus longtemps que le calcul — on ne fabrique pas d'attente pour faire sérieux.
 */
export default function CalculPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ReadingPayload | null>(null);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const raw = (() => {
      try {
        return sessionStorage.getItem(DRAFT_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    if (!raw) {
      router.replace('/quiz');
      return;
    }

    fetch('/api/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: raw,
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? 'Le calcul a échoué.');
        return body as ReadingPayload;
      })
      .then((result) => {
        /*
         * C'est ici que le profil devient durable. Il est gardé sur l'appareil,
         * avec le rapport et la date où il commence : la visite de demain
         * retrouvera le profil sans repasser par le questionnaire, et verra que
         * le rapport n'est plus celui du jour.
         */
        const request = JSON.parse(raw) as ReadingInput;
        const zone = request.zone ?? residentZone();
        const { startDate, days, ...profile } = request;
        void days;
        saveProfile(profile, zone);
        saveReading(result, startDate, zone);
        setPayload(result);
      })
      .catch((e: Error) => setError(e.message));
  }, [router]);

  const steps = payload ? [
    `Soleil au ${longDate(payload.birth.date)}, ${payload.birth.time} — ${payload.chart.sun}`,
    `Heure convertie : ${payload.chart.utcISO.slice(11, 16)} UTC, ${payload.chart.offset}`,
    payload.birth.timeKnown
      ? `Ascendant ${payload.chart.asc} · Milieu du Ciel ${payload.chart.mc}`
      : 'Heure inconnue : calcul sur midi, Ascendant non retenu',
    `Transits sur ${payload.days.length} jours, à partir du ${longDate(payload.startDate)}`,
    `${payload.stats.comparisonsTested.toLocaleString('fr-FR')} combinaisons testées`,
    `${payload.stats.aspectEvents} aspects retenus · ${payload.rare.length} rares`,
  ] : [];

  useEffect(() => {
    if (!payload || shown >= steps.length) return;
    const timer = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 120 : 420);
    return () => clearTimeout(timer);
  }, [payload, shown, steps.length]);

  useEffect(() => {
    if (!payload || shown < steps.length) return;
    // Le calcul finit sur la journée en cours, jamais sur le mois : c'est le
    // rendez-vous quotidien qui est le produit.
    const timer = setTimeout(() => router.replace('/'), 700);
    return () => clearTimeout(timer);
  }, [payload, shown, steps.length, router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-5 py-10">
      <p className="technical text-[10px] tracking-[0.12em] opacity-45">CALCUL</p>

      <ul className="technical mt-5 grid gap-2.5" aria-live="polite">
        {steps.slice(0, shown).map((line) => (
          <li key={line} className="text-[12px] leading-relaxed opacity-75" data-testid="calc-step">
            {line}
          </li>
        ))}
        {!payload && !error ? <li className="text-[12px] opacity-40">Position des planètes…</li> : null}
      </ul>

      {error ? (
        <div className="mt-6">
          <p className="text-[13px] leading-relaxed">{error}</p>
          <button
            type="button"
            className="mt-4 rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-paper"
            onClick={() => router.push('/quiz')}
          >
            Reprendre
          </button>
        </div>
      ) : null}
    </main>
  );
}
