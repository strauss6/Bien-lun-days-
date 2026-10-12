/**
 * Import de feuille de style en effet de bord.
 *
 * Next génère `next-env.d.ts` avec cette déclaration, mais ce fichier n'est pas
 * versionné et n'existe donc pas avant le premier `next build`. Or `npm run
 * typecheck` passe avant `npm run build` dans la définition de « terminé » :
 * la déclaration doit vivre dans le dépôt pour que la vérification de types soit
 * indépendante de l'ordre des commandes.
 */
declare module '*.css';
