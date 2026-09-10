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

## T06 — Le ruban, en composant isolé

- **Fait** : géométrie pure et testée dans `lib/design/ribbon-geometry.ts`, composant
  `TideRibbon`, page de démonstration alimentée par un vrai calcul, six tests de bout en
  bout dont un qui vérifie qu'aucune teinte hors palette n'apparaît dans le SVG.
- **Cassé / réparé** : quatre défauts que seule la capture a montrés. Les libellés d'axe
  passaient sous les colonnes et le curseur traversait le « B » de BUSINESS — une gouttière
  de gauche a été ajoutée à la géométrie. Les glyphes de pic débordaient de la bande, ils
  sont bornés. Le curseur de la démonstration était un `input range` **bleu**, couleur hors
  palette, passé à l'encre. Et surtout : les symboles d'aspect composés en Unicode
  s'affichaient faux — `☌` n'existe pas dans Geist Mono et la police de repli lui
  substituait un signe ressemblant à Mars, si bien que « Jupiter conjonction Soleil » se
  lisait « Jupiter Mars Soleil ». Les cinq aspects sont maintenant dessinés en polylignes,
  sur la même grille que les douze signes, avec les mêmes tests.
- **Incertain** : le symbole de conjonction, même dessiné, reste graphiquement proche de
  Mars à treize pixels. Question de design, donc non tranchée seul — Q7.

## T06 bis — Les symboles sortent de l'interface

- **Fait** : décision du commanditaire, et elle corrige une dérive. La plupart des
  utilisateurs seront des néophytes : un symbole qu'ils ne savent pas lire n'est pas de la
  précision, c'est le jargon non traduit que le brief reproche à Co-Star. Un aspect s'écrit
  désormais en toutes lettres — « Jupiter en trigone à ton Soleil ». La règle 6 du budget de
  densité change de nature dans `CLAUDE.md` et `DESIGN.md`, et un test de bout en bout
  échoue si un seul symbole de planète ou d'aspect réapparaît dans l'interface.
- **Cassé / réparé** : rien. Le registre technique tient toujours, porté par les noms et les
  nombres — planètes nommées, minutes d'arc, dates —, ce qui le rend plus convaincant, pas
  moins.
- **Incertain** : les douze glyphes du zodiaque restent, à un seul endroit, posés sur les
  pics du ruban, où ils marquent une position sans qu'on ait à les déchiffrer. Les cinq
  tracés d'aspect restent dans le dépôt sans être utilisés — non supprimés, parce que la
  suppression de fichier n'est pas une décision à prendre seul, et parce qu'ils resserviront
  pour le document destiné à l'astrologue.

## T06 ter — La couleur entre dans le produit

- **Fait** : direction révisée par le commanditaire — trop sombre, plus de couleur, registre
  Apple. Une teinte vive par axe en dégradé vertical, fond blanc froid, surfaces blanches
  largement arrondies à ombre presque invisible, colonnes en pilules. Les saisons quittent
  le fond des bandes, où elles salissaient tout, pour un bandeau de cinq pixels au-dessus du
  ruban, à pleine teinte. `DESIGN.md` §1 et la règle couleur de `CLAUDE.md` sont réécrites.
- **Cassé / réparé** : les scores restaient noirs alors qu'ils portaient bien
  `var(--color-business)`. Cause : Tailwind v4 n'émet une variable de `@theme` que si une
  classe l'utilise, et rien ne l'utilisait — les variables d'axe sont maintenant déclarées
  en CSS direct, où rien ne peut les élaguer. Le test de bout en bout qui interdisait toute
  couleur hors saison encodait la règle périmée : il vérifie désormais qu'aucune teinte
  n'est écrite en dur, et qu'un axe porte bien sa propre teinte.
- **Manqué** : j'ai commité une première fois avec un test de bout en bout rouge, ce que la
  définition de « terminé » interdit — l'assertion sur les couleurs n'acceptait que le
  préfixe `var(--color-`, alors que les teintes d'axe passent par `var(--axis-`. Corrigé
  dans le commit suivant. La leçon est de lire la sortie des cinq commandes avant de
  commiter, pas après.
- **Incertain** : le bandeau de saison n'est pour l'instant qu'une barre colorée sans nom.
  Il lui faut deux mots — ÉTÉ, AUTOMNE — pour que l'idée « on lit le temps passer » se
  comprenne. À traiter avec la carte de jour en T09.

## 10 septembre 2026 — R01, revue et design (en cours de validation)

- Accueil relié à la démonstration ; hiérarchie commune, navigation des jours, sélection d’axe, un grand score et détails dépliables, sans nouvelle palette ni dépendance.
- Corrigés : variables de polices non utilisées, dates civiles/fuseaux invalides acceptés, dates fixes qualifiées d’aujourd’hui, ruban invisible lors du double montage React ; tests de validation reproduits en échec avant correction.
- Restent : tests UI Playwright bloqués par Chromium absent, contrôle mobile et limites fonctionnelles documentées dans docs/03-revue-design.md ; aucune fusion ni mise en production.
## T07 — Le quiz, cinq écrans

- **Fait** : logique de validation pure et testée dans `lib/quiz/steps.ts`, cinq écrans à
  une question chacun, autocomplétion de ville sur l'index local, et l'avancement par
  **graduation du ruban qui s'étend** — elle prend la couleur de l'axe dès qu'il est choisi,
  si bien que le produit répond avant même d'avoir calculé. Six tests de bout en bout :
  parcours complet, heure inconnue, graduation, clavier seul, absence de débordement, et
  couleur de focus.
