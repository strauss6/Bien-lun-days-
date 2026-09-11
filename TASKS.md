# Tâches

Une seule en cours à la fois. Une tâche n'est terminée que si `typecheck`, `lint`, `test`,
`build` et `e2e` passent tous les cinq.

L'ordre vise **l'objectif de la section 0 du brief le plus tôt possible** : le moteur et ses
tests, puis le chemin complet de bout en bout, puis le fini visuel et les
micro-interactions. Les phases 1 et 2 suffisent à atteindre l'objectif ; la phase 3 rend le
produit vendable.

---

## Fait avant ce plan

- [x] **T00 — Cadrage.** `BRIEF.md`, `CLAUDE.md`, `DESIGN.md`, `QUESTIONS.md`, `JOURNAL.md`,
      les cinq commandes câblées, Next 15 + Tailwind 4 + ESLint + Playwright en marche.
- [x] **T00a — Fuseau historique.** `zone.ts` et `time.ts` : offsets candidats, précision à
      la seconde, trous et heures ambiguës détectés. 8 cas dont Paris Mean Time 1911 et la
      France occupée 1943.
- [x] **T00b — Thème natal.** 10 planètes, ASC, MC, DSC, FC, maisons en signes entiers.
      Axes validés par la géométrie et non par un thème recopié.
- [x] **T00c — Aspects, transits, scoring.** Orbes, courbe d'exactitude, poids par axe,
      normalisation robuste, marge de lissage, jour de l'exact.
- [x] **T00d — Les douze glyphes et les jetons de couleur.** Polylignes uniquement, règle
      testée.
- [x] **T00e — Corpus d'interprétation.** 555 emplacements, 32 briques, 60 exemples,
      classement par fréquence mesurée, classeur de rédaction livré.

---

## Phase 1 — le moteur, complet et juste

- [x] **T01 — Revenir aux tables d'axes du brief, et paramétrer la fenêtre.** (45 min)
      Les tables de `scoring.ts` et `transits.ts` reviennent aux quatre transits et quatre
      points natals du brief. La fenêtre devient un paramètre de premier plan avec 30 jours
      par défaut. Voir Q3.
      *Fini quand* : les tests de scoring passent sur 30 jours, la mesure d'élargissement
      reste documentée, et `comparisonsTested` reflète la nouvelle table.

- [x] **T02 — Les deux aspects explicatifs, exposés proprement.** (60 min)
      `AxisDay` expose `explaining: [DayAspect, DayAspect]` — les deux plus fortes
      contributions **en valeur absolue**, pas les deux plus positives. Chacun porte planète
      en transit, aspect, point natal, orbe, contribution signée, et un libellé en clair
      (« trigone à ton Soleil », jamais « trigone au Lion »).
      *Fini quand* : un test prend un jour à score bas et vérifie que les deux aspects
      retournés sont bien les deux aspects durs qui l'ont fait tomber, sur dix thèmes.

- [x] **T03 — `rarity.ts`.** (90 min)
      Classe de rareté par période orbitale (Lune jamais mise en avant → Pluton
      exceptionnel). Pour tout aspect classé rare ou au-dessus : balayage mensuel sur ±60
      ans autour de la naissance, affinage au jour, **dernière occurrence convertie en âge
      de la personne**, prochaine occurrence en année. Cache mémoire par clé
      `thème + aspect`.

      **Regroupement des passages rétrogrades — exigence, pas détail.** Une planète lente
      repasse deux ou trois fois sur le même degré en quelques mois pendant sa
      rétrogradation. Ce sont des passages du **même** événement. Le prototype de la
      planche de validation les comptait séparément et annonçait « la dernière fois, tu
      avais 31 ans » pour un Pluton sur l'Ascendant qui n'est en réalité arrivé qu'une
      seule fois — le mensonge exact que le brief interdit, sur la fonctionnalité la plus
      vendeuse du produit. Fenêtre de regroupement retenue dans le prototype : 6 ans
      au-delà de 60 ans de période orbitale, 4 ans au-delà de 20, 2 ans en deçà.

      Quand le balayage ne trouve rien avant, on écrit **« jamais auparavant »**, on
      n'extrapole pas.

      *Fini quand* : sur le thème de référence, Jupiter conjonction Soleil rend 2015 et
      l'âge de 21 ans, Saturne trigone Soleil rend 2016 et 23 ans, Saturne opposition
      Jupiter rend 1997 et 3 ans ; Neptune conjonction Lune et Pluton sextile Ascendant
      sont marqués « une seule fois dans une vie » sans date antérieure ; et un test
      vérifie que deux passages rétrogrades du même transit ne comptent jamais pour deux
      événements.

