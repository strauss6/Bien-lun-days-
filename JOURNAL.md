# Journal

Trois lignes par tâche terminée : ce qui a été fait, ce qui a cassé et comment ça a été
réparé, ce qui reste incertain.

---

## T00 — Cadrage : brief, règles, outillage

- **Fait** : `BRIEF.md`, `CLAUDE.md`, `QUESTIONS.md`, `JOURNAL.md`, `TASKS.md`, et les
  cinq commandes de la définition de « terminé » câblées dans `package.json`.
- **Cassé / réparé** : le harnais impose une branche unique, ce qui rend « une branche par
  tâche » inapplicable — tracé en Q1 avec la convention de remplacement. `luxon` retiré
  des dépendances puisque la résolution de fuseau se fait sur `Intl` pour garder la
  précision à la seconde — tracé en Q2.
- **Incertain** : la table des axes revient à celle du brief, ce qui annule un
  élargissement justifié par une mesure sur 90 jours — à rouvrir quand la fenêtre passera
  à 90 jours (Q3).

## T00 bis — Planche de validation visuelle

- **Fait** : une page de validation publiée en artifact, construite sur les vraies données
  du thème de référence — ruban des 30 jours avec les trois tracés d'axe et le lavis
  saisonnier, scrub au doigt avec retour haptique, carte de jour, jours rares, palette,
  spécimen typographique, les douze glyphes et la comparaison variante A / variante B.
  Le générateur importe `lib/design/zodiac-paths.ts` et `lib/design/tokens.ts`, donc la
  maquette ne peut pas diverger du code.
- **Cassé / réparé** : le calcul de « la dernière fois que c'est arrivé » comptait les
  passages rétrogrades d'un même transit comme des occurrences distinctes et annonçait
  « tu avais 31 ans » pour un Pluton sur l'Ascendant qui n'est arrivé qu'une fois.
  Regroupement en événements ajouté, exigence inscrite dans T03 avec ses valeurs attendues.
- **Incertain** : les trois validations de design — palette, typographies, variante de
  glyphe — restent en attente, et le brief interdit de les trancher seul.

## T01 — Tables du brief, fenêtre de 30 jours

- **Fait** : les tables d'axes reviennent à quatre transits et quatre points natals,
  `DEFAULT_WINDOW_DAYS` vaut 30, et un test de conformité au brief empêche la dérive de
  revenir sans qu'on la voie. Le rapport à 90 jours reste calculable en passant `days`.
- **Cassé / réparé** : seize tests écrits pour la fenêtre de 90 jours et la promesse de
  cinq dates par axe. Deux corrections d'attente, justifiées par une mesure et non par
  commodité — sur 10 thèmes × 12 fenêtres, un axe rend moins de cinq dates dans 81 % des
  cas à 30 jours et 3 % à 90 jours. Surtout, ces tests ont révélé deux vrais défauts du
  repli de `selectDates` : il complétait avec des doublons du même événement, puis, une
  fois cela corrigé, il citait un jour à 19 sur 100 comme meilleure date. Le repli est
  supprimé ; une date est citée quand elle passe le seuil et apporte un événement nouveau,
  sinon elle ne l'est pas. Un jour sans aucun aspect n'est plus citable du tout. Et un
  `describe` entier perdu dans une de mes substitutions a été restauré.
- **Incertain** : à 30 jours, trois axes sur 360 ne rendent qu'une seule date. C'est la
  réponse juste, mais l'interface devra afficher un axe pauvre sans donner l'impression
  d'un bug — à traiter en T09.
