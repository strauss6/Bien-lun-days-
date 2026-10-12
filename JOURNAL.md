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

## T11 · T12 — Le doigt sur le ruban, les cartes aimantées

**Fait.** Le ruban accepte un geste : une surface de capture au-dessus des trois bandes,
`dayAtX` pour convertir l'abscisse en jour — par cases, pas par centres, le jour change à
mi-chemin entre deux colonnes —, et une poignée ronde pour que le doigt ait une cible.
Vibration de 8 ms au franchissement d'un pic, décidée par `crossesPeak`, qui inspecte
**tous les jours traversés** et non la seule destination : un scrub rapide saute cinq
colonnes par frame. Les trente jours vivent maintenant dans un rail aimanté — une carte
par jour, `scroll-snap` natif, donc l'inertie du système et non une réimplémentation.
Ruban et rail pilotent le même index dans les deux sens.

**Cassé, réparé.** Trois choses. Le rail portait la gouttière : la carte suivante dépassait
de 20 px dans la marge et l'on voyait deux jours à la fois — la gouttière est passée sur la
carte. La pastille « aujourd'hui », flottante en bas d'écran, se posait **sur** le bouton
« Les jours rares », noir sur noir : elle a rejoint la ligne de date, à la place où iOS met
« Aujourd'hui », en contour et non en aplat pour laisser un seul noir plein par écran. Et
lire le jour courant par une mise à jour fonctionnelle d'état faisait vibrer deux fois en
Strict Mode — un `ref` a réglé ça.

**Incertain.** Le retour haptique n'a jamais été senti : `navigator.vibrate` n'existe pas
sur iOS Safari, qui est la moitié de la cible, et l'environnement de test n'a pas de
téléphone. Le test prouve que la vibration est *demandée* au bon moment, pas qu'elle a
lieu. À vérifier sur un Android réel avant de compter dessus.

## T13 — Compteurs, accessibilité, LCP

**Fait.** Les scores montent de zéro à leur valeur en 750 ms, une seule fois par session,
sur une décélération exponentielle — l'essentiel du trajet dans le premier tiers du temps,
puis un accostage. La courbe est une fonction pure, testée ; le déclenchement est dans le
composant. Passe d'accessibilité mesurée et non affirmée : quatre tests de bout en bout
comptent les cibles sous 44 px, suivent l'ordre de tabulation et lisent le contour de
focus élément par élément. Le contraste, lui, se vérifie sur les jetons en test unitaire —
c'est là qu'il se décide. LCP mesuré au `PerformanceObserver` sur la construction de
production : **100 ms** sur l'accueil, **80 ms** sur le quiz, pour un budget de 2 s.

**Cassé, réparé.** Le contraste a trouvé un vrai défaut : les grands nombres portaient la
teinte vive de leur axe, et `#FF9500` sur blanc donne **2,2:1** — sous le seuil du grand
texte, sous celui du texte courant. Ils emploient désormais le jeton `text` de chaque axe,
qui existait pour ça. Deux cibles tactiles étaient trop petites : « Le détail » à 16 px de
haut et « Retour aux trente jours » à 17 px ; toutes deux à 44 px, sans que le dessin
change, par marge négative. Le premier essai mettait le résumé en `flex`, ce qui a fait
disparaître le triangle de dépliage : il est revenu en `block`.

**Incertain.** Le 51 de l'axe Énergie lit maintenant brun à côté d'une bande orange. C'est
conforme et lisible, mais la carte et le ruban ne parlent plus tout à fait de la même
couleur — question `Q9`, à trancher avec la direction artistique. Et le budget LCP est
tenu très large : la machine d'intégration n'est pas un téléphone sur un réseau ordinaire,
et un seuil serré rendrait le test capricieux plutôt qu'utile.

## Q9 — La famille Énergie assombrie, les nombres rendus à leur couleur

**Fait.** Décision de direction artistique appliquée : plutôt que d'éteindre les nombres,
on assombrit la famille pour qu'elle les mérite. `#FF9500` devient **`#D46700`** — 3,7:1
sur blanc, 3,4:1 sur le papier, franchement orange. Tous les scores de la carte retrouvent
la teinte vive de leur axe ; seuls les libellés gardent le jeton `text`. Les scores
secondaires passent en gras : à 20 px, c'est le poids qui les fait entrer dans la catégorie
« grand texte » de la norme, donc dans le seuil que la teinte vive tient.

