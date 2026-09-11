# Bien.Luné — plan de design

> **Validé le 10 septembre 2026** : les deux typographies avec les dates et les scores en
> mono et **EB Garamond conservé pour les seules phrases d'interprétation** — décision
> reprise après le passage à la direction colorée, à réexaminer si le serif pèse une fois
> les cinq écrans en place. La **variante A** des glyphes, nue, sans nœuds vectoriels. La
> variante B est abandonnée et n'est plus maintenue.
>
> **Directive reçue avec la validation : l'interface doit être beaucoup plus épurée que
> la planche.** La planche était un support de validation, elle montrait tout à la fois ;
> le produit montre une chose à la fois. La section 8 en fait une règle chiffrée.

## 0. La tension, et ce qu'elle impose

> **Le calcul est futuriste. L'interprétation est millénaire.**

Ce n'est pas un effet de style, c'est une contrainte de composition : **deux registres qui
ne se mélangent jamais dans un même bloc.** Le calcul est mono, dense, tabulaire, aligné.
L'interprétation est serif, en colonne étroite, largement interlignée. Ils se touchent par
un filet, ils ne se croisent pas.

Conséquence directe sur chaque écran : la ligne technique se pose **au-dessus** du
paragraphe, jamais autour, jamais en incise. Le lecteur voit d'abord la mesure, puis la
phrase.

## 1. La couleur — révisée le 10 septembre 2026

La première version faisait vivre l'interface sur deux valeurs, papier et encre, la
couleur réservée aux saisons. À l'écran, l'ensemble lisait gris : les trois bandes du
ruban étaient toutes à l'encre. **Un produit qui parle de journées ne peut pas être terne.**

Nouvelle grammaire, celle des graphiques d'Apple : **une teinte vive par axe, en dégradé
dans sa propre famille, beaucoup de blanc autour.**

### Le fond

| | Hex | Rôle |
|---|---|---|
| **Papier** | `#F6F7F9` | Blanc froid, très légèrement bleuté. Plus lumineux que le gris précédent, et il fait ressortir les trois familles sans les salir. |
| **Surface** | `#FFFFFF` | Les objets posés sur le papier : le ruban, la carte du jour. Rayon 20 px, ombre à peine là — `0 8px 24px -12px` à 12 %. C'est la profondeur d'Apple : on la sent, on ne la voit pas. |
| **Encre** | `#0F1419` | Texte. Noir très légèrement bleuté. |

### Les trois axes

Chaque axe est un **dégradé vertical** : profond en haut, lumineux vers la ligne de base.
Les scores hauts sont donc saturés, les jours ternes s'effacent d'eux-mêmes.

| Axe | Profond | Lumineux | Texte | Teinte |
|---|---|---|---|---|
| **Business** | `#1E4FFF` | `#22D3EE` | `#1338B8` | 232° — bleu électrique vers cyan |
| **Amour** | `#FF2D6F` | `#FF9A5B` | `#C21048` | 340° — magenta vers corail |
| **Énergie** | `#D46700` | `#B8E62E` | `#9A5B00` | 30° — orangé brûlé vers lime |

Trois familles franchement séparées sur la roue, distinguables d'un coup d'œil y compris
en vignette de partage. **Le mode de tracé reste** — colonne pleine, double filet, pile de
tirets — pour que le ruban survive à l'impression en noir et blanc et au daltonisme : la
couleur ajoute, elle ne remplace pas.

### Les quatre saisons

Elles gardent leur rôle — dire le passage du temps — mais quittent le fond des bandes, où
elles salissaient tout, pour un **bandeau de cinq pixels** posé au-dessus du ruban. Elles
y sont à pleine teinte, puisqu'elles ne concurrencent plus rien.

| Saison | Hex |
|---|---|
| Printemps | `#34C759` |
| Été | `#FFC300` |
| Automne | `#FF6B3D` |
| Hiver | `#0A9BE8` |

### Ce qui n'a pas changé

Aucune couleur d'état, aucune couleur de marque, aucun bouton coloré. La couleur appartient
aux **axes** et au **calendrier**, à rien d'autre.

## 2. Les deux typographies

| Famille | Registre | Réglages |
|---|---|---|
| **Geist Mono** | **Le calcul.** Chiffres, degrés, minutes d'arc, dates, coordonnées, noms d'aspects, graduations, étapes de calcul, boutons. | 12–13 px, `tracking +0.02em`, chiffres tabulaires. Les grands nombres — scores, jours — en 500, 56–88 px, `tracking −0.03em`. |
| **EB Garamond** | **L'interprétation.** Les phrases sur les jours, et les titres. | 400, 19 px / 1,62, mesure 58–62 signes, `max-width: 34rem`. Titres en 500, `clamp(2.375rem, 8.4vw, 5.125rem)`, interlignage 1,02. |

