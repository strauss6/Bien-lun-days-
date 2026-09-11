> **Direction produit révisée le 11 septembre 2026.** Ce qui suit reste la référence
> pour le moteur, le ton, les contraintes de contenu et la direction artistique. Trois
> points sont **remplacés** par la nouvelle direction, et c'est elle qui gagne :
>
> | Point | Ancien brief | Direction du 11 septembre 2026 |
> |---|---|---|
> | Période affichée | trente jours, écran d'entrée | **aujourd'hui**, écran d'entrée ; demain et après-demain à un geste ; les trente jours en vue secondaire, `/mois` |
> | Monétisation | paywall, rapport long payant | **aucune** — bêta ouverte, tout ce qui est fait est accessible, rien à déverrouiller |
> | Parcours | questionnaire → ruban trente jours | questionnaire → **journée** ; le profil est gardé sur l'appareil et une nouvelle visite rouvre sur aujourd'hui |
>
> S'y ajoute une exigence qui n'existait pas : **un même jour porte le même score dans
> toutes les vues et d'un jour à l'autre**. Elle a imposé de refaire la mise à l'échelle
> des scores — voir `lib/astro/calibration.ts` et `QUESTIONS.md` Q12.

# Bien.Luné — Mes meilleurs jours

> Brief de référence, fourni par le commanditaire. En cas de contradiction entre ce
> document et une décision d'implémentation, ce document gagne, et l'écart doit être
> tracé dans `QUESTIONS.md`.

Tu es lead développeur et directeur artistique sur ce projet. Tu construis un produit destiné à la vente, pas une démo. Tu travailles en autonomie : ce document contient tout ce dont tu as besoin.

---

# 0. L'objectif de cette session

À la fin de cette session de travail, je dois pouvoir, sur mon téléphone :

1. Entrer mon **prénom, ma date de naissance, mon heure de naissance et ma ville de naissance**
2. Obtenir mes **30 prochains jours en détail**
3. Voir, pour chaque jour, **un score par axe** (Business, Amour, Énergie)
4. Voir, pour chaque score, **les deux aspects qui l'expliquent**, formulés simplement
5. Voir un écran **« Les jours rares »** qui met en avant les aspects exceptionnels de la période

Tout ça doit fonctionner **de bout en bout, avec de vrais calculs**, dans une interface déjà belle et finie.

Ce qui n'est **pas** dans le périmètre de cette session : le paiement, le paywall, l'envoi d'email, les 90 jours, le PDF. On y viendra après. **Priorise le chemin complet en 30 jours, pas les fonctionnalités périphériques.**

---

# 1. Le produit

Un site qui calcule le **thème natal réel** d'une personne — date, heure et lieu de naissance — puis lui indique, jour par jour, ses meilleurs et ses pires jours sur trois axes :

- **Business** — négocier, lancer, signer, demander
- **Amour** — rencontrer, se déclarer, réconcilier
- **Énergie** — pousser fort, ou lever le pied

Le positionnement tient en une phrase, et il doit se sentir partout dans le produit :

> L'horoscope des magazines est écrit pour 8 millions de personnes. Celui-ci est calculé pour l'heure et la ville exactes de ta naissance.

C'est un produit de **précision**, pas de mysticisme.

## Le tunnel complet, à terme

Landing → quiz → calcul → aperçu gratuit 7 jours → paywall 19 € → rapport complet 90 jours.

Cette session ne construit que : **quiz → calcul → 30 jours en détail.**

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind
- Postgres via Supabase — table `readings` : id, prénom, date/heure/lieu de naissance, lat, lng, timezone, positions natales en JSONB, statut paiement, email
- Stripe Checkout, paiement unique — plus tard
- Resend pour l'envoi du rapport — plus tard
- Déploiement Vercel

---

# 2. Le moteur astro — le cœur, ne le bâcle pas

## Éphémérides

Utilise **`astronomy-engine`** (licence MIT).

N'utilise **pas** Swiss Ephemeris : sa licence est AGPL ou commerciale payante, incompatible avec un produit vendu. C'est une contrainte bloquante, ne la contourne pas, même si une autre bibliothèque semble plus pratique.