**Cassé, réparé.** Le premier essai n'a changé que `deep`. Le dégradé allait alors de la
rouille au lime en traversant le kaki, et la bande Énergie du ruban lisait **olive** — sale
à côté du bleu et du rose, l'inverse du but. `bright` est passé de `#B8E62E` à `#FFC24B` :
la famille se referme sur l'ambre, la bande redevient chaude. Le test de contraste, qui
vérifiait jusque-là que l'orangé vif **échouait**, vérifie maintenant que les trois teintes
vives **passent** le seuil du grand texte : l'attente a changé parce que la décision a
changé, et le commentaire du test le dit.

**Incertain.** L'ambre de l'axe Énergie et le pêche de l'axe Amour se rapprochent à
l'extrémité lumineuse de leurs dégradés. Ils restent séparés par la teinte à l'autre bout,
rouille contre magenta, et par le tracé — pile de tirets contre double filet. À revoir si
quelqu'un confond les deux bandes sur un vrai téléphone.

## T15 — L'image de partage

**Fait.** Route `GET /api/partage` qui rend un PNG de 1200 × 630 : le ruban, un prénom, la
marque. `next/og` est fourni par Next, donc aucune dépendance ajoutée. Le ruban est produit
par `ribbon-svg.ts`, qui appelle **les mêmes fonctions de géométrie que l'écran** — un test
compare abscisse par abscisse les marques du SVG à celles que `bandMarks` calcule, donc une
correction d'un côté ne peut plus manquer de l'autre.

L'adresse ne porte **que ce qui se dessine** : les trente hauteurs de barres et les saisons,
99 octets, 132 caractères de base64url. Recalculer le ruban depuis la date, l'heure et la
ville aurait été plus court à écrire et aurait fait de chaque lien partagé une fuite de
données intimes — une adresse d'image circule dans des fils de discussion, des historiques,
des aperçus de messagerie.

**Cassé, réparé.** Trois choses, toutes vues à l'image et non au test. Le bandeau de saison
sortait **vert printemps** sur un ruban de septembre : l'encodeur remplaçait silencieusement
une saison absente par la première de la liste. Il lève maintenant une erreur, et un test
couvre exactement ce cas. Le ruban était **décentré** dans un cadre symétrique, parce que la
gouttière réservée aux noms d'axes restait vide : le `viewBox` cadre désormais sur la seule
zone de tracé — une fenêtre différente, pas une géométrie différente, et le test des
abscisses le prouve. Enfin la police : Satori n'a ni `next/font` ni navigateur, il lui faut
des octets. Geist Mono est versionnée dans `assets/fonts`, sous licence SIL Open Font avec
la licence qui l'accompagne, et déclarée dans `outputFileTracingIncludes` — sans quoi elle
manquerait à la première requête en production, une panne invisible avant déploiement.

**Reste.** Le bouton qui mène à l'image n'existe pas : il faut une adresse partageable,
donc la persistance, donc T16. La route et l'encodage sont complets et testés ; il ne
manque que l'endroit d'où l'on clique.

## Direction bêta — aujourd'hui d'abord, scores stables

**Fait.** Le produit s'ouvre sur la journée : `/` rend l'écran quotidien, trois onglets
avancent avec la date locale de résidence, le changement d'axe est immédiat et le ruban a
déménagé dans `/mois`. Le profil vit sur l'appareil : une nouvelle visite le retrouve,
rouvre sur aujourd'hui, et l'écran « Mes données » dit franchement qu'il n'y a pas de
compte et que rien ne suivra sur un autre téléphone. Un réveil est armé sur le prochain
minuit local. Aucune pression commerciale nulle part, vérifiée par un test qui balaie tous
les écrans. La lecture du jour dit maintenant ce qui commence, dure, culmine ou se relâche.

**Cassé, réparé.** Le défaut de fond était dans le moteur. L'échelle des scores était
dérivée de la fenêtre affichée : un même jour changeait de valeur selon la vue, et changeait
encore le lendemain. Elle est désormais calculée une fois par thème sur 780 jours à partir
d'une époque fixe. Mais la mise à l'échelle n'était pas la seule coupable : aux deux
extrémités de la période calculée, un aspect était marqué « jour de l'exact » faute de
voisin — un voisin absent comptant comme infiniment loin. Cette majoration fabriquée fuyait
dans la fenêtre par le lissage. Corrigée, et la marge passée de un à deux jours pour que le
bord ne puisse plus atteindre le premier jour affiché. Un jour vaut maintenant exactement
la même chose vu de neuf fenêtres différentes, au bit près.

Trois autres défauts trouvés par les tests plutôt que par l'œil. Le nom de marque et
« Mes données » étaient des cibles tactiles de 36 et 17 px. Le questionnaire attendait le
stockage local avant d'afficher quoi que ce soit : écran blanc au chargement, et premier
contenu affiché mesuré à zéro. Et la continuité concluait « ça se relâche » au dernier jour
de toute fenêtre, faute de lendemain calculé — un texte faux, écrit pour tout le monde le
même jour.

