# Bien.Luné — règles permanentes

Le brief de référence est `BRIEF.md`. En cas de contradiction entre ce fichier et
`BRIEF.md`, `BRIEF.md` gagne et l'écart va dans `QUESTIONS.md`.

## Git

- **Jamais de commit direct sur `main`.** Une branche par tâche, une PR par tâche.
- **Jamais de `git push --force`, jamais de réécriture d'historique.**
- `git push -u origin <branche>` ; en cas d'échec réseau, réessayer jusqu'à quatre fois
  avec attente croissante (2 s, 4 s, 8 s, 16 s).

> **Contrainte d'environnement.** Cette session est exécutée par un agent dont le
> harnais impose une branche unique : `claude/bien-lune-astro-product-9tfacw`, et
> interdit d'en pousser une autre. La règle « une branche par tâche » ne peut donc pas
> être appliquée à la lettre ici. Convention retenue à la place : **un commit par
> tâche**, message explicite, et la PR de session sert de PR de revue. Voir
> `QUESTIONS.md`.

## Secrets

- **Aucune clé d'API en dur.** Tout passe par `.env.local`, qui reste dans `.gitignore`.
- `.env.example` liste les variables attendues, sans valeur.

## Moteur astro

- **`astronomy-engine` uniquement.** Swiss Ephemeris est interdit : licence AGPL ou
  commerciale payante, incompatible avec un produit vendu. Contrainte bloquante.
- Le moteur vit dans `lib/astro/`, en **fonctions pures** : entrées sérialisables,
  sortie déterministe, aucun accès réseau, aucun `Date.now()` implicite.
- Maisons en **signes entiers**. Placidus n'est pas implémenté.
- Les scores sont normalisés **sur la distribution propre de la personne**, jamais sur
  une échelle absolue.

## Tests

- **Un test qui échoue se corrige.** Il ne se supprime pas, ne passe pas en `skip`, et
  ne se réécrit pas pour passer. Si l'attente du test était fausse, corriger l'attente
  est légitime — mais seulement après avoir prouvé pourquoi, et en le disant dans le
  message de commit.
- Tout comportement du moteur est couvert par un test avant d'être utilisé par l'UI.
- Les tests d'axes du thème se valident par la **géométrie** (l'Ascendant est bien à
  altitude nulle sur l'horizon est), pas en recopiant un thème de référence.

## Dépendances

- Pas de nouvelle dépendance lourde sans justification écrite dans le commit.
- Une dépendance devenue inutile est retirée.

## Définition de « terminé »

Une tâche n'est terminée que si les cinq commandes passent :

```
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

Tant qu'une seule échoue, la tâche est en cours. On ne passe jamais à la suivante avec
une commande en échec.

## Fichiers de pilotage

- `TASKS.md` — liste ordonnée, `[ ]` / `[x]`. Une seule tâche en cours à la fois.
- `JOURNAL.md` — à chaque tâche terminée, trois lignes : ce qui a été fait, ce qui a
  cassé et comment ça a été réparé, ce qui reste incertain.
- `QUESTIONS.md` — toute décision non tranchable seul. On l'écrit, on prend l'option la
  plus réversible, on continue. On ne s'arrête pas pour attendre une réponse.

## Ce sur quoi on ne décide jamais seul

- Le design final : palette, typographies, glyphes.
- Le prix, les textes de vente, la promesse produit.
- Toute suppression de fichier ou de table existante.

## Règles de contenu non négociables

- **L'axe Énergie ne donne jamais de conseil médical.** Rythme, fatigue, élan —
  jamais un symptôme, un traitement, un diagnostic, ni « bon jour pour une opération ».
  Règle inscrite dans le prompt de génération **et** vérifiée en sortie par un filtre
  déterministe, avec repli sur un texte gabarit si le filtre déclenche.
- **Aucune formule de voyance.** Interdits explicites : « les astres te sourient »,
  « l'univers t'envoie un signe », « attention aux énergies négatives ».
- **Jamais « tu es [signe] ».** Le produit se vend sur le fait que le signe solaire ne
  dit presque rien ; l'interface ne doit pas le contredire. Un aspect vise toujours un
  **point natal** — « trigone à ton Soleil », jamais « trigone au Lion ».
- Un terme technique n'apparaît jamais seul à sa première occurrence : il est suivi
  une fois de sa traduction en clair, puis peut être employé seul.
- Pied de page obligatoire : `Bien.Luné propose une lecture astrologique à visée de
  divertissement et de réflexion personnelle.`

## Design

- La couleur ne sert **qu'au** système saisonnier. L'interface vit sur deux valeurs,
  papier et encre. Aucune couleur de bouton, d'accent de marque ou d'état.
- Les glyphes du zodiaque sont en **polylignes uniquement** : aucune courbe de Bézier,
  aucun arc SVG. C'est testé — un `C`, `Q`, `S` ou `A` dans un tracé fait échouer la
  suite.
- Les axes du ruban se distinguent par la position et le tracé, jamais par la teinte.
- `prefers-reduced-motion` respecté partout : sans animation, tout reste utilisable.