## Fuseau horaire historique

L'heure saisie est locale. Il faut la convertir en UTC avec le fuseau **en vigueur à cette date à cet endroit** — heure d'été comprise, changements historiques compris.

1. Ville → lat/lng via une base statique GeoNames `cities5000` importée en base. Pas d'API tierce.
2. lat/lng → fuseau IANA via `tz-lookup`
3. Conversion avec `luxon` à la date de naissance

Une erreur d'une heure décale l'Ascendant de ~15° et rend tout le produit faux. Écris des tests sur au moins 5 cas connus, dont une naissance pendant un changement d'heure et une naissance en France avant 1945.

## Thème natal

Soleil, Lune, Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune, Pluton, plus **Ascendant** et **Milieu du Ciel**, dérivés du temps sidéral local, de la latitude et de l'obliquité.

Maisons en **signes entiers** (whole sign). N'implémente pas Placidus.

## Scoring des jours

Pour chaque jour, calcule les positions en transit et leurs aspects aux points natals.

Aspects et orbes : conjonction 0° (±6), sextile 60° (±4), carré 90° (±5), trigone 120° (±5), opposition 180° (±6). Pondère par la proximité à l'exact — un aspect à 0,5° pèse bien plus qu'à 5°.

| Axe | Planètes en transit | Points natals visés |
|---|---|---|
| Business | Jupiter, Saturne, Mercure, Soleil | Soleil, MC, Mercure, Jupiter |
| Amour | Vénus, Mars, Lune, Jupiter | Vénus, Lune, Descendant, Soleil |
| Énergie | Mars, Soleil, Lune, Saturne | Ascendant, Soleil, Mars, Lune |

Harmoniques en positif, aspects durs et conjonctions à Saturne ou Mars en négatif.

**Normalise chaque axe sur 0–100 par rapport à la distribution propre de cette personne sur la période**, jamais sur une échelle absolue. Sinon la moitié des utilisateurs reçoivent un rapport plat et le produit ne vaut rien. Chacun doit avoir ses pics et ses creux.

## Les deux aspects qui expliquent le score — obligatoire

Pour **chaque jour et chaque axe**, conserve les deux aspects dont la **contribution en valeur absolue** est la plus forte. Ce sont eux qui expliquent le score, qu'il soit haut ou bas.

Attention, c'est un point souvent raté : on ne garde pas les deux aspects les plus **positifs**, on garde les deux qui ont le plus **pesé**. Un jour à 12/100 doit afficher les deux aspects durs qui l'ont fait tomber si bas.

Chaque aspect conservé porte : planète en transit, type d'aspect, point natal visé, orbe exact, contribution signée.

Structure le moteur dans `/lib/astro/` en fonctions pures et testables : `natal.ts`, `transits.ts`, `aspects.ts`, `scoring.ts`, `rarity.ts`.

## Rareté d'un aspect

Un aspect est d'autant plus marquant que la planète en transit est lente. Calcule pour chaque aspect une **fréquence de retour**, à partir de la période de la planète :

| Planète en transit | Retour approximatif | Traitement |
|---|---|---|
| Lune | plusieurs fois par mois | jamais mis en avant |
| Soleil, Mercure, Vénus | une fois par an | mention discrète |
| Mars | tous les 2 ans | notable |
| Jupiter | tous les 12 ans | rare |
| Saturne | tous les 29 ans | très rare |
| Uranus, Neptune, Pluton | une ou deux fois dans une vie | exceptionnel |

Pour tout aspect classé rare ou au-dessus, calcule par balayage d'éphémérides **la dernière occurrence** du même aspect et **la prochaine**. Convertis la dernière occurrence en **âge de la personne à ce moment-là**. C'est la donnée la plus forte du produit :

> Jupiter trigone à ton Soleil. La dernière fois, tu avais 19 ans. La prochaine sera en 2038.

Balayage par pas mensuels sur ±60 ans, affiné ensuite au jour. Mets le résultat en cache : c'est coûteux et ça ne change jamais.

## Texte des jours

