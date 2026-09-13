# Corpus — première livraison du rédacteur

**13 septembre 2026.** Note vocale, transcrite. Dix briques avaient été demandées ; la
réponse en couvre **dix-neuf sur trente-deux**, plus une quantité de matière qui ne rentre
dans aucune brique et qui est consignée ici pour la suite.

Ce fichier est la source. Ce qui est déjà employé vit dans `lib/copy/blocks.ts`,
`lib/astro/labels.ts` et `lib/copy/phrase.ts`.

## Trois consignes de ton, qui valent pour tout le corpus

**« J'aime pas dire pas bon, on dit plutôt difficile. »** Consigne explicite, appliquée
partout et vérifiée par un test : aucune brique, aucun verdict ne contient « mauvais »,
« néfaste », « funeste », « insurmontable », « irrémédiable ».

**Rien n'est une fatalité.** « L'aspect montre qu'il y a une difficulté ; à nous de la
vaincre. » Et plus loin, sur les thèmes : « Il n'existe pas de thème avec que des bons
aspects, ça n'existe pas, c'est pas possible. » Un aspect dur dit où est la résistance, il
ne condamne pas la journée.

**Un bon aspect ne promet rien tout seul.** « Si on ne fait rien et qu'on reste chez soi,
il ne se passera rien de spécial. » Les textes favorables demandent d'agir ; ils
n'annoncent pas un résultat. C'est aussi ce qui protège le produit de promettre ce qu'il
ne peut pas tenir.

## Ce qui a corrigé le produit

**Le carré et l'opposition ne disent pas la même chose.** Le carré est un **blocage** — il
indique qu'il y a un problème, et le domaine dépend de la maison touchée. L'opposition,
« comme son nom l'indique », donne un **doute** : on est devant deux choix et on hésite.
Les traductions du produit les confondaient sous « aspect difficile ».

**Ce n'est pas Vénus qui fait signer, c'est Mercure.** Le produit faisait dire à Vénus
qu'elle « rend la négociation facile, le prix acceptable ». Faux : Vénus gouverne le
sentimental et l'amical — « l'amitié, c'est de l'amour ». Signer, conclure, contracter,
c'est Mercure.

**Le trigone est plus fort que le sextile**, les deux sont favorables. Le produit les
traitait comme deux nuances du même registre.

## Ce qui a été écarté, et pourquoi

Le rédacteur a donné, pour Mars, sa signification en astrologie médicale : les défenses de
l'organisme face à la maladie. **Écarté.** L'axe Énergie ne parle jamais de santé — c'est
une règle non négociable du projet, le filtre de sortie l'arrêterait, et un test vérifie
qu'aucune brique de Mars ni de l'axe Énergie ne contient de terme médical. Mars reste
l'énergie, le courage et le combat.

## Validation indépendante du score du jour

Le score global lunaire a été construit le 11 septembre, avant cette livraison. Le
rédacteur, sans connaître ce choix, a dit ceci de la Lune :

> « Elle amène une précision qui confirme ou non que c'est un bon ou un mauvais jour. […]
> C'est un paramètre indépendant du reste, mais qui est très puissant. Si quelqu'un a des
> super bons aspects mais que sa Lune est mauvaise — tu vas pas gagner un match. »

Et, sur le choix du nom : c'est de là que vient *Bien.Luné*.

C'est exactement le comportement que produit la pondération actuelle — trois quarts Lune,
un quart la moyenne des axes : une Lune basse sur des axes hauts donne un jour bas. La
seule nuance à garder en tête est qu'il la décrit comme une **confirmation** plutôt que
comme un terme additif. La forme multiplicative — les axes modulés par un facteur lunaire —
donnerait la même famille de résultats ; elle n'a pas été retenue parce que la forme
additive est plus simple à expliquer et déjà calibrée. Voir `QUESTIONS.md` Q13.

Il a aussi corrigé un point de fait : **la Lune reste deux jours à deux jours et demi dans
un signe**, pas un jour.

## Matière non encore employée

### Les maisons

Le thème compte douze maisons ; quatre sont dites importantes.

