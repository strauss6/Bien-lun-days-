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