- **Cassé / réparé** : le champ heure affichait le surlignage bleu de Chrome et une bague
  de focus de deux pixels qui écrasait la question — les champs portent maintenant leur
  focus par le filet du bas, qui s'épaissit et passe à l'encre pleine, et l'accent du
  navigateur est ramené à l'encre. Deux attentes de test corrigées en conséquence, dont
  l'une, sur la révélation du ruban, était **instable** : elle lisait `sessionStorage` avant
  l'hydratation. Elle attend désormais le marqueur au lieu de le supposer posé.
- **Incertain** : la carte du quiz est très haute sur un grand écran, avec beaucoup de vide
  sous le bouton. Acceptable sur téléphone, à revoir si le parcours se joue aussi sur
  ordinateur.

## T08, T09, T10 — Le tunnel complet

- **Fait** : l'écran de calcul affiche les **vraies valeurs** renvoyées par le calcul —
  position du Soleil à l'heure de naissance, conversion en UTC, Ascendant, nombre réel de
  combinaisons testées et d'aspects retenus — et ne dure pas plus longtemps que le calcul.
  La carte de jour montre un seul grand nombre, celui de l'axe choisi au quiz, et une seule
  phrase. Les jours rares donnent l'âge à la dernière occurrence. Le constructeur de phrases
  est déterministe et vérifié en sortie : formules de voyance et lexique médical sur l'axe
  Énergie déclenchent un repli neutre. Quatre écrans extraits en composants partagés, les
  pages Next n'en sont plus que des enrobages.
- **Cassé / réparé** : un test a montré que la carte citait les deux aspects **deux fois**,
  une fois en liste technique et une fois dans la phrase. Le brief demande que la phrase les
  cite : la liste passe derrière un « Le détail », avec l'orbe et la traduction de l'aspect,
  comme l'exige le budget de densité. Deux attentes de test corrigées : la demande se lit
  désormais dans la session et non dans un affichage de mise au point, et l'espace des
  milliers de `toLocaleString('fr-FR')` est une espace insécable étroite qu'un espace
  ordinaire ne peut pas apparier.
- **Incertain** : le fuseau de résidence est celui de la ville de naissance. C'est presque
  toujours vrai, jamais garanti — à demander explicitement le jour où ça compte.

## Recette — la page autonome

- **Fait** : `npm run standalone` produit un unique fichier HTML de 2,1 Mo qui fait tourner
  le tunnel entier dans le navigateur — moteur d'éphémérides, index de villes et leurs
  fuseaux, scoring, jours rares. Aucun appel réseau, donc rien de simulé : c'est le même
  code que la version servie, à travers les mêmes composants d'écran. Vérifié de bout en
  bout sous Playwright, du prénom aux jours rares, sans une seule erreur de console.
- **Cassé / réparé** : la mise en commun a été faite avant l'emballage plutôt qu'après —
  les quatre écrans sont des composants partagés et les pages Next n'en sont que des
  enrobages, ce qui évite deux versions du tunnel qui divergent.
- **Incertain** : le paquet embarque React et l'index complet des villes. Deux mégaoctets
  conviennent à une recette, pas à une page servie sur mobile : la version en production
  garde ses routes serveur.

- Intégration du commit concurrent 98534ed : questionnaire conservé, titres remis en mono conformément à la nouvelle consigne ; 165 tests après intégration.

## Intégration de la revue de Codex — PR 2

- **Fait** : fusion de `codex/design-review`, un seul conflit, sur le journal, résolu en
  gardant les deux entrées. Trois corrections réelles reprises : `Date.parse` acceptait le
  31 février et calculait un thème pour le 3 mars **sans rien dire** ; un fuseau inconnu
  passait la validation pour échouer au fond du moteur ; et le double montage du mode strict
  de React annulait la frame de révélation, laissant le clip du ruban à zéro — ruban
  invisible en développement. L'accueil et la démonstration remaniés sont repris tels quels,
  avec leur navigation par jour, leurs trois boutons d'axe et leurs mesures dépliables.
  Les tests navigateur, que Codex ne pouvait pas lancer faute de Chromium, passent : 28.
- **Cassé / réparé** : deux défauts trouvés à la vérification visuelle mobile, invisibles sur
  ordinateur. Les noms des douze signes se **chevauchaient** à 412 px — six colonnes pour
  des mots de dix lettres —, passés à quatre puis trois colonnes, avec un test qui compare
  les rectangles deux à deux. Et l'accueil menait à la démonstration alors que l'entrée du
  produit est le questionnaire : bouton principal vers `/quiz`, démonstration en lien
  secondaire. Deux recoutures de fusion : `standalone.css` définit désormais les variables
  de familles que `next/font` fournit côté serveur, sans quoi la typographie de la page
  autonome retombait en bloc sur la police par défaut ; et le libellé du premier jour
  devient un paramètre — « AUJ. » dans le produit, où la fenêtre commence aujourd'hui,
  « J1 » sur la démonstration à dates fixes.
- **Incertain** : la revue ajoute une soixantaine de lignes de CSS écrites à la main à côté
  des classes utilitaires employées partout ailleurs. Ça fonctionne et c'est cantonné à deux
  pages, mais ce sont deux façons de styler dans le même dépôt. À trancher avant que la
  seconde ne se répande. Le diagnostic sur les polices était par ailleurs inexact ici :
  `--font-geist-mono` résout vers `"Geist Mono"`, donc le nom littéral fonctionnait — le
  changement reste meilleur, puisqu'il apporte la police de repli métrique.