**Pourquoi ces deux-là.** Geist Mono est géométrique et contemporain : à 12 px on y lit un
afficheur, à 80 px un cadran. EB Garamond est un caractère du XVIᵉ siècle — il a
réellement l'histoire que le produit revendique, sans être un serif de mode à fort
contraste. J'ai écarté Cardo, plus archaïque mais faible à l'écran, et Spectral, trop
contemporain pour tenir le rôle.

**Une date est une mesure, donc elle est en mono.** C'est le point où beaucoup de produits
se trompent en composant les dates comme du texte.

**Les scores sont en mono, les raisons en Garamond.** Un bloc de jour est fait de deux blocs
qui se font face, séparés par un filet d'encre à 12 % :

```
 87  ·  BUSINESS                              ← Geist Mono
 ♃ △ ☉   trigone Jupiter → ton Soleil   0°18'  ← Geist Mono 12
 ────────────────────────────────────────────
 Jupiter en trigone à ton Soleil, et Mercure   ← EB Garamond 19/1.62
 en sextile à ton Milieu du Ciel. Deux
 ouvertures le même jour. C'est un jour pour
 demander, pas pour attendre.
```

## 3. Le Bélier — la facture du trait

Boîte commune 24×24, zone utile 4→20, trait **1,25** partout, bouts droits, angles vifs.

**La règle qui unifie les douze, et qui est vérifiable : aucune courbe de Bézier, aucun arc
SVG. Uniquement des polylignes.** Les cercles sont des polygones à 14 côtés, les arcs des
suites de segments. C'est ce qui leur donne l'air calculés plutôt que dessinés — et un `C`,
`Q`, `S` ou `A` dans un tracé fait échouer les tests.

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"
     stroke-linecap="butt" stroke-linejoin="miter"
     vector-effect="non-scaling-stroke" aria-hidden="true">
  <!-- hampe -->
  <path d="M12 19.4 V10.6"/>
  <!-- corne gauche -->
  <path d="M12 10.6 L10.9 8.6 L9.1 7.2 L6.9 6.85 L5.15 7.9 L4.3 9.95 L4.45 12.25 L5.4 14.1"/>
  <!-- corne droite -->
  <path d="M12 10.6 L13.1 8.6 L14.9 7.2 L17.1 6.85 L18.85 7.9 L19.7 9.95 L19.55 12.25 L18.6 14.1"/>
</svg>
```

`vector-effect="non-scaling-stroke"` maintient le trait à 1,25 px que le glyphe fasse 10 px
dans le ruban ou 120 px en pleine page. Les douze sont dessinés, testés (aucune courbe, tout
dans la grille, centrage optique) et livrés en planche de contrôle.

**Variante A retenue** — la version nue, sans nœuds vectoriels. À 10 px dans le ruban les
nœuds devenaient du bruit, et entretenir deux jeux n'avait pas de contrepartie. Un seul jeu
de douze tracés, celui qui est déjà dans `lib/design/zodiac-paths.ts`.

## 4. Le ruban

Trois axes différenciés par **la position et le mode de tracé**. Aucune couleur d'axe.

| Axe | Bande | Tracé |
|---|---|---|
| **Business** | 1 | Colonne pleine. Le trait le plus appuyé. |
| **Amour** | 2 | Double filet — deux traits fins accolés, densité variable. Se lit comme une trame. |
| **Énergie** | 3 | Pile de tirets. La hauteur se compte en unités, comme une échelle graduée. |

Les trois sont en encre. Un jour favorable monte depuis la ligne de base ; un jour à éviter
descend, encre à 45 %. **Rien n'est codé par la teinte** : le ruban reste lisible imprimé en
noir et blanc et en cas de daltonisme.

```
┌──────────────────────────────────────────────────────────┐
│ ░░░░░░░░ été / or ░░░░░ ▒▒▒▒ automne / garance ▒▒▒▒▒▒▒▒▒ │ ← lavis 7 %, continu
│                    ♃                                     │ ← glyphe du pic, 10 px
│ BUSINESS ▇▅▂▁▂▄▇█▆▃▁▁▂▅▇█▇▄▂▁▁▃▆█▇▅▂▁▁▂▄▆▇▆▃▁▂▄▅▇█▆▄▂▁ │
│ ├────────────────────────────────────────────────────────┤
│ AMOUR    ╎┆┆╎╎╎┆┆┆╎╎┆┆╎╎╎┆┆╎╎┆┆┆╎╎╎┆┆╎╎┆┆┆╎╎┆┆╎╎╎┆┆╎╎┆ │
│ ├────────────────────────────────────────────────────────┤
│ ÉNERGIE  ⋮:::⋮⋮⋮:⋮⋮:::⋮⋮⋮:::⋮⋮:::⋮⋮⋮:⋮⋮:::⋮⋮⋮:::⋮⋮:⋮⋮ │
└──────────────────────────────────────────────────────────┘
   ▲ curseur sous le doigt
  AUJ.      +7        +14       +21       +28
  └ Geist Mono 11 ─────────────────────────────────────────┘