**Incertain.** L'étalonnage ne voit qu'une configuration de Jupiter et Saturne : un thème
consulté en 2031 sera mesuré contre une distribution de 2026. C'est assumé et documenté en
Q12, mais c'est le choix à revoir en premier si les scores paraissent durablement ternes.
L'index des douze signes a quitté l'accueil — une roue du zodiaque sur le premier écran est
le signal « horoscope générique » que le produit refuse — et la règle des polylignes est
désormais vérifiée sur les glyphes du ruban, là où ils servent encore.

## Le score du jour, porté par la Lune

**Fait.** La journée a désormais son propre score, en tête de l'écran quotidien, à côté de
la date. Trois quarts viennent de la Lune suivie sur les **quatorze** points du thème —
là où chaque axe n'en regarde que quatre —, un quart de la moyenne des trois axes déjà
calibrés. La Lune est la seule planète dont le passage se mesure en heures : elle boucle
le zodiaque en vingt-sept jours et croise tout le thème chaque mois. Mesuré sur six
thèmes, le score du jour bouge de 1,3 à 1,7 fois plus que l'axe le plus mobile et deux à
quatre fois plus que l'axe Business — c'est ce qui fait qu'un jeudi ne ressemble pas à un
vendredi. Sous le score, le contact lunaire du jour en toutes lettres, et quand il n'y en
a aucun, l'interface l'écrit.

**Cassé, réparé.** Le nombre de combinaisons annoncé à l'écran de calcul était faux : il
additionnait les paires axe par axe sans retirer les doublons — la Lune sur le Soleil natal
sert à l'amour et à l'énergie et n'est calculée qu'une fois. Il annonçait 7 200 pour 41
paires réelles. Il est maintenant dérivé des paires réellement calculées : 49 depuis que la
Lune vise tout le thème, soit 7 350. Trois tests entérinaient l'ancien compte ; ils
comparent désormais au calcul, plus à une constante recopiée.

**Incertain.** Le score du jour peut contredire les trois axes — le 19 septembre 2026 sort
à 28 quand les axes sont à 86, 84 et 81, la Lune passant en carré à la Lune natale. C'est
l'information, pas un défaut, mais c'est le genre d'écart qui se lit comme une panne : la
ligne de contact lunaire est là pour l'expliquer, et `LUNAR_SHARE` est le réglage si la
direction produit veut adoucir. Il est aussi bien plus sensible au fuseau de résidence que
les axes : 71 à Paris contre 83 en UTC pour la même date. Tout est en Q13.

## Corpus — première livraison

**Fait.** Dix briques avaient été demandées, dix-neuf sur trente-deux sont revenues, plus
une quantité de matière consignée dans `docs/05-corpus-livraison-1.md`. Trois consignes de
ton en sont tirées et inscrites dans les règles permanentes : on écrit « difficile » et
jamais « mauvais » ; rien n'est une fatalité ; un bon aspect ne promet aucun résultat tout
seul. Les trois sont vérifiées par des tests sur le corpus et sur les phrases produites.

**Cassé, réparé.** Deux erreurs du produit corrigées par le rédacteur. Vénus « rendait la
négociation facile et le prix acceptable » : faux, c'est Mercure qui gouverne les contrats
et les signatures ; Vénus, c'est le sentimental et l'amical. Et le carré et l'opposition
étaient traités comme deux nuances d'« aspect difficile » alors qu'ils disent deux choses
distinctes — le carré est un blocage, l'opposition est un doute entre deux choix. Un test
recopiait par ailleurs les verdicts mot pour mot : il tombait à chaque livraison alors que
rien n'était cassé, il vérifie maintenant l'invariant.

Deux défauts de ma propre rédaction attrapés par les tests que je venais d'écrire : une
brique à 52 mots pour un budget de 45, et le mot « insurmontable » dans la brique du carré.

**Écarté.** Le rôle de Mars en astrologie médicale, fourni spontanément. L'axe Énergie ne
parle jamais de santé ; un test vérifie désormais qu'aucune brique de Mars ni de l'axe
Énergie ne contient de terme médical.

**Incertain.** Le contexte de vie change la consigne — en couple ou seul, ce n'est pas le
même conseil pour le même calcul — et le produit ne le connaît pas : la brique Amour dit
les deux cas et s'en trouve diluée. Q14. Les maîtres de maison et la planète dominante,
qu'il tient pour centraux, ne sont pas implémentés. Et sa palette de saisons place l'hiver
en blanc là où la nôtre le met en bleu : trois saisons sur quatre concordent, la quatrième
attend un arbitrage — Q16.