Pour les meilleurs et les pires jours de chaque axe, génère une phrase qui **cite les deux aspects retenus** puis dit quoi en faire concrètement.

Format de référence — court, précis, sans jargon inexpliqué :

> **Jupiter trigone à ton Soleil, et Vénus trigone à ta Lune.** Deux ouvertures le même jour. C'est un jour pour demander, pas pour attendre.

Règle de nommage : un aspect vise toujours **un point natal**, jamais un signe. On écrit « trigone à ton Soleil », jamais « trigone au Lion ».

API Anthropic (`claude-sonnet-4-6`) côté serveur, avec les aspects exacts en entrée. Ton direct, concret, adulte. Interdits : « les astres te sourient », « l'univers t'envoie un signe », « attention aux énergies négatives ».

Mets les textes en cache en base : une même combinaison d'aspects produit toujours la même phrase.

---

# 3. Direction artistique

## L'idée directrice

Une seule tension porte tout le design :

> **Le calcul est futuriste. L'interprétation est millénaire.**

L'interface ressemble à un instrument de mesure moderne : précis, net, numérique. Les mots qu'elle affiche sonnent anciens. Ce contraste est le sujet du design, pas un effet de style.

- Tout ce qui relève du **calcul** — chiffres, degrés, dates, coordonnées, noms d'aspects — est traité de façon technique, dense, tabulaire, alignée.
- Tout ce qui relève de l'**interprétation** est composé dans un serif avec de l'histoire, en colonne étroite, généreusement interligné.

Ces deux registres ne se mélangent jamais dans un même bloc. Ils se font face.

Une graisse technique pour les données est ici un choix justifié par le sujet : si tu t'en sers, sers-t'en partout où il y a de la mesure, et nulle part ailleurs.

## Les glyphes du zodiaque

Les 12 signes sont le système graphique du produit.

**Traitement** : dessinés en **contour uniquement**, trait fin et constant, construits à partir de petits segments — une facture de tracé technique, proche d'un plan ou d'un tracé vectoriel. Jamais remplis, jamais en dégradé, jamais illustratifs.

Dessine-les toi-même en SVG, ne prends pas une police de symboles astrologiques. Grille commune, épaisseur identique, même boîte optique pour les douze.

**Règle capitale** : les glyphes indiquent **où se trouvent les planètes**, jamais l'identité de l'utilisateur. On n'écrit nulle part « Tu es Balance ». Tout le positionnement repose sur le fait que le signe solaire ne dit presque rien — l'interface ne doit pas le contredire. Les glyphes sont des graduations, comme sur une règle.

## Couleur — le système saisonnier

La couleur d'un signe est celle de la saison où le Soleil le traverse :

| Saison | Signes | Teinte |
|---|---|---|
| Printemps | Bélier, Taureau, Gémeaux | Vert |
| Été | Cancer, Lion, Vierge | Jaune |
| Automne | Balance, Scorpion, Sagittaire | Rouge |
| Hiver | Capricorne, Verseau, Poissons | Bleu |

Quatre teintes **saturées mais justes**, qui tiennent ensemble sans se battre. Ni quatre primaires sorties d'une boîte de feutres, ni quatre pastels fades. Elles doivent rester lisibles en petits aplats, côte à côte, sur fond neutre.

**La couleur ne sert qu'à ça.** Pas de couleur de bouton, pas d'accent de marque, pas de couleur d'état. Le reste de l'interface vit sur deux valeurs : un fond et une encre. Toute la vivacité chromatique vient du zodiaque, et de rien d'autre.

## Le ruban

C'est l'élément mémorable du produit.

- Trois bandes horizontales empilées, une par axe
- **Les axes ne se distinguent pas par la couleur** mais par la forme, la texture et la position — la couleur reste réservée aux saisons
- Le ruban traverse une ou deux saisons : sa teinte de fond glisse lentement le long de sa longueur, du vert au jaune par exemple. **On lit le passage du temps dans la couleur.**
- Chaque jour est une colonne fine dont l'intensité varie
- Les pics portent un glyphe en contour, minuscule, de la planète concernée

## Interdits