| Maison | Ce qu'elle gouverne |
|---|---|
| 1 (Ascendant) | l'allure, la façon d'entrer dans une pièce |
| 4 (Fond du Ciel) | la famille, le domicile, tout bien immobilier |
| 7 (Descendant) | les associés, les partenaires, **tout contrat signé avec quelqu'un d'autre** |
| 10 (Milieu du Ciel) | le travail, la réputation |

Mise en garde du rédacteur : « il ne faut pas qu'il se fie **qu'à** l'Ascendant, ou à la
maison 10, ou à la 7, ou à la 4. Ce sont les quatre importantes, mais il y en a d'autres,
et il faut les prendre en compte. »

**Les maîtres de maison.** Notion qu'il tient pour importante et que le moteur n'implémente
pas. Si la maison 7 tombe en Cancer, son maître est la Lune ; un bon aspect à la Lune est
alors un bon aspect sur un partenariat. C'est une couche d'indirection entre un point natal
et un domaine, qui rendrait les lectures beaucoup plus personnelles.

### Les planètes dominantes

Une planète est dominante quand elle est **à l'Ascendant, en maison 10, près de la maison 7
ou de la maison 4, ou près du Soleil ou de la Lune**. Elle colore toute la personne.
Exemple donné : un Uranus dominant, c'est quelqu'un qui aime sa liberté et qu'il ne faut
pas enfermer dans un cadre rigide.

### Ce que gouverne chaque planète, en un mot

Soleil, la vie et la lumière. Lune, l'émotionnel, la mer, les femmes. Mercure, le mental,
les contrats, les déplacements. Vénus, le sentimental et l'amical. Mars, l'énergie, le
courage, le combat. Jupiter, la chance, l'argent, la réussite. Saturne, le temps, le
pragmatisme, ce qui se construit. Uranus, la liberté, les tournants, les technologies.
Neptune, l'instinct. Pluton, les transformations sans retour.

### L'erreur du débutant

« Ne pas tenir compte du mélange de bons et de mauvais aspects, et en tirer une synthèse. »
Et surtout : un bon aspect de Mars ou de Jupiter **compense** un aspect difficile de planète
lente. « Ça ne veut pas dire que la lutte n'est pas là ou que le problème n'existe plus, ça
veut dire qu'on arrive à le résoudre. »

C'est ce que fait déjà la somme pondérée du moteur — plusieurs contributions de signes
opposés se compensent au lieu de se hiérarchiser. La partie non faite est de le **dire** :
aujourd'hui le produit cite les deux aspects les plus forts sans expliquer qu'ils se
compensent.

### Comparaison de deux thèmes

« Les gens adorent ça. » Employée pour l'amour comme pour l'association. Ce qu'il regarde :

- **Rédhibitoire** : le Saturne de l'un opposé au Pluton, au Saturne ou au Soleil de
  l'autre. Saturne, Pluton ou Uranus en aspect difficile au Soleil de l'autre.
- **Pas nécessaire** : être du même signe. « Ce sont surtout les planètes d'un thème par
  rapport à l'autre. »
- **Surmontable** : presque tout le reste, à condition d'en prendre conscience. Un Saturne
  difficile sur un point de l'autre veut dire qu'on peut se comporter de façon trop rigide
  et trop enfermante — donc « faire des efforts et laisser de l'espace à l'autre ».
- **Livrable visé** : « trois conseils de choses à éviter et trois conseils de choses à
  faire pour que ça marche bien avec telle ou telle personne. »

### Ce que les gens demandent vraiment

Par ordre : **le couple** — en couple ou non —, **le travail** et le changement de travail,
et **les jours précis** : un examen, un permis de conduire, un entretien d'embauche. Sur
ces jours-là, « il vaut mieux que la Lune soit bien placée, en plus des autres bons
aspects ».

### Signes et saisons

Sa proposition de couleurs, qui **diverge** de la palette validée : été, l'or ; automne, le
marron et le rouge ; hiver, le blanc — « le gel, la neige » — et non le bleu ; printemps, le
vert. Décision de direction artistique, consignée en `QUESTIONS.md` Q16.

Et un rappel utile au positionnement : « si tu n'as que le Soleil en Lion mais trois
planètes en Vierge, tu es très Vierge. » C'est précisément l'argument que le produit vend.

### Astrologie tropicale

« L'astrologie tropicale, qui est la plus fiable. » C'est celle qu'implémente le moteur.