## Corpus « complet » — correction, et provenance rendue lisible

**Fait.** Deuxième livraison du rédacteur — les mots-clés de chaque planète — qui ferme les
treize briques restées en amorce. **Les trente-deux sont écrites.** Mercure devient la
communication avant tout, Vénus gagne les plaisirs et la famille, Mars le versant physique,
Saturne son « c'est carré », Uranus l'inventeur et l'informatique, Neptune le rêve. Les
quatre axes du thème sont écrits depuis les maisons correspondantes données la veille.

**Cassé, réparé.** Rien n'était cassé : quelque chose manquait. Le rédacteur a donné de
Pluton une lecture exacte en astrologie et impubliable — une échéance vitale selon l'âge de
la personne. Un filtre global refuse maintenant le vocabulaire de la mort sur tous les axes,
et non sur le seul axe Énergie. Recherche par frontière de mot : « amortir », « immortel »
et « mortier » contiennent tous « mort » et restent permis, « la fin d'un chapitre » aussi
— c'est précisément la formulation qu'on veut pouvoir écrire.

**Correction.** J'ai annoncé « trente-deux briques sur trente-deux ». C'est vrai au sens où
chacune a un texte, et trompeur au sens qui compte. Le compte réel : **douze** portent les
mots du rédacteur en réponse à la question posée, **quinze** transposent un mot-clé de
planète d'une question vers une autre, **cinq** n'ont aucune réponse derrière elles.

Les quinze sont le vrai point faible, et l'erreur est la mienne : j'ai employé le même
mot-clé pour « ce que la planète fait quand elle passe » et pour « ce qu'elle représente
dans le thème » — la distinction que le brief envoyé au rédacteur présentait lui-même comme
le cœur du produit. Sept planètes sont dans ce cas des deux côtés.

Chaque brique porte désormais un champ `source` — `direct`, `dérivé`, `inféré` — que le
générateur devra lire : une brique dérivée est une hypothèse, pas de la parole d'auteur. Le
compte est figé par un test, pour qu'une livraison future le fasse bouger visiblement au
lieu de laisser croire que le corpus est plus solide qu'il n'est. Les cinq briques à
redemander en priorité — forte fréquence de lecture et provenance faible — sont listées dans
`docs/05-corpus-livraison-1.md`.

**Incertain.** Deux notions de méthode sont consignées sans être implémentées. « Uranus
important » désigne une **planète dominante**, collée au Soleil ou à un angle : c'est la
troisième fois qu'il y revient, et le moteur ne la connaît pas. Et le sexe se lit sur deux
planètes — Vénus pour la séduction, Mars pour le physique — distinction que les trois axes
actuels ne savent pas porter.

## La page autonome remise au niveau du produit

**Fait.** La version autonome — celle qu'on ouvre sur un téléphone sans rien déployer — était
restée sur l'ancien parcours : questionnaire, puis les trente jours. Elle suit maintenant le
produit : aujourd'hui d'abord, les trois onglets, le score du jour, le mois en vue
secondaire, les jours rares, mes données, et le profil gardé sur l'appareil. Elle emploie
**les mêmes écrans** que la version servie, pas des copies.

Deux coutures, toutes deux déclarées. `setReadingSource` remplace l'appel à la route serveur
par un calcul local — même moteur, appelé depuis le navigateur. Et un routeur minimal à
fragment d'adresse remplace `next/link` et `next/navigation` à la construction, ce qui fait
marcher le bouton retour du téléphone, la première chose qu'on essaie sur mobile.

**Cassé, réparé.** Rien n'était visiblement cassé, et c'est justement le problème qu'on a
évité : la construction réussissait toujours, mais les écrans partagés importaient le
routeur de Next, absent de cette page. Les alias de construction règlent le cas au lieu de
le laisser exploser au premier clic.

**Vérifié.** Parcours complet piloté au navigateur sur le fichier construit : questionnaire,
calcul, les trois jours, changement d'axe, mois, jours rares, rechargement — le profil est
retrouvé et la page rouvre sur aujourd'hui — et bouton retour. Aucune erreur JavaScript. Le
score du jour bouge de 53 à 34 à 45 sur trois jours pendant que l'axe Business reste à
73, 73, 76 : c'est le comportement recherché, visible à l'œil.

**Incertain.** Les polices viennent de Google Fonts, donc la page a besoin du réseau pour
avoir sa typographie — le texte reste lisible sans, sur la pile de repli. Une version
vraiment hors-ligne demanderait de les embarquer en base64, ce qui doublerait le poids du
fichier.


