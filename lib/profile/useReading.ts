'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReadingPayload } from '@/lib/api/reading';
import { civilDateIn, msUntilNextMidnight, residentZone } from '@/lib/app/today';
import { loadProfile, loadReading, saveReading } from './store';

/**
 * Le rapport du jour, prêt à l'emploi.
 *
 * Un seul endroit décide quelle journée le produit montre, et il décide toujours
 * la même chose : **aujourd'hui, dans le fuseau où la personne vit**. Toutes les
 * vues lisent ce rapport-là — pas de recalcul par écran, donc pas deux vérités
 * pour une même date.
 *
 * Trois situations, trois états. Pas de profil : le questionnaire. Profil et
 * rapport frais : on affiche. Profil sans rapport frais : on recalcule, en le
 * disant.
 *
 * L'application peut rester ouverte toute la nuit : un réveil est armé sur le
 * prochain minuit local, et la journée change sans rechargement.
 */

/**
 * D'où vient le calcul.
 *
 * Par défaut, la route serveur. La page autonome — celle qu'on ouvre sur un
 * téléphone sans rien déployer — remplace cette source par un calcul local :
 * c'est exactement le même moteur, appelé depuis le navigateur au lieu de
 * l'être depuis le serveur. Une seule couture, déclarée, plutôt qu'une copie du
 * crochet qui divergerait au premier changement.
 */
export type ReadingSource = (
  request: Record<string, unknown>,
  today: string,
  zone: string,
) => Promise<ReadingPayload>;

const parLeServeur: ReadingSource = async (request, today, zone) => {
  const r = await fetch('/api/reading', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...request, startDate: today, zone }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error ?? 'Le calcul a échoué.');
  return body as ReadingPayload;
};

let source: ReadingSource = parLeServeur;

/** Remplace la source de calcul. Appelé une fois, au démarrage de la page autonome. */
export function setReadingSource(fn: ReadingSource): void {
  source = fn;
}

export type ReadingState =
  | { status: 'chargement' }
  | { status: 'sans-profil' }
  | { status: 'calcul' }
  | { status: 'erreur'; message: string }
  | { status: 'prêt'; payload: ReadingPayload; today: string; zone: string };

export function useReading(): ReadingState & { refresh: () => void } {
  const [state, setState] = useState<ReadingState>({ status: 'chargement' });
  const [tick, setTick] = useState(0);
  const inFlight = useRef<string | null>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const zone = residentZone();
    const today = civilDateIn(zone);

    const profile = loadProfile();
    if (!profile) {
      setState({ status: 'sans-profil' });
      return;
    }

    const cached = loadReading(today, zone);
    if (cached) {
      setState({ status: 'prêt', payload: cached, today, zone });
      return;
    }

    // Une seule requête par journée en vol : un double montage en mode strict ne
    // doit pas lancer deux calculs.
    const key = `${today}|${zone}`;
    if (inFlight.current === key) return;
    inFlight.current = key;

    setState({ status: 'calcul' });
    let annulé = false;

    source(profile.request as unknown as Record<string, unknown>, today, zone)
      .then((payload) => {
        if (annulé) return;
        saveReading(payload, today, zone);
        setState({ status: 'prêt', payload, today, zone });
      })
      .catch((e: Error) => {
        if (annulé) return;
        inFlight.current = null;
        setState({ status: 'erreur', message: e.message });
      });

    return () => { annulé = true; };
  }, [tick]);

  // Réveil au prochain minuit local. Reposé à chaque changement d'état pour
  // qu'un calcul terminé à 23 h 58 arme bien le réveil de deux minutes plus tard.
  useEffect(() => {
    if (state.status !== 'prêt') return;
    const delay = msUntilNextMidnight(state.zone);
    const timer = setTimeout(refresh, delay);
    return () => clearTimeout(timer);
  }, [state, refresh]);

  return { ...state, refresh };
}