- Ciel étoilé, dégradés violet ou indigo, constellations, lune décorative, tarot
- Glyphes pleins, en dégradé, ou issus d'une police de symboles
- Toute mention du type « Tu es [signe] »
- Couleur employée ailleurs que pour le système saisonnier
- Fond crème avec serif contrasté et accent terracotta
- Étiquettes en MAJUSCULES espacées au-dessus des titres
- Cartes arrondies identiques avec la même ombre grise douce
- Animations d'entrée fade-and-slide sur chaque section
- Une flèche « → » collée au texte des boutons

---

# 4. Expérience — ce qui fait la différence

## La leçon de Co-Star

Co-Star échoue sur trois points précis. Ne les répète pas.

1. **Trop d'informations par écran.** Chez nous : **une seule idée par écran.** Un jour, un score, deux raisons. C'est tout.
2. **Du jargon non traduit.** Chez nous : un terme technique n'apparaît jamais seul la première fois. « Trigone » est suivi une fois de sa traduction en clair, puis peut être employé seul.
3. **Des fonctionnalités sociales qui ne servent à rien.** Chez nous : **aucun système d'amis, aucun flux, aucune notification sociale.** On ne construit rien qui ne serve pas à répondre « qu'est-ce que je fais aujourd'hui ».

On veut avoir l'air **savant sans être compliqué**. La rigueur se montre dans les chiffres affichés, pas dans le vocabulaire.

## Les micro-interactions à construire

Six, pas trente. Chacune sert la compréhension, aucune n'est décorative.

1. **Le scrub du ruban.** Le doigt glisse sur le ruban, le détail du jour se met à jour en direct sous le doigt — comme les graphiques d'Apple Santé. C'est l'interaction signature du produit.
2. **Le retour haptique aux pics.** Une vibration brève quand le doigt passe sur un jour à fort score. Utilise l'API Vibration là où elle existe, dégrade en silence ailleurs. On **sent** ses bons jours avant de les lire.
3. **Les compteurs qui montent.** Les scores s'animent de 0 à leur valeur au premier affichage, une seule fois. Ça fait exister le calcul.
4. **Le défilement magnétique.** Les cartes de jour s'accrochent une à une. On ne se perd jamais entre deux jours.
5. **La pastille « aujourd'hui ».** Toujours visible, toujours à un tap de distance, où qu'on soit dans les 30 jours.
6. **L'écran de calcul honnête.** 4 à 6 secondes, avec les vraies étapes qui défilent : `Position du Soleil au 14 mars 1991, 14h07`, `Ascendant 22° Vierge`, `Transits sur 30 jours`, `1 214 aspects analysés`. Des chiffres réels issus du calcul, jamais une fausse attente.

Respecte `prefers-reduced-motion` : dans ce mode, tout reste utilisable sans animation.

## L'écran « Les jours rares »

Un écran dédié, et c'est notre meilleur argument.

On y liste, sur la période, uniquement les aspects classés rares ou au-dessus. Pour chacun :

- Les deux planètes et le type d'aspect, en registre technique
- La date
- **La dernière fois que c'est arrivé, traduit en âge** : « la dernière fois, tu avais 19 ans »
- **La prochaine fois** : « la prochaine, en 2038 »

S'il n'y a aucun aspect rare sur la période, l'écran le dit franchement et affiche le prochain à venir, même s'il est dans huit mois. **On ne fabrique jamais de fausse rareté.** L'honnêteté est ce qui rend la rareté crédible quand elle arrive.

---

# 5. Le parcours à construire dans cette session

## Quiz — une question par écran

1. Prénom
2. Date de naissance
3. **Heure de naissance** — sous le champ : `Deux heures d'écart changent tout le thème. C'est ici que 99 % de l'astrologie s'arrête.` Case « je ne la connais pas » qui bascule sur midi, avec mention honnête que la précision sera moindre.
4. Ville de naissance, avec autocomplétion
5. Ce qui compte le plus en ce moment : Business / Amour / Énergie — sert à ordonner l'affichage

Pas de barre de progression classique. Trouve une manière de montrer l'avancement qui appartienne à ce produit.

## Écran de calcul

