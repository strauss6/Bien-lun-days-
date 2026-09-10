# Bien.Luné — plan de design

> À valider avant de coder l'interface. Il consolide le brief et remplace les versions
> antérieures. Les glyphes et les jetons de couleur sont déjà implémentés et testés ;
> le reste attend accord.

## 0. La tension, et ce qu'elle impose

> **Le calcul est futuriste. L'interprétation est millénaire.**

Ce n'est pas un effet de style, c'est une contrainte de composition : **deux registres qui
ne se mélangent jamais dans un même bloc.** Le calcul est mono, dense, tabulaire, aligné.
L'interprétation est serif, en colonne étroite, largement interlignée. Ils se touchent par
un filet, ils ne se croisent pas.

Conséquence directe sur chaque écran : la ligne technique se pose **au-dessus** du
paragraphe, jamais autour, jamais en incise. Le lecteur voit d'abord la mesure, puis la
phrase.

## 1. Les six couleurs

Deux valeurs portent 95 % de l'interface.

| | Hex | Justification |
|---|---|---|
| **Papier** | `#EFF0EE` | Gris neutre très clair, légèrement froid. Le moindre soupçon de crème ferait basculer les quatre saisons vers l'aquarelle. C'est une feuille technique, pas une page de librairie — et le fond crème est un interdit du brief. |
| **Encre** | `#131518` | Bleu-noir profond. Le noir pur durcit le serif et le fait vibrer sur fond clair ; ce bleuté garde le Garamond posé et donne 15,4:1 de contraste sur le papier. |

Les quatre saisons. Une seule famille : quatre pigments d'une même boîte, clartés voisines,
chromas voisins. C'est cette parenté qui leur permet de cohabiter sans se battre.

| Saison | Signes | Hex | Nom | Justification |
|---|---|---|---|---|
| **Printemps** | ♈ ♉ ♊ | `#2C7A3F` | Vert de sève | Tiré vers le bleu volontairement : un vert jaune glisserait vers l'été et les deux teintes se confondraient sur une transition continue de ruban. |
| **Été** | ♋ ♌ ♍ | `#C08E00` | Jaune d'or | Un jaune vrai est illisible sur fond clair. Descendu à l'or mûr, il reste franchement jaune et tient 3,0:1 — donc réservé au tracé et aux aplats. Variante texte : `#8A6600`. |
| **Automne** | ♎ ♏ ♐ | `#A5282C` | Rouge de garance | Rouge de teinture légèrement bleuté. Ni écarlate — trop d'alerte —, ni terracotta, qui est le cliché de la catégorie et un interdit du brief. |
| **Hiver** | ♑ ♒ ♓ | `#1C5A96` | Bleu de cobalt sourd | Tiré vers le cyan (≈ 205°) pour rester loin de l'indigo interdit. Assez profond pour porter un trait fin. |

Répartition sur la roue : 150° / 44° / 358° / 205°. Bien écartées.

**La couleur ne sort jamais de là.** Boutons en encre. États en encre. Liens en encre
soulignée. Aucune couleur de marque.

**Lavis du ruban** : la saison à **7 %** sur le papier, en dégradé linéaire d'une saison à
la suivante, la transition centrée sur l'équinoxe ou le solstice **réellement calculé**, pas
sur le premier du mois. Valeur résolue, printemps : `#E1E8E2`. L'encre y tient 15:1.

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

**Variante B** — nœuds vectoriels de 1,3 sur les extrémités des tracés ouverts. Elle pousse
la facture « tracé en cours d'édition » un cran plus loin. Je recommande **la version nue** :
à 10 px dans le ruban les nœuds deviennent du bruit, et il faudrait entretenir deux jeux.

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
│   ♃ △ ☉   trigone Jupiter → ton Soleil  │ ← mono 12 ; « trigone » traduit
│           0°18'                    +    │   une seule fois, puis employé seul
│   ☿ ⚹ MC  sextile Mercure → ton MC      │
│           1°02'                    +    │
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