## 15 septembre 2026 — les jours rares disent quand, et arrêtent de se répéter

**Fait.** Trois reproches du test sur téléphone, trois corrections. (1) « Actif sur toute la
période » ne voulait rien dire : `orbSpan()` calcule maintenant la vraie plage d'un aspect —
début, fin, durée, jour où l'orbe est le plus serré. Pluton en conjonction à l'Ascendant
donne « du 18 novembre 2021 au 26 mars 2027 · 5 ans et 4 mois, au plus près le 22 décembre
2024, à 0°01' ». (2) Les phrases se répétaient : six variantes de verdict par axe et par
polarité, choisies par empreinte déterministe sur l'événement et non sur la date. « Elle ne
viendra pas te trouver assis » est supprimée ; l'image du 15 septembre la remplace — « une
paire d'as en main ne rapporte rien si tu ne mises pas ». (3) L'écran des jours rares ne
disait pas ce qu'un transit signifie : `rareMeaning()` compose la phrase depuis les trois
briques du corpus — ce que la planète fait, ce qu'elle touche, ce que l'angle impose.

**Cassé, réparé.** Quatre fois, et chaque fois par la même cause : une phrase de brique
arrachée à son contexte. Le découpage au tiret fabriquait des moitiés de phrase (« à toi de
la lever »), les phrases suivantes d'une brique reprennent la précédente par le début (« Et
l'endroit où tu en fais trop ») ou par la fin (« Ce qu'on néglige aussi »), certaines
conditionnent à une polarité que l'angle contredit (« bien touchée, l'intérieur suit » sous
un carré), et certaines posent un deux-points là où le gabarit en pose déjà un. Un filtre
unique couvre les quatre cas, appliqué aux trois briques, avec un repli qui garde le côté
porteur de sens quand tout serait écarté. Huit tests le tiennent. Le test de bout en bout
attendait la cadence en minuscule : elle ouvre maintenant la ligne d'histoire, donc avec une
majuscule — attente corrigée, pas contournée, et deux assertions ajoutées sur les dates.

**Incertain.** La brique de Saturne n'a **qu'une seule** phrase utilisable sur trois : les
deux autres conditionnent à la polarité. Résultat, « Saturne, c'est le temps, donc les
obstacles et les retards » ouvre encore trois cartes sur six. Même limite pour Uranus, Mars,
Vénus et Pluton. Ce n'est pas un défaut du code mais du corpus : ce sont exactement les dix
réponses courtes en attente — ce qu'une planète **fait en passant**, distinct de ce qu'elle
**représente dans le thème**. Tant qu'elles manquent, la variété vient des trois autres
morceaux de la phrase, pas de l'ouverture.

## 17 septembre 2026 — la comparaison de deux thèmes

**Fait.** `lib/astro/synastry.ts` croise les planètes d'un thème avec les quatorze points
de l'autre, dans les deux sens, en réutilisant les aspects, les orbes et la polarité du
reste du moteur. Pas de dimension temps : deux thèmes ne bougent pas l'un par rapport à
l'autre, donc ni fenêtre, ni étalonnage, ni risque qu'un lien change de valeur selon
l'écran. La grille du rédacteur est encodée telle quelle, y compris ce qu'il tient pour
le plus dur. `lib/copy/relation.ts` porte le corpus relationnel — dix planètes, trois
voix — et `/duo` rend le livrable qu'il a demandé : trois choses à faire, trois à éviter,
et le point dur. Aucune note sur dix : il dit qu'une note rate l'intérêt.

**Cassé, réparé.** Quatre défauts, tous trouvés par mesure ou par test, aucun à l'œil.
(1) Les axes comptaient double : le Soleil ressortait en conjonction au Descendant *et*
en opposition à l'Ascendant, le même fait dans les deux colonnes avec des verdicts
contraires — un axe ne compte plus que par une extrémité, et le choix de laquelle est
consigné en Q17. (2) Le même contact se lisait deux fois, et la polarité suivant la
planète qui agit, l'un sortait positif et l'autre négatif ; un seul lien par paire de
points, le plus lourd gagne. (3) Le départage des ex æquo dépendait de qui était la
personne A : comparer Élioth à Marie ne donnait pas le même résultat que Marie à Élioth,
pour un ciel identique. Il est désormais intrinsèque au lien. (4) Le conseil désignait la
mauvaise personne — « ça vient chercher la sensibilité de Marie » là où la sensibilité
touchée était celle du lecteur ; c'est ce qui a imposé les trois voix plutôt qu'une.
Deux mots interdits par les règles du projet, « mauvais » et « seul », ont été attrapés
par les tests après avoir été écrits — dont un que j'avais réintroduit en corrigeant
l'autre.