- [x] **T04 — Base de villes et recherche.** (75 min)
      Script de construction : `all-the-cities` → index compact (francophonie ≥ 1 000 hab,
      reste du monde ≥ 50 000), écrit dans `data/`. Recherche côté serveur : insensible aux
      accents et à la casse, tolérante au tiret, classée par population, dix résultats.
      Voir Q5.
      *Fini quand* : « boulogne-b », « BOULOGNE BILLANCOURT » et « boulogne billancourt »
      rendent tous Boulogne-Billancourt en tête, et la recherche répond en moins de 10 ms.

## Phase 2 — le chemin complet, de bout en bout

- [x] **T05 — Contrat d'API et calcul serveur.** (60 min)
      Schéma `zod` du formulaire, route `POST /api/reading` qui résout l'instant de
      naissance, calcule le thème, le rapport sur 30 jours et les raretés, et rend un objet
      sérialisable unique. Erreurs explicites — ville inconnue, date invalide, heure
      impossible.
      *Fini quand* : un test d'API couvre le cas nominal, l'heure inconnue et trois entrées
      invalides.

- [x] **T06 — Le ruban, en composant isolé.** (90 min)
      Trois bandes, trois tracés distincts, lavis saisonnier continu calé sur les équinoxes
      réels, graduation, glyphe minuscule sur les pics, révélation par `clip-path` une fois
      par session. Page de démonstration alimentée par un vrai rapport.
      *Fini quand* : capture Playwright conforme à `DESIGN.md`, lisible à 375 px, sans
      débordement horizontal, rendu identique sous `prefers-reduced-motion`, et **aucune
      légende ni libellé de mode de tracé** — règle 5 du budget de densité.

- [x] **T07 — Le quiz, cinq écrans.** (90 min)
      Prénom, date, heure — avec la phrase du brief et la case « je ne la connais pas » —,
      ville avec autocomplétion, axe prioritaire. Avancement par **graduation du ruban qui
      s'étend**, pas de barre de progression. Une question par écran, transition immédiate.
      *Fini quand* : parcours complet au clavier seul, focus visible, et un test e2e qui
      remplit les cinq écrans.

- [x] **T08 — L'écran de calcul honnête.** (60 min)
      Les vraies étapes avec les vraies valeurs renvoyées par le calcul : position du
      Soleil à l'heure de naissance, Ascendant, fenêtre de transits, nombre réel de
      combinaisons testées et d'aspects retenus. Dure le temps du calcul, jamais une fausse
      attente.
      *Fini quand* : un test e2e vérifie qu'au moins une valeur affichée provient bien de la
      réponse d'API et non d'une constante.

- [x] **T09 — La carte de jour.** (90 min)
      Date en registre technique, axe prioritaire déplié avec ses deux aspects et sa phrase,
      les deux autres axes repliés à leur score. Phrases par **gabarits déterministes**
      montés sur `lib/copy/blocks.ts` — voir Q6. Signe de contribution affiché, jamais la
      valeur brute.
      *Fini quand* : un jour à score bas affiche deux contributions négatives, le premier
      emploi de chaque terme technique est suivi de sa traduction, et le **budget de densité
      passe** — un seul nombre au-dessus de 24 px, quarante-cinq mots de texte courant au
      maximum, orbes et signes masqués jusqu'au tap. Test de bout en bout sur les règles 3
      et 4.

- [x] **T10 — L'écran « Les jours rares ».** (75 min)
      Uniquement les aspects classés rares ou au-dessus. Pour chacun : les deux planètes et
      l'aspect **en toutes lettres**, la date, la dernière occurrence **traduite en âge**,
      la prochaine occurrence. Si la période n'en
      contient aucun, le dire franchement et afficher le prochain à venir.
      *Fini quand* : un test couvre le cas « aucune rareté sur la période » et vérifie
      qu'aucune rareté n'est fabriquée.

> **À la fin de T10, l'objectif de la section 0 est atteint.** Relire `BRIEF.md` §0 et le
> vérifier point par point sur un téléphone avant d'entamer la phase 3.

## Phase 3 — le fini

- [x] **T11 — Scrub et retour haptique.** (75 min)
      Le doigt déplace un curseur sur le ruban, la carte se met à jour en direct. Vibration
      de 8 ms au franchissement d'un pic, silencieuse là où l'API n'existe pas, désactivée
      sous `prefers-reduced-motion`.

- [x] **T12 — Défilement magnétique et pastille « aujourd'hui ».** (60 min)
      Les cartes s'accrochent une à une. La pastille reste visible et ramène au jour courant
      en un tap, où qu'on soit dans les 30 jours.

