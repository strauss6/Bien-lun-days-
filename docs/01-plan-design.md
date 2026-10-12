# Bien.Luné — Plan de direction artistique

> Document de validation. Aucune ligne de code produite avant accord.

## 1. Concept directeur — « le marégraphe »

Un marégraphe est un instrument qui enregistre la montée et la descente de l'eau sur une
bande de papier qui défile. On ne le décore pas. On le lit.

Références retenues : tables de marées portuaires, papier d'enregistreur sismique,
graduation de baromètre Fortin, tableaux d'affichage horaires. Le produit est un
**relevé**, daté, signé, gradué.

Références écartées volontairement : tarot, cartes du ciel, mandala, cercle
astrologique, glyphes planétaires en décoration. Les glyphes n'apparaissent qu'en
notation technique, à taille de texte, dans la ligne d'aspect (`♀ △ ☾`) — comme une
unité de mesure, jamais comme illustration.

## 2. Palette — 5 couleurs nommées

Palette diurne. Le fond n'est ni crème, ni noir : c'est un blanc très légèrement froid,
un papier technique sous lumière de bureau.

| Nom | Hex | Rôle |
|---|---|---|
| **Papier** | `#F1F3F0` | Fond unique de tout le produit. Aucun second fond, aucune carte. |
| **Graphite** | `#171B1C` | Texte, graduations, colonnes négatives des rubans. |
| **Bleu Plan** | `#2E5A78` | Axe Business. Uniquement dans le ruban Business et ses pics. |
| **Garance** | `#A54A3C` | Axe Amour. Rouge de teinture, sourd, jamais rose. |
| **Olive** | `#6E7F33` | Axe Énergie. Vert kaki-jaune, sourd. |

Dérivés autorisés, pas de nouvelles teintes : `Graphite` à 8 % (lignes de graduation),
12 % (séparateurs), 55 % (texte secondaire). Les trois couleurs d'axe ne s'utilisent
qu'à 100 % ou en opacité variable dans les rubans. Zéro dégradé.

**Accessibilité couleur.** Bleu / garance / olive sont distincts en teinte, mais garance
et olive se rapprochent en protanopie. Mitigation structurelle, pas cosmétique : les trois
rubans sont **toujours empilés dans le même ordre et étiquetés en clair à gauche**, et
la polarité n'est jamais codée par la teinte — un jour favorable est une colonne de
couleur d'axe qui monte, un jour à éviter est une colonne **Graphite** qui descend.
Le ruban reste lisible imprimé en noir et blanc. Contraste Graphite/Papier = 15,4:1.

## 3. Typographie — 3 familles, 3 rôles étanches

| Famille | Rôle | Réglages |
|---|---|---|
| **Bricolage Grotesque** (variable) | Dates, chiffres, scores, titres. Le « cadran ». | 900, `letter-spacing:-0.035em`, chiffres tabulaires, `opsz` poussé au max sur les grandes tailles |
| **IBM Plex Sans** | Corps, interface, boutons. | 400 / 500, `-0.01em` |
| **IBM Plex Mono** | Données astro : degrés, orbes, noms d'aspects, graduations, heure de naissance. | 400, 12–13 px, jamais en majuscules espacées |

**Les dates sont l'objet typographique principal.** Une date de pic se compose en
Bricolage 900, jour en 72–96 px, mois en 28 px sur la ligne suivante, alignés à gauche
sur la même verticale, interlignage 0.82. Le score se pose en exposant, en Mono, contre
le chiffre. Une date n'est jamais du texte courant.

```
 34
 MAR    ← Bricolage 900, -0.035em, interligne 0.82
 ♀ △ ☾  orbe 0°42'   ← Plex Mono 12, Graphite 55%
```

## 4. Mise en page

Une seule colonne, une seule couleur de fond, une seule règle d'alignement : **tout est
accroché à une graduation horizontale de 90 pas**, la même du hero au calendrier. C'est
la grille du produit. Les blocs de texte s'alignent sur les mêmes verticales que les
ticks de semaine du ruban. Rien n'est centré sauf le prix.