**Incertain.** Le corpus relationnel n'a aucune brique de la main du rédacteur : une est
`dérivé`, neuf sont `inféré`, et un test l'empêche de se présenter autrement. Q18 liste
les cinq à lui demander en premier. Par ailleurs la seconde personne ne peut pas encore
renseigner ses données elle-même — on les saisit pour elle, ce qui couvre le cas courant
mais pas celui de deux personnes qui ne sont pas dans la même pièce.

## 29 septembre 2026 — le trimestre

**Fait.** Le produit calcule quatre-vingt-dix jours en une seule fois, et le mois en lit
les trente premiers : un calcul, trois vues, aucune occasion de diverger. Ça ne coûte
rien — 1,5 s contre 1,9 s, 213 Ko contre 78 Ko — parce que la dépense d'un rapport est
l'étalonnage de 780 jours, fait une fois par thème, jamais la fenêtre. `lib/astro/periods.ts`
découpe chaque axe en fenêtres d'au moins sept jours du même côté de la ligne neutre de
la personne, et `/trimestre` les rend datées des deux bouts, avec leur durée en clair et
le jour où c'est le plus net.

**Cassé, réparé.** Cinq fois. (1) L'écran affichait trente jours sous un titre qui en
promettait quatre-vingt-dix : trois appelants demandaient la fenêtre chacun de leur côté
et un n'avait pas suivi — celui du questionnaire, donc celui qui produit le rapport
enregistré. Un seul point de décision désormais, `readingBody`. (2) Le ruban à
quatre-vingt-dix jours donnait des colonnes de 2 px séparées de 1,6 px de vide : sous la
largeur d'un trait, un vide ne se voit plus et le ruban devenait un peigne sale. Un vide
franc ou pas de vide — le trimestre est contigu, le mois n'a pas bougé d'un pixel.
(3) Les graduations hebdomadaires donnaient treize étiquettes sur 324 px ; elles passent
au mois au-delà de quarante-cinq jours. (4) Deux fenêtres basses sortaient mot pour mot
identiques : l'ouverture et le geste étaient tirés avec la même clé, donc ils se
déplaçaient ensemble. (5) J'ai écrit « Rien d'irrémédiable » — un mot que le projet
interdit en sortie, négation comprise ; le test l'a attrapé.

Trois tests de bout en bout échouaient pour des attentes devenues fausses, pas pour des
régressions. Le plus instructif figeait « Jupiter en conjonction à ton Soleil » comme
phrase du jour : vrai le 15 septembre, faux le 29, Jupiter étant sorti d'orbe. Un test qui
fige un aspect du ciel échoue à date fixe sans que rien n'ait cassé. Il vérifie désormais
la règle du produit — un aspect vise un point natal nommé, jamais un signe.

**Vérifié par la mesure, pas par l'intention.** Les trente jours communs au mois et au
trimestre portent exactement les mêmes scores, les mêmes scores lunaires et les mêmes
phrases, et la ligne neutre ne bouge ni avec la longueur de la fenêtre ni avec la date
d'ouverture. C'est ce que l'étalonnage du 11 septembre avait été écrit pour garantir ; le
trimestre était l'occasion de le vérifier pour de bon, et il tient.

**Incertain.** Le seuil de sept jours et le rang « meilleure fenêtre », calculé sur la
moyenne et non sur la durée, sont des choix de produit pris seul. Q19 les expose. Par
ailleurs l'écran des jours rares couvre maintenant le trimestre et non plus le mois : il y
trouve dix-neuf aspects au lieu de seize, ce qui est plus juste puisqu'il parle de
planètes lentes, mais la pastille du mois annonce ce nombre sous une vue de trente jours.

## 11 octobre 2026 — l'heure de naissance devient obligatoire

**Fait.** Décision produit, prise après une mesure : sur un thème réel, calculer sur midi
au lieu de l'heure exacte déplace l'Ascendant du Verseau à la Balance, le Milieu du Ciel
du Scorpion au Cancer, bouge les axes de 9 points en moyenne et jusqu'à 49, et fait
tomber les jours rares de 18 à 8. Ce n'était pas une version dégradée du produit, c'en
était un autre — et l'inverse de ce qu'il vend. La contrainte se tient dans le contrat
`ReadingRequest` et non dans le seul questionnaire : un schéma qui accepte encore
l'absence d'heure finit par la recevoir, par un brouillon d'avant la règle ou par un
appel direct à l'API. L'heure est exigée des deux côtés d'une comparaison, puisque le
moteur écarte les angles dès qu'il en manque un.

