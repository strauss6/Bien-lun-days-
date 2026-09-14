import { describe, expect, it } from 'vitest';
import { MIDNIGHT_MARGIN_MS, civilDateIn, msUntilNextMidnight, residentZone } from '../today';

describe('date civile de résidence', () => {
  it('rend la date du fuseau demandé, pas celle du serveur', () => {
    // 1er janvier 2027, 02:00 UTC : déjà le 1er à Paris, encore le 31 à Montréal.
    const instant = new Date('2027-01-01T02:00:00Z');
    expect(civilDateIn('Europe/Paris', instant)).toBe('2027-01-01');
    expect(civilDateIn('America/Montreal', instant)).toBe('2026-12-31');
    expect(civilDateIn('Pacific/Kiritimati', instant)).toBe('2027-01-01');
  });

  it('tient les fuseaux à la demi-heure et au quart d’heure', () => {
    const instant = new Date('2026-09-11T18:40:00Z');
    expect(civilDateIn('Asia/Kolkata', instant)).toBe('2026-09-12');
    expect(civilDateIn('Asia/Kathmandu', instant)).toBe('2026-09-12');
    expect(civilDateIn('Pacific/Chatham', instant)).toBe('2026-09-12');
  });

  it('rend un fuseau utilisable même si le navigateur se tait', () => {
    expect(residentZone()).toMatch(/^[A-Za-z]+\/[A-Za-z_+\-0-9/]+$|^UTC$/);
  });
});

describe('passage de minuit', () => {
  it('tombe exactement sur le premier instant du lendemain', () => {
    for (const zone of ['Europe/Paris', 'America/Montreal', 'Asia/Kathmandu', 'Pacific/Auckland']) {
      const at = new Date('2026-09-11T09:00:00Z');
      const delai = msUntilNextMidnight(zone, at);
      // Une milliseconde plus tôt que la marge : encore aujourd'hui.
      const avant = new Date(at.getTime() + delai - MIDNIGHT_MARGIN_MS - 1);
      const apres = new Date(at.getTime() + delai);
      expect(civilDateIn(zone, avant)).toBe(civilDateIn(zone, at));
      expect(civilDateIn(zone, apres)).not.toBe(civilDateIn(zone, at));
    }
  });

  it('reste juste la nuit du changement d’heure, où la journée ne dure pas 24 h', () => {
    // 25 octobre 2026 : la France recule d'une heure, la journée dure 25 heures.
    const at = new Date('2026-10-24T22:00:00Z');
    const delai = msUntilNextMidnight('Europe/Paris', at);
    const after = new Date(at.getTime() + delai);
    expect(civilDateIn('Europe/Paris', after)).toBe('2026-10-26');
    // Et l'attente reste plausible : jamais négative, jamais plus de 48 h.
    expect(delai).toBeGreaterThan(0);
    expect(delai).toBeLessThan(48 * 3600 * 1000);
  });

  it('ne rend jamais zéro : un délai nul ferait boucler le réveil', () => {
    for (let h = 0; h < 24; h += 1) {
      const at = new Date(Date.UTC(2026, 8, 11, h, 59, 59, 900));
      expect(msUntilNextMidnight('Europe/Paris', at)).toBeGreaterThanOrEqual(MIDNIGHT_MARGIN_MS);
    }
  });
});
