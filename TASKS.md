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

- [ ] **T01 — Revenir aux tables d'axes du brief, et paramétrer la fenêtre.** (45 min)
      Les tables de `scoring.ts` et `transits.ts` reviennent aux quatre transits et quatre
      points natals du brief. La fenêtre devient un paramètre de premier plan avec 30 jours
      par défaut. Voir Q3.
      *Fini quand* : les tests de scoring passent sur 30 jours, la mesure d'élargissement
      reste documentée, et `comparisonsTested` reflète la nouvelle table.

- [ ] **T02 — Les deux aspects explicatifs, exposés proprement.** (60 min)
      `AxisDay` expose `explaining: [DayAspect, DayAspect]` — les deux plus fortes
      contributions **en valeur absolue**, pas les deux plus positives. Chacun porte planète
      en transit, aspect, point natal, orbe, contribution signée, et un libellé en clair
      (« trigone à ton Soleil », jamais « trigone au Lion »).
      *Fini quand* : un test prend un jour à score bas et vérifie que les deux aspects
      retournés sont bien les deux aspects durs qui l'ont fait tomber, sur dix thèmes.

- [ ] **T03 — `rarity.ts`.** (90 min)
      Classe de rareté par période orbitale (Lune jamais mise en avant → Pluton
      exceptionnel). Pour tout aspect classé rare ou au-dessus : balayage mensuel sur ±60
      ans autour de la naissance, affinage au jour, **dernière occurrence convertie en âge
      de la personne**, prochaine occurrence en année. Cache mémoire par clé
      `thème + aspect`.
      *Fini quand* : sur le thème de référence, Jupiter conjonction Soleil rend un âge
      cohérent avec la périodicité de 12 ans, et un test vérifie qu'aucune rareté n'est
      inventée quand la période n'en contient pas.

- [ ] **T04 — Base de villes et recherche.** (75 min)
      Script de construction : `all-the-cities` → index compact (francophonie ≥ 1 000 hab,
      reste du monde ≥ 50 000), écrit dans `data/`. Recherche côté serveur : insensible aux
      accents et à la casse, tolérante au tiret, classée par population, dix résultats.
      Voir Q5.
      *Fini quand* : « boulogne-b », « BOULOGNE BILLANCOURT » et « boulogne billancourt »
      rendent tous Boulogne-Billancourt en tête, et la recherche répond en moins de 10 ms.

## Phase 2 — le chemin complet, de bout en bout

- [ ] **T05 — Contrat d'API et calcul serveur.** (60 min)
      Schéma `zod` du formulaire, route `POST /api/reading` qui résout l'instant de
      naissance, calcule le thème, le rapport sur 30 jours et les raretés, et rend un objet
      sérialisable unique. Erreurs explicites — ville inconnue, date invalide, heure
      impossible.
      *Fini quand* : un test d'API couvre le cas nominal, l'heure inconnue et trois entrées
      invalides.

- [ ] **T06 — Le ruban, en composant isolé.** (90 min)
      Trois bandes, trois tracés distincts, lavis saisonnier continu calé sur les équinoxes
      réels, graduation, glyphe minuscule sur les pics, révélation par `clip-path` une fois
      par session. Page de démonstration alimentée par un vrai rapport.
      *Fini quand* : capture Playwright conforme à `DESIGN.md`, lisible à 375 px, sans
      débordement horizontal, et rendu identique sous `prefers-reduced-motion`.

- [ ] **T07 — Le quiz, cinq écrans.** (90 min)
      Prénom, date, heure — avec la phrase du brief et la case « je ne la connais pas » —,
      ville avec autocomplétion, axe prioritaire. Avancement par **graduation du ruban qui
      s'étend**, pas de barre de progression. Une question par écran, transition immédiate.
      *Fini quand* : parcours complet au clavier seul, focus visible, et un test e2e qui
      remplit les cinq écrans.

- [ ] **T08 — L'écran de calcul honnête.** (60 min)
      Les vraies étapes avec les vraies valeurs renvoyées par le calcul : position du
      Soleil à l'heure de naissance, Ascendant, fenêtre de transits, nombre réel de
      combinaisons testées et d'aspects retenus. Dure le temps du calcul, jamais une fausse
      attente.
      *Fini quand* : un test e2e vérifie qu'au moins une valeur affichée provient bien de la
      réponse d'API et non d'une constante.

- [ ] **T09 — La carte de jour.** (90 min)
      Date en registre technique, axe prioritaire déplié avec ses deux aspects et sa phrase,
      les deux autres axes repliés à leur score. Phrases par **gabarits déterministes**
      montés sur `lib/copy/blocks.ts` — voir Q6. Signe de contribution affiché, jamais la
      valeur brute.
      *Fini quand* : un jour à score bas affiche deux contributions négatives, et le premier
      emploi de chaque terme technique est suivi de sa traduction.

- [ ] **T10 — L'écran « Les jours rares ».** (75 min)
      Uniquement les aspects classés rares ou au-dessus. Pour chacun : notation technique,
      date, dernière occurrence **traduite en âge**, prochaine occurrence. Si la période n'en
      contient aucun, le dire franchement et afficher le prochain à venir.
      *Fini quand* : un test couvre le cas « aucune rareté sur la période » et vérifie
      qu'aucune rareté n'est fabriquée.

> **À la fin de T10, l'objectif de la section 0 est atteint.** Relire `BRIEF.md` §0 et le
> vérifier point par point sur un téléphone avant d'entamer la phase 3.

## Phase 3 — le fini

- [ ] **T11 — Scrub et retour haptique.** (75 min)
      Le doigt déplace un curseur sur le ruban, la carte se met à jour en direct. Vibration
      de 8 ms au franchissement d'un pic, silencieuse là où l'API n'existe pas, désactivée
      sous `prefers-reduced-motion`.

- [ ] **T12 — Défilement magnétique et pastille « aujourd'hui ».** (60 min)
      Les cartes s'accrochent une à une. La pastille reste visible et ramène au jour courant
      en un tap, où qu'on soit dans les 30 jours.

- [ ] **T13 — Compteurs, accessibilité, LCP.** (75 min)
      Scores animés de 0 à leur valeur, une seule fois. Passe complète : contrastes, focus,
      ordre de tabulation, cibles tactiles de 44 px. LCP mesuré sous 2 s.

- [ ] **T14 — Génération des textes par le modèle.** (90 min)
      Surcouche sur les gabarits : `claude-sonnet-4-6` côté serveur, aspects exacts en
      entrée, prénom injecté hors du prompt pour que le cache soit partagé. Cache en base.
      **Filtre santé déterministe en sortie**, avec repli sur le gabarit si déclenchement.
      *Fini quand* : un test injecte une sortie contenant un terme médical et vérifie que
      l'utilisateur reçoit le gabarit à la place.

- [ ] **T15 — Image de partage.** (60 min)
      `@vercel/og` réutilisant la géométrie du ruban : une seule source de vérité entre
      l'écran et le PNG. Prénom et marque, rien d'autre.

- [ ] **T16 — Persistance.** (75 min)
      Table `readings` sur Supabase, écriture après calcul, lecture par identifiant pour
      revenir sur un rapport. Repli local propre quand les identifiants ne sont pas
      configurés, sans faire échouer le parcours.

---

## Hors périmètre de cette session

Paywall, Stripe, Resend, PDF, fenêtre de 90 jours, landing, compte utilisateur.
