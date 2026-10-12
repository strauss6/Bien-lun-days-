import { describe, expect, it } from 'vitest';
import { ZODIAC_ORDER, ZODIAC_PATHS, ZODIAC_LABELS } from '../zodiac-paths';
import { ASPECT_PATHS } from '../aspect-paths';
import { ASPECT_IDS } from '../../astro/aspects';

describe('glyphes du zodiaque', () => {
  it('les douze signes sont présents et nommés', () => {
    expect(ZODIAC_ORDER).toHaveLength(12);
    for (const key of ZODIAC_ORDER) {
      expect(ZODIAC_PATHS[key].length).toBeGreaterThan(0);
      expect(ZODIAC_LABELS[key]).toBeTruthy();
    }
  });

  /**
   * La règle qui fait la cohérence graphique de la série : aucune courbe de
   * Bézier ni arc SVG, uniquement des polylignes. C'est ce qui donne aux douze
   * l'air d'être calculés et non dessinés à la main — et c'est vérifiable.
   */
  it('aucun glyphe ne contient de courbe', () => {
    for (const key of ZODIAC_ORDER) {
      for (const path of ZODIAC_PATHS[key]) {
        expect(path, `${key} : ${path}`).not.toMatch(/[CcSsQqTt]/);
        expect(path, `${key} : ${path}`).not.toMatch(/[Aa]\s*\d/);
        expect(path).toMatch(/^M/);
      }
    }
  });

  it('tout tient dans la zone utile de la grille commune', () => {
    for (const key of ZODIAC_ORDER) {
      for (const path of ZODIAC_PATHS[key]) {
        for (const n of path.match(/-?\d+(\.\d+)?/g) ?? []) {
          const v = Number(n);
          expect(v, `${key} déborde : ${v}`).toBeGreaterThanOrEqual(3.5);
          expect(v, `${key} déborde : ${v}`).toBeLessThanOrEqual(20.5);
        }
      }
    }
  });

  it('chaque glyphe reste optiquement centré sur la grille', () => {
    for (const key of ZODIAC_ORDER) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const path of ZODIAC_PATHS[key]) {
        const tokens = path.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g) ?? [];
        let mode = 'L';
        let axis = 0;
        for (const t of tokens) {
          if (/[MLHVZ]/.test(t)) { mode = t; axis = 0; continue; }
          const v = Number(t);
          if (mode === 'H') xs.push(v);
          else if (mode === 'V') ys.push(v);
          else { (axis % 2 === 0 ? xs : ys).push(v); axis += 1; }
        }
      }
      const centre = (a: number[]) => (Math.min(...a) + Math.max(...a)) / 2;
      expect(Math.abs(centre(xs) - 12), `${key} décentré en x`).toBeLessThan(1.6);
      expect(Math.abs(centre(ys) - 12), `${key} décentré en y`).toBeLessThan(1.6);
    }
  });
});

describe('symboles d\'aspect', () => {
  /**
   * Ils étaient composés en Unicode jusqu'à ce qu'une capture montre que `☌`
   * n'existe pas dans Geist Mono et que la police de repli lui substitue un signe
   * ressemblant à Mars. Dessinés, ils suivent la même règle que les douze signes.
   */
  it('les cinq aspects sont dessinés, sans aucune courbe', () => {
    for (const aspect of ASPECT_IDS) {
      const paths = ASPECT_PATHS[aspect];
      expect(paths.length).toBeGreaterThan(0);
      for (const d of paths) {
        expect(d, `${aspect} : ${d}`).not.toMatch(/[CcSsQqTt]/);
        expect(d, `${aspect} : ${d}`).not.toMatch(/[Aa]\s*\d/);
        expect(d).toMatch(/^M/);
      }
    }
  });

  it('tiennent dans la même grille que les signes', () => {
    for (const aspect of ASPECT_IDS) {
      for (const d of ASPECT_PATHS[aspect]) {
        for (const n of d.match(/-?\d+(\.\d+)?/g) ?? []) {
          expect(Number(n), `${aspect} déborde : ${n}`).toBeGreaterThanOrEqual(4);
          expect(Number(n), `${aspect} déborde : ${n}`).toBeLessThanOrEqual(20);
        }
      }
    }
  });
});
