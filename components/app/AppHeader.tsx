import Link from 'next/link';

/**
 * L'en-tête du produit.
 *
 * La mention « Bêta » est lisible et secondaire : pas de couleur d'alerte, pas
 * de bandeau, pas de pourcentage d'avancement. Elle dit que le produit continue
 * d'évoluer, elle ne s'excuse pas d'exister.
 */
export function AppHeader({ action }: { action?: React.ReactNode }) {
  return (
    /*
      Les deux éléments de l'en-tête sont cliquables : ils font donc 44 px de
      haut, et les marges négatives rendent au dessin l'espace que la cible prend.
    */
    <header className="-my-2 flex items-center justify-between gap-4">
      <Link href="/" className="inline-flex min-h-11 items-baseline gap-2 pt-3 no-underline">
        <span className="wordmark">Bien.Luné</span>
        <span className="technical rounded-full border border-ink/15 px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] opacity-45">
          BÊTA
        </span>
      </Link>
      {action}
    </header>
  );
}
