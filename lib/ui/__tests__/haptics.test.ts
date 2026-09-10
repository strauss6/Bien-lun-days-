import { afterEach, describe, expect, it, vi } from 'vitest';
import { PEAK_BUZZ_MS, buzz, crossesPeak } from '../haptics';

const peaks = [false, false, true, false, false, false, true, false];

describe('crossesPeak', () => {
  it('ne vibre pas quand le doigt ne change pas de jour', () => {
    expect(crossesPeak(2, 2, peaks)).toBe(false);
  });

  it('vibre en arrivant sur un pic', () => {
    expect(crossesPeak(1, 2, peaks)).toBe(true);
  });

  it('ne revibre pas sur le pic dont on part', () => {
    expect(crossesPeak(2, 3, peaks)).toBe(false);
  });

  it('attrape un pic survolé par un scrub rapide', () => {
    // Le geste saute de 0 à 4 : le pic du jour 2 n'est jamais la destination.
    expect(crossesPeak(0, 4, peaks)).toBe(true);
  });

  it('marche vers l’arrière comme vers l’avant', () => {
    expect(crossesPeak(7, 5, peaks)).toBe(true);
    expect(crossesPeak(5, 3, peaks)).toBe(false);
  });
});

describe('buzz', () => {
  const stub = (vibrate: unknown, reduced = false) => {
    vi.stubGlobal('navigator', vibrate ? { vibrate } : {});
    vi.stubGlobal('window', { matchMedia: () => ({ matches: reduced }) });
  };

  afterEach(() => vi.unstubAllGlobals());

  it('reste silencieux là où l’API n’existe pas', () => {
    stub(null);
    expect(buzz()).toBe(false);
  });

  it('demande la vibration quand le matériel la propose', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    stub(vibrate);
    expect(buzz()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(PEAK_BUZZ_MS);
  });

  it('se tait sous prefers-reduced-motion', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    stub(vibrate, true);
    expect(buzz()).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('avale le refus d’un navigateur qui exige un geste utilisateur', () => {
    stub(vi.fn(() => { throw new Error('NotAllowedError'); }));
    expect(buzz()).toBe(false);
  });
});
