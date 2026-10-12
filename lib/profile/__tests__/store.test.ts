import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VERSION, isFresh, type StoredReading } from '../store';
import { SCORE_METHOD } from '@/lib/astro/calibration';

const base = (over: Partial<StoredReading> = {}): StoredReading => ({
  version: STORE_VERSION,
  method: SCORE_METHOD,
  startDate: '2026-09-11',
  zone: 'Europe/Paris',
  // Seule la méthode du rapport est lue ici : le reste ne conditionne pas la fraîcheur.
  payload: { method: SCORE_METHOD } as StoredReading['payload'],
  ...over,
});

describe('fraîcheur du rapport enregistré', () => {
  it('garde le rapport du jour, dans le bon fuseau', () => {
    expect(isFresh(base(), '2026-09-11', 'Europe/Paris')).toBe(true);
  });

  it('recalcule le lendemain matin : la fenêtre ne commence plus aujourd’hui', () => {
    expect(isFresh(base(), '2026-09-12', 'Europe/Paris')).toBe(false);
  });

  it('recalcule après un voyage : la journée n’a plus les mêmes bornes', () => {
    expect(isFresh(base(), '2026-09-11', 'America/Montreal')).toBe(false);
  });

  /*
   * L'exigence de versionnage du brief : ne jamais mélanger deux méthodes de
   * score. Un rapport calculé sous l'ancienne échelle, affiché à côté d'un
   * nouveau, donnerait deux vérités pour la même journée.
   */
  it('recalcule quand la méthode de score a changé', () => {
    expect(isFresh(base({ method: 'stable-780-v0' }), '2026-09-11', 'Europe/Paris')).toBe(false);
    expect(isFresh(
      base({ payload: { method: 'autre-chose' } as StoredReading['payload'] }),
      '2026-09-11', 'Europe/Paris',
    )).toBe(false);
  });

  it('recalcule quand la forme du stockage a changé', () => {
    expect(isFresh(base({ version: STORE_VERSION - 1 }), '2026-09-11', 'Europe/Paris')).toBe(false);
  });

  it('recalcule quand il n’y a rien d’enregistré', () => {
    expect(isFresh(null, '2026-09-11', 'Europe/Paris')).toBe(false);
  });
});

describe('stockage indisponible', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('ne fait pas tomber le produit en navigation privée', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); },
      removeItem: () => { throw new Error('SecurityError'); },
    });
    const { loadProfile, saveProfile, forgetAll } = await import('../store');
    expect(loadProfile()).toBeNull();
    expect(() => saveProfile({} as never, 'Europe/Paris')).not.toThrow();
    expect(() => forgetAll()).not.toThrow();
  });
});