### Landing

```
┌─────────────────────────────────────────────────────────┐
│ Bien.Luné                                    (Plex Mono)│
│                                                         │
│ BUSINESS ▁▂▅▇█▆▃▁▁▂▄▇█▇▄▂▁▁▃▆█▇▅▂▁▁▂▄▆▇▆▃▁▂▄▅▇█▆▄▂▁▁▂▄ │  ← se dessine
│ AMOUR    ▂▁▁▃▅▇▆▄▂▁▂▅▇█▆▃▁▁▂▃▅▆▇█▆▄▂▁▁▃▅▇▆▄▂▁▂▄▆▇▅▃▁▁▂ │    G→D, 900ms,
│ ÉNERGIE  ▅▇█▆▄▂▁▁▂▄▆▇▆▄▂▁▂▃▅▇█▇▅▃▁▁▂▄▆█▇▅▃▁▁▂▄▅▇▆▄▂▁▁▃ │    une seule fois
│ │        └┬───────┬───────┬───────┬───────┬───────┬──┘  │
│ AUJ.     SEPT    OCT     NOV     DÉC              J+90  │
│                                                         │
│ Tes 90 prochains jours                                  │  ← Bricolage 900
│ ne se valent pas.                                       │    clamp(40px,9vw,88px)
│                                                         │
│ Calculé sur l'heure et la ville exactes de ta            │  ← Plex Sans 17
│ naissance. Pas sur ton signe.                           │
│                                                         │
│ ┌──────────────────┐                                    │
│ │ Calculer mes jours│   ← rectangle Graphite plein,      │
│ └──────────────────┘     0 rayon, 0 ombre, 0 flèche     │
├─────────────────────────────────────────────────────────┤
│ CE QUE TON MAGAZINE DIT   │  CE QUE TON CIEL DIT        │
│                           │                             │
│ « Balance : semaine       │   12                        │
│ favorable aux échanges,   │   OCT   ♃ △ ☉  0°18'        │
│ écoutez votre intuition.» │   Signer. Le meilleur jour  │
│                           │   des 90 pour demander.     │
│ Écrit pour 8 217 000      │                             │
│ personnes.                │   03                        │
│                           │   NOV  ♂ □ ASC  1°04'       │
│                           │   ...                       │
│                    (colonne gauche à 55% d'opacité)     │
└─────────────────────────────────────────────────────────┘
```

Sur mobile les deux colonnes se superposent, le magazine au-dessus, en Graphite 55 %,
le relevé en dessous à pleine encre. La hiérarchie porte la démonstration.

### Quiz — pas de barre de progression

L'avancement **est** la graduation du ruban. En haut de l'écran, la règle des 90 jours
est présente dès la question 1, vide. Chaque réponse validée fait apparaître 18 jours de
graduation supplémentaires, de gauche à droite. À la 5ᵉ réponse la règle est complète :
l'instrument est calibré, le calcul peut commencer. L'œil a appris à lire le ruban avant
de le voir rempli.

```
│ ├──┼──┼──┤· · · · · · · · · · · · · · · · · · · · · ·│   (2/5)
│                                                         │
│ À quelle heure ?                                        │  ← Bricolage, 44px
│                                                         │
│ ┌────┐ ┌────┐                                           │
│ │ 14 │ │ 07 │   ← champs en Bricolage 900, 56px          │
│ └────┘ └────┘                                           │
│ Deux heures d'écart changent tout le thème.             │
│ C'est ici que 99 % de l'astrologie s'arrête.            │
│ ☐ Je ne la connais pas — on calculera sur midi, la      │
│   position de la Lune et l'Ascendant seront approchés.  │
└─────────────────────────────────────────────────────────┘
```