Voir micro-interaction n°6.

## Les 30 jours

- En haut, le ruban des 30 jours, scrubbable
- En dessous, la carte du jour sélectionné : la date, les trois scores, et pour chaque axe les **deux aspects qui l'expliquent** avec leur phrase
- Défilement magnétique d'un jour à l'autre
- Accès à l'écran « Les jours rares »
- Un bouton de partage qui génère une image du ruban seul, avec le prénom et la marque

---

# 6. Qualité et conformité

- Mobile d'abord — 90 % du trafic viendra de publicités sur mobile
- LCP < 2 s
- Focus clavier visible, `prefers-reduced-motion` respecté, contrastes accessibles
- Pied de page : `Bien.Luné propose une lecture astrologique à visée de divertissement et de réflexion personnelle.`
- **L'axe Énergie ne donne jamais de conseil médical.** Il parle de rythme, de fatigue, d'élan. Jamais de symptôme, de traitement, de diagnostic, ni de « bon jour pour une opération ». Écris cette règle dans le prompt de génération de texte et vérifie-la en sortie.

---

# 7. Règles permanentes

Recopiées dans `CLAUDE.md` à la racine du repo.

- Jamais de commit direct sur `main`. Une branche par tâche, une PR par tâche.
- Jamais de `git push --force`, jamais de réécriture d'historique.
- Aucune clé d'API en dur. Tout passe par `.env.local`, qui reste dans `.gitignore`.
- `astronomy-engine` uniquement. Swiss Ephemeris interdit.
- **Un test qui échoue se corrige. Il ne se supprime pas, ne se met pas en `skip`, ne se réécrit pas pour passer.**
- Pas de nouvelle dépendance lourde sans justification dans la PR.

## Définition de « terminé »

Une tâche n'est terminée que si les cinq commandes passent :

```
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

Tant qu'une seule échoue, la tâche est en cours. Ne passe jamais à la suivante avec une commande en échec.

## Fichiers de pilotage

- `TASKS.md` — la liste ordonnée des tâches, `[ ]` / `[x]`. Une seule en cours à la fois.
- `JOURNAL.md` — à chaque tâche terminée, trois lignes : ce qui a été fait, ce qui a cassé et comment ça a été réparé, ce qui reste incertain.
- `QUESTIONS.md` — toute décision que tu ne peux pas trancher seul. Tu l'écris, tu prends l'option la plus réversible, et tu continues. Tu ne t'arrêtes pas pour attendre une réponse.

## Ce sur quoi tu ne décides jamais seul

- Le design final : palette, typographies, glyphes
- Le prix, les textes de vente, la promesse produit
- Toute suppression de fichier ou de table existante

---

# 8. Ta boucle de travail

1. Ouvre `TASKS.md`, prends la première tâche non cochée.
2. Écris d'abord le test qui décrit le comportement attendu. Il doit échouer.
3. Implémente jusqu'à ce qu'il passe.
4. Lance les cinq commandes de la définition de « terminé ».
5. Si une échoue : lis l'erreur en entier, corrige la cause, relance. Ne contourne pas.
6. Si tu échoues trois fois sur le même problème : arrête d'insister, note-le dans `QUESTIONS.md`, remets la tâche en attente, passe à la suivante.
7. Sur du visuel : prends une capture avec Playwright, regarde-la, compare-la au plan de design validé, corrige les écarts. Recommence jusqu'à conformité.
8. Commit, ouvre une PR avec un titre clair et trois lignes de description.
9. Coche la tâche dans `TASKS.md`, écris tes trois lignes dans `JOURNAL.md`.
10. Toutes les 5 tâches : relis ce document, `CLAUDE.md` et `JOURNAL.md`. Vérifie que ce qui est construit correspond encore à ce qui est demandé, et que le chemin vers l'objectif de la section 0 est tenu. En cas de dérive, la noter et la corriger avant de continuer.
11. Reprendre à l'étape 1.

Arrêt dans trois cas seulement : `TASKS.md` est vide, trois tâches bloquées d'affilée, ou une décision de la section « ce sur quoi tu ne décides jamais seul ».