La case « je ne la connais pas » devient un dépliant **qui dit où la trouver** : même
geste, résultat inverse. Replié par défaut, donc hors budget de densité pour qui n'en a
pas besoin.

**Cassé, réparé.** Le compilateur a listé les neuf appelants à reprendre, ce qui a rendu
la bascule mécanique. Quatre tests de bout en bout échouaient : trois encodaient
l'ancienne règle et ont été réécrits à l'envers — l'heure obligatoire, l'absence de case,
le dépliant qui s'ouvre. Le quatrième était une dérive de date déguisée en régression :
`getByText('LE JOUR')` fait une recherche de sous-chaîne insensible à la casse, et la
phrase d'interprétation du jour contenait « le jour ». Corrigé en `exact: true`.

**Incertain.** Les profils enregistrés sans heure sont refusés au chargement et renvoyés
au questionnaire ; ils ne sont pas migrés en silence sur midi, ce qui donnerait un
Ascendant faux sous le nom de la personne. Le chemin dégradé du moteur — `anglesReliable`
et les poids réduits — est **conservé** : c'est un garde-fou de correction, pas une
fonctionnalité, et supprimer du comportement moteur testé n'est pas une décision à
prendre seul. Il n'a simplement plus de chemin pour être atteint depuis le produit.

## 11 octobre 2026 — les maisons entrent dans les scores

**Fait.** Le moteur calculait les douze maisons depuis le début et ne les relisait jamais :
le mot `house` n'apparaissait nulle part dans le calcul, et `rulers.ts` n'était appelé que
par un test. Trois phrases du rédacteur sont désormais du code. « Le domaine dépend de la
maison touchée » : chaque point natal est modulé par la maison qu'il occupe, d'au plus
30 %. « Si la maison 7 tombe en Cancer, son maître est la Lune, un bon aspect à la Lune est
alors un bon aspect sur un partenariat » : les maîtres des maisons de chaque axe s'ajoutent
à ses points natals. Et ses quatre maisons importantes servent de maisons principales, ses
autres de secondaires — sa mise en garde étant de ne pas s'en tenir aux quatre.

Conséquence voulue : **les poids ne sont plus les mêmes pour tout le monde.** Sur le thème
de référence, Pluton entre à 0,50 en Business — il gouverne la maison 10 et y siège —, le
Soleil passe de 0,60 à 1,10 en Amour — il gouverne la maison 7 et y siège —, et Jupiter
natal tombe de 0,60 à 0,42, puisqu'il est en maison 9, étrangère à la carrière. En maisons
signes entiers, tout cela ne dépend que du signe ascendant : c'est l'heure de naissance,
rendue obligatoire la veille, qui l'achète.

**Cassé, réparé.** Le fond de maison — une planète lente qui traverse une maison de l'axe —
a été mis dans le score, puis retiré le même jour. Trois constats : une constante sur neuf
mois ne distingue aucun jour et l'étalonnage la réabsorbe (9 → 10 sur 100) ; un jour est
devenu le plus bas de sa fenêtre alors que ses deux aspects affichés étaient positifs, donc
le score portait une composante invisible à l'écran ; et il existait déjà un endroit pour
ce genre de fait, `AxisReading.backdrop`, qui restitue ce que la normalisation absorbe. Le
fond s'y dit maintenant en toutes lettres, sur l'écran du trimestre. Un test m'a refusé la
première version, et il avait raison.

**Incertain.** Les trois dosages — part du maître de maison, plancher d'affinité, maisons
secondaires par axe — sont de nous et pas de lui : Q20 les expose. Et le fond de maison ne
réconcilie pas les chiffres avec sa lecture : l'axe Business du thème de référence reste
bas sur l'année, parce que le score dit « ce jour comparé à ta journée médiane » quand
l'astrologue dit « cette année en absolu ». Q21 pose la question de savoir si le produit
doit porter la seconde lecture, et sous quelle forme.

## 11 octobre 2026 (soir) — les maîtres de maison étaient muets

**Fait.** Correction d'un défaut introduit le matin même. Les maîtres de maison entraient
bien dans `effectiveNatalWeights`, mais `accumulate` ne parcourait que `AXIS_NATALS`, la
liste fixe de l'axe, et `allPairs` ne calculait de cases que pour ces paires-là. Résultat :
Pluton pesait 0,50 en Business sur le thème de référence et n'a jamais été lu une seule
fois. Trois points par axe étaient déclarés et muets. `allPairs` prend désormais le thème
et ajoute les paires des maîtres ; l'accumulation parcourt les points réellement pondérés.

