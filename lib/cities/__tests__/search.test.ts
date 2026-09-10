import { describe, expect, it } from 'vitest';
import { cityCount, normalize, searchCities } from '../search';

describe('normalisation des recherches', () => {
  it('ignore accents, casse, tirets et apostrophes', () => {
    expect(normalize('Boulogne-Billancourt')).toBe('boulogne billancourt');
    expect(normalize('BOULOGNE  BILLANCOURT')).toBe('boulogne billancourt');
    expect(normalize("L'Haÿ-les-Roses")).toBe('l hay les roses');
    expect(normalize('Sète')).toBe('sete');
    expect(normalize('Saint-Étienne')).toBe('saint etienne');
  });
});

describe('recherche de ville', () => {
  it('trouve Boulogne-Billancourt quelle que soit la façon de l\'écrire', () => {
    for (const q of ['boulogne-b', 'BOULOGNE BILLANCOURT', 'boulogne billancourt', 'Boulogne Bil']) {
      const [first] = searchCities(q);
      expect(first, q).toBeDefined();
      expect(first.name, q).toBe('Boulogne-Billancourt');
      expect(first.country, q).toBe('FR');
    }
  });

  it('classe par population quand plusieurs villes commencent pareil', () => {
    const results = searchCities('boulogne');
    const names = results.map((c) => c.name);
    expect(names).toContain('Boulogne-Billancourt');
    expect(names).toContain('Boulogne-sur-Mer');
    // 108 000 habitants contre 47 000 : la plus peuplée d'abord.
    expect(names.indexOf('Boulogne-Billancourt')).toBeLessThan(names.indexOf('Boulogne-sur-Mer'));
  });

  it('rend au plus dix résultats', () => {
    expect(searchCities('saint').length).toBeLessThanOrEqual(10);
    expect(searchCities('a').length).toBeLessThanOrEqual(10);
  });

  it('porte les coordonnées nécessaires au calcul du thème', () => {
    const [paris] = searchCities('paris');
    expect(paris.name).toBe('Paris');
    expect(paris.lat).toBeCloseTo(48.85, 1);
    expect(paris.lng).toBeCloseTo(2.35, 1);
  });

  it('couvre les petites communes françaises, pas seulement les grandes villes', () => {
    // Seuil de mille habitants : le brief visait cities5000, on fait mieux.
    const small = searchCities('boulogne-sur-gesse');
    expect(small[0]?.name).toBe('Boulogne-sur-Gesse');
    expect(cityCount()).toBeGreaterThan(15000);
  });

  it('couvre la francophonie hors de France', () => {
    for (const [q, country] of [['bruxelles', 'BE'], ['genève', 'CH'], ['dakar', 'SN'], ['montréal', 'CA']]) {
      const hit = searchCities(q).find((c) => c.country === country);
      expect(hit, q).toBeDefined();
    }
  });

  /**
   * La base nomme les villes en local ou en anglais sans cohérence : Genève et
   * Montréal y sont en français, Brussels et London non. Le nom affiché est le
   * nom français quand il existe, et le nom d'origine reste cherchable.
   */
  it('affiche le nom français et accepte le nom d\'origine', () => {
    for (const [q, expected] of [
      ['bruxelles', 'Bruxelles'], ['brussels', 'Bruxelles'],
      ['londres', 'Londres'], ['london', 'Londres'],
      ['le caire', 'Le Caire'], ['cairo', 'Le Caire'],
    ]) {
      const hit = searchCities(q)[0];
      expect(hit?.name, q).toBe(expected);
    }
  });

  it('ne rend rien plutôt que n\'importe quoi', () => {
    expect(searchCities('')).toEqual([]);
    expect(searchCities('   ')).toEqual([]);
    expect(searchCities('zzzzzzqqqq')).toEqual([]);
  });

  it('répond en moins de dix millisecondes', () => {
    searchCities('par'); // amorce le chargement
    const t0 = performance.now();
    for (const q of ['bou', 'saint-e', 'lyon', 'mars', 'bruxelles']) searchCities(q);
    expect((performance.now() - t0) / 5).toBeLessThan(10);
  });
});
