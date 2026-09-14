import { useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from 'react';

/**
 * Le routeur de la page autonome.
 *
 * La version servie s'appuie sur celui de Next. Ici il n'y en a pas : les écrans
 * partagés importent `next/link` et `next/navigation`, et la construction les
 * remplace par ce fichier. Les composants ne savent donc rien de la différence —
 * c'est ce qui garantit qu'on teste le vrai produit et non une copie.
 *
 * Le chemin vit dans le fragment de l'adresse pour que le bouton « retour » du
 * téléphone fonctionne, ce qui est la première chose qu'on essaie sur mobile.
 */

const lire = (): string => {
  const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
  return h.startsWith('/') ? h : '/';
};

let chemin = lire();
const abonnes = new Set<() => void>();

function prevenir() {
  chemin = lire();
  for (const f of abonnes) f();
}

if (typeof window !== 'undefined') window.addEventListener('hashchange', prevenir);

export function usePath(): string {
  return useSyncExternalStore(
    (f) => { abonnes.add(f); return () => abonnes.delete(f); },
    () => chemin,
    () => '/',
  );
}

function aller(to: string, remplacer = false) {
  const cible = `#${to}`;
  if (remplacer) window.location.replace(cible);
  else window.location.hash = to;
}

/** Compatible avec `next/link` pour ce que les écrans en emploient. */
export default function Link({
  href, children, ...rest
}: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={`#${href}`}
      onClick={(e) => {
        // Laisser le navigateur gérer les ouvertures dans un nouvel onglet.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        aller(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Compatible avec `useRouter` de `next/navigation` pour `push` et `replace`. */
export function useRouter() {
  return {
    push: (to: string) => aller(to),
    replace: (to: string) => aller(to, true),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => {},
    prefetch: () => {},
  };
}
