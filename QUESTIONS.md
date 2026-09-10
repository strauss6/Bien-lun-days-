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

---

## Q7 — Le symbole de conjonction reste proche de celui de Mars

**Constat** : les symboles d'aspect étaient composés en Unicode. Une capture de conformité
a montré que `☌` n'existe pas dans Geist Mono et que la police de repli lui substituait un
signe ressemblant à Mars : « Jupiter conjonction Soleil » se lisait « Jupiter Mars Soleil ».

**Retenu** : les cinq aspects sont désormais **dessinés en polylignes**, comme les douze
signes, ce qui supprime la dépendance à la couverture d'une police. Le symbole de
conjonction garde sa forme traditionnelle — le disque et son rayon — qui reste
graphiquement proche de Mars à treize pixels. La notation porte la phrase en clair comme
étiquette accessible, et la carte de jour affichera la phrase juste à côté, ce qui lève
l'ambiguïté pour qui ne connaît pas les symboles.

**Tranché le 10 septembre 2026, et autrement que prévu** : la question ne se pose plus,
parce que **les symboles d'aspect sortent de l'interface**. La plupart des utilisateurs
seront des néophytes ; un symbole qu'ils ne savent pas lire n'est pas de la précision, c'est
le jargon non traduit que le brief reproche à Co-Star. Un aspect s'écrit désormais en toutes
lettres — « Jupiter en trigone à ton Soleil » — et le registre technique passe par les noms
et les nombres.

Les tracés restent dans le dépôt, non supprimés : ils resserviront pour le document destiné
à l'astrologue, dont le lecteur sait les lire.

## Revue Codex — 10 septembre 2026

- La demande porte sur la vérification et le design de l’existant, pas sur la réalisation de T08–T16. Le quiz T07 ajouté en parallèle a été conservé.
  Proposition sur une branche séparée ; les polices, couleurs et glyphes validés restent.
- La révision couleur du 10 septembre dans DESIGN.md §1 et CLAUDE.md contredit encore
  BRIEF.md §3 et plusieurs anciennes sections de DESIGN.md. La proposition conserve
  les jetons déjà présents, sans choisir une nouvelle palette.
- Le navigateur local attendu par Playwright n’est pas installé ici. Les tests UI de
  la commande e2e ne peuvent pas démarrer ; le contrôle interactif distant ne remplace
  pas cette suite. La revue reste en attente de ce dernier contrôle, PR en brouillon.

---

## Q8 — Deux façons de styler dans le même dépôt

**Constat** : la revue de Codex introduit une soixantaine de lignes de CSS écrites à la main
— `.app-shell`, `.report-layout`, `.axis-option` — pour l'accueil et la démonstration, alors
que le reste du produit est stylé par classes utilitaires Tailwind.

**Retenu** : garder les deux pour l'instant. Le CSS est cantonné à ces deux pages, il
fonctionne, et le réécrire serait défaire un travail correct sans bénéfice immédiat. C'est
aussi l'option la plus réversible : convertir soixante lignes de CSS en utilitaires est un
commit, l'inverse aussi.

**Pour trancher** : avant que la seconde façon ne se répande. Le parcours réel — quiz,
calcul, jours, rares — est entièrement en utilitaires ; si la démonstration devient une page
de vente, il faudra choisir.

## Q9 — L'orangé de l'axe Énergie ne peut pas porter de texte

**Mesure.** `#FF9500` sur blanc donne **2,2:1**. Le seuil de la norme est de 4,5:1 pour
du texte courant et de 3:1 pour du grand texte : l'orangé vif échoue aux deux. `#FF2D6F`
donne 3,6:1 — il passe en grand, échoue en courant. Seul `#1E4FFF`, à 5,8:1, tient
partout.

**Ce que j'ai fait.** Les nombres de l'interface emploient désormais le jeton `text` de
chaque axe — `#1338B8`, `#C21048`, `#9A5B00` —, qui existait déjà et que `tokens.ts`
décrit comme « la teinte du texte sur fond clair, assez foncée pour rester lisible ».
C'est l'emploi prévu du jeton, pas un changement de palette. Les teintes vives restent
où elles sont justes : les dégradés du ruban, qui sont des formes et non du texte. Un
test unitaire fige la frontière.

**Ce qui reste à trancher, et c'est ton appel.** Le 51 de l'axe Énergie lit maintenant
**brun** à côté d'une bande orange. C'est lisible, mais la carte et le ruban ne parlent
plus tout à fait de la même couleur. Deux options :

1. **Laisser ainsi.** Zéro travail, conforme, mais l'axe Énergie perd son éclat sur la
   carte.
2. **Décaler la famille Énergie vers le sombre** — par exemple `#E8760A` en vif, qui
   monte à 3,1:1 et pourrait alors porter les grands nombres, avec un `bright` ajusté.
   Le ruban reste chaud, la carte retrouve l'orangé. Une ligne dans `tokens.ts`.

Option retenue en attendant : la 1, parce qu'elle est la plus réversible — elle ne touche
à aucune valeur de la palette.