Une question par écran, validation → écran suivant sans transition d'entrée. Le seul
mouvement est la graduation qui s'étend.

### Écran de calcul

Les étapes réelles s'écrivent en Plex Mono, en liste qui s'allonge vers le bas, avec les
vraies valeurs renvoyées par le moteur. Aucune fausse attente : l'écran dure le temps du
calcul, et si le calcul est plus rapide on laisse les lignes s'écrire jusqu'au bout.

```
  ☉  14 mars 1991, 13:07 UTC · 23°14' Poissons
  ☾  Lune ................... 08°51' Sagittaire
  ASC 17°02' Lion · MC 06°38' Taureau
  Transits 09.09.2026 → 08.12.2026
  21 600 combinaisons testées
  287 aspects retenus
```

### Aperçu et rapport

Le ruban complet des 90 jours, toujours en haut, toujours à la même place, toujours
lisible en entier — y compris dans l'aperçu gratuit. Sous l'aperçu, les 7 premiers jours
en clair. Le pic de J+34 est **visible dans le ruban**, sa colonne est la plus haute de
la bande, mais la graduation sous cette zone n'affiche que le mois, pas le jour : on sait
qu'il existe, on ne sait pas quand. Aucun flou, aucun cadenas, aucun texte tronqué.

## 5. Trois principes

1. **Rien ne décore : tout code une valeur.** Si un élément graphique ne représente pas
   un nombre issu du calcul, il n'existe pas.
2. **Un seul événement visuel par page, et c'est toujours le ruban.** Tout le reste est
   du plomb noir sur du papier clair.
3. **Le produit est daté et signé.** Chaque affirmation porte son aspect, son orbe en
   minutes d'arc, sa date. La précision est l'argument de vente : elle doit être visible
   à l'écran, pas seulement dans la promesse.

## 6. Ce que j'ai supprimé de ma première passe

Écrit puis retiré parce que c'est ce que je produirais pour n'importe quel autre site :
cartes à coins arrondis et ombre douce ; badges pilule ; hero centré avec sous-titre gris ;
icônes décoratives ; sections en alternance de fond ; compteur de réassurance
« +12 000 rapports générés » ; grille de 3 features à icône ; `fade-and-slide` au scroll ;
étiquettes capitales espacées ; flèche accolée aux boutons ; dégradés. Aucun de ces
éléments ne survit dans le plan ci-dessus.

## 7. Le ruban — spécification du composant

Composant isolé, développé et validé avant le tunnel.

```
<TideRibbon axis="business" scores={number[90]} dayOne={Date}
            reveal={boolean} detailFrom={0|7|90} />
```

- **Rendu** : SVG, `viewBox="0 0 361 56"`, 90 colonnes de 2,8 unités, pas de 4.
  `width:100%; height:auto` → jamais de déformation. 270 rects pour trois rubans, coût nul.
- **Encodage** : ligne de base à 60 % de la hauteur. Score > 50 → colonne montante en
  couleur d'axe, opacité `0.35 + 0.65·t`. Score ≤ 50 → colonne descendante en Graphite,
  opacité `0.2 + 0.5·t`. Double encodage hauteur + opacité : lisible en vignette de 40 px
  de haut comme en pleine page.
- **Graduation** : tick fin à chaque lundi, tick appuyé + label Mono au changement de mois,
  trait vertical pleine hauteur sur le maximum et le minimum de l'axe.
- **Animation** : `clip-path` qui s'ouvre de gauche à droite, 900 ms, `cubic-bezier(.22,1,.36,1)`,
  une seule fois par session (`sessionStorage`). Chaque colonne apparaît à sa place finale,
  aucun mouvement vertical. Sous `prefers-reduced-motion` : état final immédiat.
- **Partage** : le même modèle de rendu réutilisé en `@vercel/og` pour produire une image
  1200×630 — les trois rubans, le prénom, `bien-lune.fr`. Une seule source de vérité
  géométrique entre l'écran et l'image.
