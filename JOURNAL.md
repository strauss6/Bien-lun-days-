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

## T02 — Les deux aspects qui expliquent le score

- **Fait** : `AxisDay.explaining` porte les deux plus fortes contributions **en valeur
  absolue**, et `lib/astro/labels.ts` compose les libellés — « Jupiter en trigone à ton
  Soleil », la notation « ♃ △ ☉ », le possessif accordé au genre du point, et la
  traduction en clair de chaque aspect pour son premier emploi.
- **Cassé / réparé** : rien. Le tri par valeur absolue existait déjà dans `aspects` ;
  l'exposer explicitement évite qu'un appelant reprenne les deux premiers positifs par
  commodité, ce que le brief signale comme le raté habituel.
- **Incertain** : rien. Un test parcourt toutes les combinaisons planète × aspect × point
  et vérifie qu'aucun libellé ne contient jamais un nom de signe.

## T03 — Rareté, dernière et prochaine occurrence

- **Fait** : `lib/astro/rarity.ts`. Classement par période orbitale — la Lune n'est jamais
  mise en avant, seuls Jupiter et au-delà le sont. Balayage mensuel depuis la naissance
  jusqu'à soixante ans devant, affiné au jour, passages rétrogrades regroupés en un seul
  événement, occurrence précédente convertie en âge. Cache par thème et fenêtre : 1 050 ms
  à froid, 0 ms ensuite.
- **Cassé / réparé** : rien à réparer — le regroupement des passages rétrogrades avait été
  identifié et spécifié en amont, à partir du prototype de la planche de validation. Les
  treize tests passent du premier coup, y compris les valeurs attendues sur le thème de
  référence : Jupiter conjonction Soleil en 2015 à 21 ans et prochaine en 2038, Saturne
  trigone Soleil en 2016 à 23 ans, Saturne opposition Jupiter en 1997 à 3 ans, Neptune
  conjonction Lune jamais auparavant.
- **Incertain** : sur 30 jours, treize événements ressortent, dont beaucoup sans occurrence
  antérieure ni suivante — ils n'ont rien à raconter au-delà de leur nom. L'écran des jours
  rares devra les classer et n'en montrer que quelques-uns, sinon le budget de densité
  saute. À traiter en T10.

## T04 — Base de villes et recherche

- **Fait** : `scripts/build-cities.ts` construit `data/cities.json` — 21 792 villes,
  950 Ko, francophonie au seuil de mille habitants et reste du monde à cinquante mille.
  `lib/cities/search.ts` cherche sans accent ni casse, tolère tirets et apostrophes, exige
  que chaque mot de la requête soit le début d'un mot de la ville dans l'ordre, et s'arrête
  à dix résultats — l'index étant trié par population, le premier trouvé est déjà le plus
  peuplé. `all-the-cities` passe en dépendance de développement : seul l'index construit
  est nécessaire à l'exécution.
- **Cassé / réparé** : la base nomme les villes sans cohérence — Genève et Montréal en
  français, Brussels et London non. Table d'exonymes français ajoutée, le nom français
  devient le nom affiché et le nom d'origine reste cherchable. Le garde-fou de
  construction, qui fait échouer le script sur un alias non résolu, a immédiatement
  attrapé six entrées inutiles : Munich, Milan, Turin, Florence, Naples et Fès portent
  déjà leur nom français dans la base. Vitest ignorait aussi l'alias `@/`, ajouté à sa
  configuration pour que les tests importent comme l'application.
- **Incertain** : une naissance dans une commune de moins de mille habitants ne sera pas
  trouvée. L'impact astrologique est nul — un dixième de degré de longitude déplace
  l'Ascendant de six minutes d'arc — mais l'interface devra le dire franchement en T07
  plutôt que de laisser l'utilisateur devant une liste vide.

## T05 — Contrat d'API et calcul serveur

- **Fait** : schéma `zod` du formulaire avec un message par erreur, directement affichable ;
  `buildReading` compose thème, trente jours et jours rares en un objet sérialisable et
  prêt pour l'interface — notation technique, phrase en clair, traduction de l'aspect, orbe,
  et **signe** de la contribution plutôt que sa valeur, comme l'impose le budget de densité.
  Deux routes : `POST /api/reading` et `GET /api/cities`. Cinq tests de bout en bout.
- **Cassé / réparé** : une attente de test trop étroite exigeait « ton » dans chaque phrase,
  alors que le possessif s'accorde et que « ta Vénus » est correct. L'attente a été
  corrigée, pas le code — l'accord est lui-même couvert par un test dédié.
- **Incertain** : l'axe prioritaire ordonne l'affichage via `axisOrder`, mais rien ne dit
  encore comment l'interface présente un axe sans date citable. À trancher en T09.