```

- SVG, `viewBox="0 0 361 60"` par bande, 30 colonnes au pas de 12 sur la fenêtre courte.
- Révélation par `clip-path` de gauche à droite, 900 ms, une fois par session. État final
  immédiat sous `prefers-reduced-motion`.
- **Le scrub est l'interaction signature** : le doigt déplace un curseur vertical, la carte
  en dessous se met à jour en direct. Pas de délai, pas d'animation entre deux jours.
- Vibration brève de 8 ms au franchissement d'un jour à score ≥ 80, via l'API Vibration,
  silencieuse là où elle n'existe pas et désactivée sous `prefers-reduced-motion`.

## 5. La carte de jour

Le brief demande les trois scores **et** deux aspects par axe — six aspects. Il demande
aussi « une seule idée par écran ». Les deux tiennent ensemble à une condition :
**l'axe choisi au quiz est déplié, les deux autres sont repliés à leur score.**

```
┌─────────────────────────────────────────┐
│  12 OCT              AUJOURD'HUI + 32   │ ← mono ; la date est l'objet principal
├─────────────────────────────────────────┤
│                                         │
│   87                                    │ ← mono 500, 72 px, compteur qui monte
│   BUSINESS                              │
│   ────────────────────────────────────  │
│   Jupiter en trigone à ton Soleil    +  │ ← mono 12, aucun symbole à déchiffrer
│   Mercure en sextile à ton Milieu       │
│   du Ciel                            +  │
│                                         │
│   Jupiter en trigone à ton Soleil, et   │ ← Garamond 19/1.62
│   Mercure en sextile à ton Milieu du    │
│   Ciel. Deux ouvertures le même jour.   │
│   C'est un jour pour demander.          │
│                                         │
├─────────────────────────────────────────┤
│  41   AMOUR      ♀ □ ☾ · ☾ ☍ DSC     ⌄ │ ← replié : score + notation seule
│  63   ÉNERGIE    ☉ △ ASC · ♂ ⚹ ♂     ⌄ │
└─────────────────────────────────────────┘
```

La colonne de droite des aspects porte le **signe de la contribution**, pas sa valeur : un
jour à 12/100 affiche deux `−` et le lecteur comprend immédiatement pourquoi il est bas.
C'est la règle du brief — on garde les deux aspects qui ont le plus **pesé**, pas les deux
plus favorables.

## 6. Les trois principes

1. **Deux registres qui se font face, jamais mêlés.** Le calcul est mono, tabulaire, aligné.
   L'interprétation est Garamond, en colonne étroite, largement interlignée. Aucun bloc ne
   contient les deux familles ; ils se touchent par un filet. C'est le sujet du design : la
   machine mesure, la voix ancienne parle.
2. **La couleur n'appartient pas à la marque, elle appartient au calendrier.** Quatre
   teintes, quatre saisons, rien d'autre. Toute la vivacité du produit vient du fait que le
   temps passe. Un site d'astrologie a une couleur de marque ; celui-ci a une couleur de date.
3. **Les glyphes disent où sont les planètes, jamais qui tu es.** Contour fin, polylignes
   uniquement, grille commune. Ce sont des graduations sur une règle. Le produit se vend sur
   le fait que le signe solaire ne dit presque rien — l'interface ne le contredit jamais.

## 7. Ce qui a été écrit puis supprimé

Parce que c'est ce que je produirais pour n'importe quel autre site : cartes arrondies à
ombre douce, badges pilule, hero centré à sous-titre gris, icônes décoratives, sections en
alternance de fond, compteur de réassurance, grille de trois features à icône,
`fade-and-slide` au scroll, étiquettes capitales espacées, flèche accolée aux boutons,
dégradés, mode sombre — le produit parle de journées, il vit en lumière du jour.

## 8. Le budget de densité — la règle d'épuration

« Épuré » ne survit pas à six écrans si on ne le chiffre pas. Six règles, dont deux
vérifiables par un test de bout en bout.

1. **Un écran, une décision.** Le jour affiché, un score, deux raisons. Rien d'autre
   au-dessus de la ligne de flottaison.
2. **Trois tailles de texte visibles au maximum par écran** : un grand nombre, une ligne
   technique, un paragraphe. Pas de quatrième.
3. **Un seul nombre au-dessus de 24 px par écran** — le score de l'axe prioritaire. Les
   deux autres axes sont des lignes, pas des blocs.
4. **Quarante-cinq mots de texte courant au maximum par écran.** Au-delà, on coupe, on ne
   réduit pas le corps.
5. **Le produit ne s'explique pas à l'intérieur de lui-même.** Pas de légende sous le
   ruban, pas de tableau des données de naissance, pas de compteur de statistiques. Ces
   informations passent une fois, sur l'écran de calcul, puis disparaissent.
6. **Aucun symbole à déchiffrer.** Un aspect s'écrit en toutes lettres — « Jupiter en
   trigone à ton Soleil » — jamais « ♃ △ ☉ ». La plupart des utilisateurs ne connaissent
   rien à l'astrologie, et un symbole illisible n'est pas de la précision : c'est le
   jargon non traduit que le brief reproche à Co-Star. Le registre technique passe par les
   **noms et les nombres** — planètes nommées, degrés, minutes d'arc, dates —, ce qui le
   rend plus convaincant, pas moins. L'orbe et le sens de la contribution s'affichent au
   tap, jamais par défaut.

Ce qui disparaît donc de la planche quand elle devient produit : le bloc d'identité de
naissance, la ligne de statistiques, la légende des trois modes de tracé, les orbes et les
signes affichés d'office, et les libellés d'axe répétés sur le ruban **et** dans la carte.

## 9. Ce que les glyphes disent, et ce qu'ils ne disent plus

Décision du 10 septembre 2026 : **les symboles de planètes et d'aspects sortent de
l'interface.** La plupart des utilisateurs seront des néophytes complets, et un symbole
qu'ils ne savent pas lire ne produit pas de la précision, il produit du jargon.

Ce qui reste, et qui porte le registre technique bien mieux : les **noms** — Jupiter,
trigone, ton Soleil —, les **nombres** — 0°18' d'orbe, 97 sur 100, la date exacte — et la
mise en page tabulaire. C'est plus convaincant que des symboles, parce que ça se lit.

Les douze glyphes du zodiaque restent, à un seul endroit : posés sur les pics du ruban.
Là, ils marquent **une position sur le ciel** et rien n'oblige à les déchiffrer — c'est
exactement le rôle que le brief leur assigne, une graduation sur une règle. Ils ne servent
jamais d'étiquette.

Les cinq symboles d'aspect dessinés en polylignes restent dans le dépôt : ils resserviront
pour le document que relira l'astrologue, où le lecteur, lui, sait les lire.

## 10 — Où vont les teintes vives, où va le jeton `text`

Chaque axe porte trois valeurs : `deep` et `bright`, les deux bornes de son dégradé, et
`text`. La règle a trois lignes et aucune exception :

- **`deep` porte les formes et les nombres.** Le haut du dégradé du ruban, et tous les
  scores de la carte — le grand à 38 px, les deux autres à 20 px en gras. Comme elle porte
  du texte, elle tient le seuil du grand texte, 3:1, sur le blanc des cartes comme sur le
  papier. Les scores secondaires sont en **gras** et non en demi-gras pour cette raison
  exacte : à 20 px, c'est le poids qui les fait entrer dans la catégorie « grand texte » de
  la norme.
- **`bright` ne porte que des formes.** L'autre extrémité du dégradé, jamais un caractère.
  Aucun seuil à tenir, et un test vérifie qu'aucune ne devienne lisible par accident — ce
  serait le signe qu'on a commencé à s'en servir pour du texte.
- **`text` porte les libellés** — noms d'axes sur la carte comme sur le ruban. Du petit
  texte, donc le seuil du texte courant, 4,5:1, vérifié à chaque exécution.

Un écran se lit ainsi : les nombres parlent en couleur vive, les mots qui les nomment
reculent d'un ton. La hiérarchie vient de la taille, jamais d'une teinte éteinte.

**Pourquoi l'orangé de l'axe Énergie n'est pas celui d'Apple.** `#FF9500`, `systemOrange`,
donne **2,2:1** sur blanc : superbe en aplat, illisible en caractères — sous le seuil du
texte courant *et* sous celui du grand texte. Deux issues étaient possibles : rendre les
nombres au jeton `text`, ou assombrir la famille pour que la teinte vive les mérite. La
direction artistique a tranché pour la seconde le 10 septembre 2026 : un score brun sur une
carte blanche ne tient pas la promesse d'un produit qui parle en couleur. `#D46700` tient
**3,7:1** sur blanc, **3,4:1** sur le papier, et reste franchement orange.

**Et pourquoi `bright` a suivi.** Le premier essai gardait le lime `#B8E62E` à l'autre
extrémité. Le dégradé passait alors de la rouille au vert acide en traversant le kaki, et
la bande Énergie lisait **olive** — sale à côté du bleu et du rose, exactement le contraire
de ce que la révision de couleur cherchait. `#FFC24B` referme la famille sur l'ambre : la
bande redevient chaude et nette. L'axe Amour reste distinct par sa teinte, rose contre
ambre, et par son tracé — double filet contre pile de tirets.
