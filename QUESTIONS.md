# Questions ouvertes

Format : la décision, l'option retenue parce qu'elle est la plus réversible, et ce qu'il
faudrait pour trancher.

---

## Q1 — Une branche par tâche, impossible dans cet environnement

**Le brief demande** une branche et une PR par tâche.

**La contrainte** : le harnais qui exécute cette session impose une branche unique,
`claude/bien-lune-astro-product-9tfacw`, et interdit explicitement d'en pousser une
autre.

**Retenu** : un commit par tâche, message explicite, la PR de session servant de PR de
revue. C'est l'option la plus réversible — l'historique reste découpé par tâche, donc
re-découpable en branches plus tard si besoin.

**Pour trancher** : autoriser explicitement la création d'autres branches.

---

## Q2 — `luxon` remplacé par `Intl` pour la conversion de fuseau

**Le brief demande** la conversion avec `luxon`.

**Le problème** : le champ `offset` de `luxon` est exprimé en **minutes entières**. Or
la France a vécu à l'heure moyenne de Paris, `UTC+00:09:21`, jusqu'au 11 mars 1911. Avec
`luxon` cet offset devient `+00:09:00` et l'Ascendant se décale de 5 minutes d'arc.
`Intl.DateTimeFormat` avec `timeZoneName: 'longOffset'` expose l'offset **à la seconde** —
vérifié : Node renvoie bien `GMT+00:09:21`.

**Retenu** : implémentation sur `Intl` dans `lib/astro/zone.ts`, algorithme des offsets
candidats, et `luxon` retiré des dépendances puisqu'il n'est plus utilisé. Un test couvre
le cas de 1911 et échouerait si on revenait à une résolution à la minute.

**Pour trancher** : rien à trancher si le résultat compte plus que la bibliothèque. À
signaler si `luxon` est imposé pour une autre raison.

---

## Q3 — Périmètre des axes : la table du brief ou la table élargie

**Le brief fixe** quatre planètes en transit et quatre points natals par axe.

**Ce qui avait été mesuré avant ce brief** : sur une fenêtre de **90 jours**, cette table
ne produit pas toujours cinq **événements distincts** par axe — Jupiter parcourt 8° en 90
jours, Saturne 3°. Mesure sur 10 thèmes × 24 fenêtres glissantes : 18 axes sur 720
n'atteignaient pas cinq dates citables, dont 17 sur Business. Avec Vénus en transit et le
Saturne natal ajoutés sur Business, le Soleil en transit et le Mars natal sur Amour, on
tombait à 4 sur 720.

**Retenu** : **la table du brief**. La promesse « cinq dates par axe » n'est pas dans le
périmètre de cette session, qui livre 30 jours détaillés avec deux aspects par jour et par
axe — un besoin bien moins exigeant en diversité d'événements. Revenir à la table du brief
est aussi le changement le plus réversible : les poids sont deux constantes dans
`scoring.ts`, l'élargissement est documenté ici et se réapplique en un commit.

**Pour trancher** : au moment où la fenêtre passe à 90 jours et où le paywall promet
cinq dates par axe, il faudra rouvrir la question. La mesure est conservée dans
`docs/02-architecture-moteur.md`.

---

## Q4 — L'heure de naissance du thème de référence

**Retenu** : 20h40 pour le thème de référence du projet. La lecture faite par un
astrologue professionnel situe la maison X au dernier degré du Scorpion et note qu'
« quatre minutes plus tard » elle serait en Sagittaire ; seule une naissance à 20h40
satisfait les deux, et le moteur donne alors un MC à 29°45' Scorpion.

**Pour trancher** : l'acte de naissance. C'est la seule pièce qui fait foi.

---

## Q5 — GeoNames inaccessible : la donnée vient d'un paquet npm

**Le brief demande** une base statique GeoNames `cities5000` importée en base, sans API tierce.

**Le problème** : `download.geonames.org` est refusé par la politique de sortie réseau de
cet environnement (`CONNECT tunnel failed, 403`). Le téléchargement direct est impossible
ici.

**Retenu** : le paquet npm `all-the-cities`, qui est exactement la donnée GeoNames
empaquetée — 135 233 villes, seuil de 1 000 habitants. C'est **plus complet** que
`cities5000` : 8 836 communes françaises contre environ 1 400. Toujours une base statique,
toujours aucune API tierce à l'exécution. Un script de construction en extrait un index
compact — francophonie au seuil de 1 000 habitants, reste du monde au seuil de 50 000, soit
21 766 entrées et ~680 Ko — interrogé côté serveur.

**Limite honnête** : une naissance dans une commune de moins de 1 000 habitants ne sera pas
trouvée. L'impact astrologique est nul — 0,1° de longitude déplace l'Ascendant de 6 minutes
d'arc — mais l'utilisateur devra choisir une commune voisine, et l'interface doit le dire
sans détour plutôt que de faire semblant.

**Pour trancher** : si la couverture des petites communes devient un problème mesuré, la
base officielle des communes françaises (35 000 entrées) est un import supplémentaire.

---

## Q6 — Les phrases avant l'API : gabarits déterministes d'abord

**Le brief demande** des phrases générées par l'API Anthropic, mises en cache.

**Le problème** : l'objectif de la section 0 est un chemin complet de bout en bout. Le
suspendre à une clé d'API et à un appel réseau en fait un point de rupture unique, et cet
environnement n'a pas de clé.

**Retenu** : le parcours est livré avec un **constructeur de phrases déterministe**, monté
sur les briques d'interprétation de `lib/copy/blocks.ts`. Il cite les deux aspects retenus
et dit quoi en faire, sans appel réseau. La génération par le modèle vient ensuite, en
surcouche, et remplit la même table de cache. C'est l'option la plus réversible : le contrat
d'interface est identique, seule la source du texte change.

**Pour trancher** : fournir `ANTHROPIC_API_KEY` dans `.env.local` pour activer la surcouche.