Le compteur de combinaisons devient propre au thème : 49 paires génériques, 63 pour celui
de référence, soit 28 350 combinaisons sur un trimestre au lieu de 22 050. C'est plus
honnête — le chiffre est montré comme un fait, il doit être celui du thème calculé.

Effet mesuré : l'axe Business du thème de référence **descend**, de 9 à 3 le 11 octobre.
La correction fait entrer Jupiter en carré au Pluton natal à 1,18°, exactement l'aspect que
le rédacteur avait nommé de son côté.

**Cassé, réparé.** Trois tests comparaient le compteur affiché à `comparisonsTested(jours)`
sans thème. L'attente était devenue fausse puisque le compte dépend du signe ascendant :
elle prend maintenant le thème.

**Incertain.** Le rédacteur a corrigé la méthode le même soir, et sa remarque porte plus
loin que ce correctif. Voir `QUESTIONS.md` Q22 et Q23 : nos orbes sont plus serrés que les
siens, et surtout une journée ne se juge pas d'abord sur les planètes lentes.

## 11 octobre 2026 (nuit) — les bons aspects de Saturne valent plein tarif

**Fait.** Le rédacteur, le soir : « Saturne, c'est Kronos, le dieu du temps — mais Saturne
symbolise aussi ce qui se construit. Un bon aspect de Saturne à ton Soleil, pendant des
mois, c'est très constructif. » Le barème disait l'inverse : trigone de Saturne à 0,60
quand celui de Jupiter valait 1,00, et opposition à plein tarif — une planète pénalisée une
fois et demie plus du bon côté que du mauvais. Et le corpus tenait déjà la réponse depuis
le 13 septembre : « en bon aspect, c'est ce qui rend son travail très constructif » pour
Saturne, « on gagne ce qu'on engage » pour Mars. Le moteur contredisait le corpus qu'il
sert. La malédiction porte désormais sur la seule conjonction — « Jupiter ouvre, Saturne
ralentit », sa phrase aussi — et plus sur les angles harmoniques.

**Cassé, réparé.** Un test nommé « les harmoniques de Saturne comptent, mais moins »
encodait l'erreur. Son attente était fausse, et elle l'était depuis l'origine : corrigée,
pas contournée, avec les deux citations en commentaire.

**Incertain, et c'est le point important.** La correction **n'améliore pas** le score de
l'axe Business : 112 jours au-dessus du neutre sur l'année, contre 94 après. Rendre Saturne
plus juste améliore aussi la période de référence, donc la position relative ne bouge pas.
C'est la troisième correction d'affilée dans ce cas — maisons, maîtres de maison, Saturne.
Ce n'est plus une coïncidence : le score dit « comparé à ta journée médiane » quand
l'astrologue dit « favorable en soi ». Q24 pose la question, qui est de produit et non de
moteur.

## 11 octobre 2026 (nuit, suite) — une difficulté nomme un domaine, et se contre

**Fait.** Le rédacteur, sur le Saturne opposé au Jupiter natal : « ça veut dire tout
simplement qu'il faut faire attention à tout ce qui est d'ordre juridique, administratif.
Mais si tu fais attention, c'est bien, tu vas pouvoir contrer l'aspect qui montre ces
difficultés, sur ce plan. » Trois choses que le produit ne disait pas : un aspect difficile
nomme un **domaine** — celui de la maison où loge le point natal touché —, ce domaine se
**surveille**, et la difficulté est **circonscrite** à ce plan.

`AxisReading.backdrop`, le transit lent dominant, existait depuis l'origine et n'était
affiché nulle part — le même oubli que les maîtres de maison le matin. Il remonte
maintenant jusqu'à l'écran du trimestre, avec la maison touchée, son domaine et le geste.
Sur le thème de référence : « Saturne en opposition à ton Jupiter · maison 9 — fais
attention à tout ce qui est d'ordre juridique et administratif. »

**Cassé, réparé.** Le fond lent était choisi sur `durée × poids`, ce qui ignore
l'exactitude : un aspect large mais installé battait un aspect quasi exact. Business
sortait « Jupiter en carré à ton Milieu du Ciel » là où l'astrologue désignait le Saturne à
deux centièmes de degré. Le critère devient la somme des contributions absolues, qui
combine d'elle-même durée, poids et proximité à l'exact — et le moteur désigne désormais le
même aspect que lui.

**Incertain.** Onze vigilances sur douze sont de nous ; seule la maison 9 porte ses mots.
Q25 les liste et pose la question suivante : la vigilance devrait-elle dépendre aussi de la
planète qui forme l'aspect, et pas seulement de la maison touchée ?
