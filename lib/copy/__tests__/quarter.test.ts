import { describe, expect, it } from 'vitest';
import { noPeriodLine, periodLine, type PeriodRank } from '../quarter';
import { plageCourte, plage, duree, jourMois } from '../duration';
import type { PeriodPayload } from '@/lib/api/reading';
import { AXIS_IDS } from '@/lib/astro/transits';

const fenetre = (o: Partial<PeriodPayload> = {}): PeriodPayload => ({
  axis: 'business', start: '2026-11-16', end: '2026-11-22', days: 7,
  favourable: true, average: 54, peakDate: '2026-11-21', peakScore: 57,
  openStart: false, openEnd: false, ...o,
});

const RANGS: PeriodRank[] = ['meilleure', 'plus-dure', 'ordinaire'];

/** Un échantillon large : trois axes, deux sens, trois rangs, des durées variées. */
function toutes(): string[] {
  const out: string[] = [];
  for (const axis of AXIS_IDS) {
    for (const favourable of [true, false]) {
      for (const rang of RANGS) {
        for (const days of [7, 9, 13, 20, 39, 73]) {
          for (const start of ['2026-10-01', '2026-11-16', '2026-12-07']) {
            out.push(periodLine(fenetre({ axis, favourable, days, start }), rang));
          }
        }
      }
    }
  }
  return out;
}

describe('la phrase d’une fenêtre', () => {
  it('tient dans le budget de densité', () => {
    for (const t of toutes()) expect(t.trim().split(/\s+/).length, t).toBeLessThanOrEqual(45);
  });

  it('est déterministe : la même fenêtre donne toujours la même phrase', () => {
    expect(toutes()).toEqual(toutes());
  });

  it('nomme la meilleure et la plus dure, sans superlatif ailleurs', () => {
    expect(periodLine(fenetre(), 'meilleure')).toContain('La meilleure fenêtre du trimestre');
    expect(periodLine(fenetre({ favourable: false }), 'plus-dure')).toContain('la plus exigeante');
    expect(periodLine(fenetre(), 'ordinaire')).not.toMatch(/meilleure|plus exigeante/);
  });

  /*
   * Le reproche du 15 septembre, qui vaut pour tout le produit : « varie un peu
   * parce que tout le temps la même chose, c'est lourd ». Deux fenêtres basses du
   * même trimestre sortaient mot pour mot identiques tant que l'ouverture et le
   * geste partageaient une clé de tirage.
   */
  it('varie d’une fenêtre à l’autre', () => {
    const lignes = ['2026-10-08', '2026-11-23', '2026-12-17', '2027-01-04'].map(
      (start) => periodLine(fenetre({ favourable: false, start, days: 11 }), 'ordinaire'),
    );
    expect(new Set(lignes).size).toBe(lignes.length);
  });

  it('ne promet aucun résultat et ne conseille jamais de renoncer', () => {
    for (const t of toutes()) {
      expect(t, t).not.toMatch(/\b(mauvais|néfaste|funeste|insurmontable|irrémédiable)/i);
      expect(t, t).not.toMatch(/\b(renonce|abandonne|laisse tomber|ne fais rien)\b/i);
      expect(t, t).not.toMatch(/les astres|l’univers|énergies négatives/i);
      // Aucune promesse : « tu vas », « il arrivera », « tu obtiendras ».
      expect(t, t).not.toMatch(/\btu (vas|obtiendras|auras|réussiras)\b/i);
    }
  });

  it('ne donne jamais de conseil médical', () => {
    for (const t of toutes()) {
      expect(t, t).not.toMatch(/\b(symptôme|traitement|diagnostic|opération|maladie|médecin)\b/i);
    }
  });

  it('dit clairement qu’un trimestre peut être plat', () => {
    const vide = noPeriodLine();
    expect(vide).toMatch(/information, pas un manque/);
    expect(vide.trim().split(/\s+/).length).toBeLessThanOrEqual(45);
  });
});

describe('les formats de date partagés', () => {
  it('écrit le premier du mois en ordinal', () => {
    expect(jourMois('2026-12-01')).toBe('1er décembre');
    expect(jourMois('2026-12-02')).toBe('2 décembre');
  });

  it('retire l’année quand la plage ne traverse pas le nouvel an', () => {
    expect(plageCourte('2026-10-08', '2026-11-15')).toBe('du 8 octobre au 15 novembre');
    expect(plageCourte('2026-12-20', '2027-01-12')).toBe('du 20 décembre 2026 au 12 janvier 2027');
    // La forme longue, elle, garde toujours une année : elle sert hors contexte.
    expect(plage('2026-10-08', '2026-11-15')).toBe('du 8 octobre au 15 novembre 2026');
  });

  it('traduit les durées comme on les ressent', () => {
    expect(duree(7)).toBe('7 jours');
    expect(duree(13)).toBe('13 jours');
    expect(duree(39)).toBe('6 semaines');
    expect(duree(73)).toBe('2 mois');
  });
});
