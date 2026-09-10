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