- [x] **T13 — Compteurs, accessibilité, LCP.** (75 min)
      Scores animés de 0 à leur valeur, une seule fois. Passe complète : contrastes, focus,
      ordre de tabulation, cibles tactiles de 44 px. LCP mesuré sous 2 s.

- [ ] **T14 — Génération des textes par le modèle.** (90 min)
      Surcouche sur les gabarits : `claude-sonnet-4-6` côté serveur, aspects exacts en
      entrée, prénom injecté hors du prompt pour que le cache soit partagé. Cache en base.
      **Filtre santé déterministe en sortie**, avec repli sur le gabarit si déclenchement.
      *Fini quand* : un test injecte une sortie contenant un terme médical et vérifie que
      l'utilisateur reçoit le gabarit à la place.

- [x] **T15 — Image de partage.** (60 min)
      `@vercel/og` réutilisant la géométrie du ruban : une seule source de vérité entre
      l'écran et le PNG. Prénom et marque, rien d'autre.

- [ ] **T16 — Persistance.** (75 min)
      Table `readings` sur Supabase, écriture après calcul, lecture par identifiant pour
      revenir sur un rapport. Repli local propre quand les identifiants ne sont pas
      configurés, sans faire échouer le parcours.

---

## Direction produit du 11 septembre 2026 — bêta ouverte

Le brief de bêta remplace les consignes contradictoires sur la période affichée, la
monétisation et le parcours. Voir l'encadré en tête de `BRIEF.md`.

- [x] **B01 — Scores stables entre toutes les vues.** (120 min)
      Étalonnage par thème sur une période de référence fixe, indépendant de la fenêtre
      affichée, versionné par `SCORE_METHOD`. Deux dépendances à la fenêtre trouvées et
      corrigées : la mise à l'échelle, et le « jour de l'exact » fabriqué aux bords de la
      période calculée. Voir `QUESTIONS.md` Q12.

- [x] **B02 — Aujourd'hui comme écran d'entrée.** (90 min)
      `/` ouvre sur la journée, toujours. Trois onglets — aujourd'hui, demain,
      après-demain — qui avancent avec la date locale de résidence. Changement d'axe
      immédiat sur la même journée. Le ruban n'est plus sur cet écran.

- [x] **B03 — Le mois en vue secondaire.** (45 min)
      `/mois` garde le ruban, le rail aimanté, le scrub et les jours rares. Pleinement
      accessible, rien de verrouillé. `/jours` renvoie vers elle.

- [x] **B04 — Profil gardé sur l'appareil.** (75 min)
      Une nouvelle visite retrouve le profil sans repasser par le questionnaire et rouvre
      sur aujourd'hui. Fuseau de résidence distinct du fuseau historique de naissance,
      réveil au passage de minuit, correction des données de naissance, effacement.

- [x] **B05 — Une lecture qui assume la durée.** (60 min)
      Ce qui commence, se prolonge, culmine ou se relâche, et l'écart avec la veille
      quand il est net. Déterministe : deux ouvertures du même jour donnent le même texte.

- [x] **B06 — Bêta discrète et honnête.** (45 min)
      Mention « Bêta » près du nom. Aucune pression commerciale, vérifiée par un test sur
      tous les écrans. Les jours rares ne disent plus que ce qui a été calculé.

- [x] **B08 — Le score global du jour, porté par la Lune.** (90 min)
      Trois quarts Lune sur les quatorze points du thème, un quart la moyenne des axes.
      Étalonné comme les autres, donc stable d'une vue à l'autre. Compte des combinaisons
      corrigé au passage. Voir `QUESTIONS.md` Q13.

## Reste à faire

- [ ] **B07 — Canal de retour.** Bloqué : aucun canal réel n'est configuré. Voir Q10.
- [ ] **T14 — Génération des textes par le modèle.** Bloqué : corpus et clé d'API.
- [ ] **T16 — Persistance serveur.** Bloqué : identifiants Supabase. Le profil vit pour
      l'instant sur l'appareil, et l'interface le dit.

## Hors périmètre de cette session

Paywall, Stripe, Resend, PDF, fenêtre de 90 jours, vue hebdomadaire, compte utilisateur.

## Revue demandée le 10 septembre 2026

- [ ] **R01 — Vérifier l’existant et améliorer son design.** Implémentation et vérification
      des types, lint, 165 tests et build effectués ; contrôles interactifs distants.
      Reste : suite e2e complète sur un environnement équipé de Chromium, validation
      visuelle mobile. T07 a été livré par Claude pendant la revue ; T08–T16 restent ouverts.
