import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { QuizFlow } from '@/components/screens/QuizFlow';
import { DaysScreen } from '@/components/screens/DaysScreen';
import { RareScreen } from '@/components/screens/RareScreen';
import { buildReading, ReadingRequest, type ReadingInput, type ReadingPayload } from '@/lib/api/reading';
import { searchCities } from '@/lib/cities/search';

/**
 * Version autonome, pour essayer le produit sans serveur.
 *
 * Tout tourne dans le navigateur : le moteur d'éphémérides, l'index de villes et
 * ses fuseaux, le scoring, les jours rares. Aucun appel réseau, donc aucun
 * élément du calcul n'est simulé — c'est exactement le même code que la version
 * servie, à travers les mêmes composants d'écran.
 */

type Phase =
  | { name: 'quiz' }
  | { name: 'calcul'; request: ReadingInput }
  | { name: 'jours'; payload: ReadingPayload }
  | { name: 'rares'; payload: ReadingPayload };

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const longDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

function Calcul({ request, onDone }: { request: ReadingInput; onDone: (p: ReadingPayload) => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    // Le calcul est synchrone et lourd : on laisse le navigateur peindre d'abord.
    setTimeout(() => {
      try {
        const payload = buildReading(ReadingRequest.parse(request));
        const steps = [
          `Soleil au ${longDate(payload.birth.date)}, ${payload.birth.time} — ${payload.chart.sun}`,
          `Heure convertie : ${payload.chart.utcISO.slice(11, 16)} UTC, ${payload.chart.offset}`,
          payload.birth.timeKnown
            ? `Ascendant ${payload.chart.asc} · Milieu du Ciel ${payload.chart.mc}`
            : 'Heure inconnue : calcul sur midi, Ascendant non retenu',
          `Transits sur ${payload.days.length} jours, à partir du ${longDate(payload.startDate)}`,
          `${payload.stats.comparisonsTested.toLocaleString('fr-FR')} combinaisons testées`,
          `${payload.stats.aspectEvents} aspects retenus · ${payload.rare.length} rares`,
        ];
        steps.forEach((line, i) => {
          setTimeout(() => setLines((l) => [...l, line]), i * 420);
        });
        setTimeout(() => onDone(payload), steps.length * 420 + 700);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Le calcul a échoué.');
      }
    }, 40);
    return null;
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-5 py-10">
      <p className="technical text-[10px] tracking-[0.12em] opacity-45">CALCUL</p>
      <ul className="technical mt-5 grid gap-2.5" aria-live="polite">
        {lines.map((line) => (
          <li key={line} className="text-[12px] leading-relaxed opacity-75">{line}</li>
        ))}
        {!lines.length && !error ? <li className="text-[12px] opacity-40">Position des planètes…</li> : null}
      </ul>
      {error ? <p className="mt-6 text-[13px]">{error}</p> : null}
    </main>
  );
}

function App() {
  const [phase, setPhase] = useState<Phase>({ name: 'quiz' });

  if (phase.name === 'quiz') {
    return (
      <QuizFlow
        search={async (q) => searchCities(q)}
        onComplete={(request) => setPhase({ name: 'calcul', request })}
      />
    );
  }
  if (phase.name === 'calcul') {
    return <Calcul request={phase.request} onDone={(payload) => setPhase({ name: 'jours', payload })} />;
  }
  if (phase.name === 'jours') {
    return <DaysScreen payload={phase.payload} onRare={() => setPhase({ name: 'rares', payload: phase.payload })} />;
  }
  return <RareScreen payload={phase.payload} onBack={() => setPhase({ name: 'jours', payload: phase.payload })} />;
}

createRoot(document.getElementById('app')!).render(<App />);
