# Revue du code et du design — 10 septembre 2026

Périmètre : branche `claude/bien-lune-astro-product-9tfacw`, point de départ
`dc8801ed0aa63ad55b447eea84b0447a1af15c4a`. Revue ciblée de l’API, du scoring,
de la rareté et des écrans existants. Ce n’est pas une certification exhaustive du moteur. Le commit concurrent
`98534ed` (quiz T07) a ensuite été intégré, en conservant son formulaire et sa
consigne actualisée : titres en mono, serif réservé aux phrases.

## Corrections

- Les classes de texte utilisaient les noms publics des polices, alors que next/font
  fournit des familles renommées par des variables. Les styles utilisent désormais
  les variables chargées. La couleur du navigateur reprend le fond existant.
- Date.parse accepte certaines dates impossibles en les reportant au mois suivant.
  Naissance et début de période vérifient maintenant un aller-retour ISO exact.
  Les fuseaux inconnus sont rejetés avant le calcul. Six tests ajoutés, dont cinq
  reproduisaient des échecs avant correction.
- La démonstration est datée du 10 septembre au 9 octobre 2026 ; ses libellés
  « aujourd’hui » étaient inexacts dès le lendemain. Remplacés par des dates et
  indices de jours. Les deux attentes de tests correspondantes ont été ajustées
  pour cette raison, pas pour cacher une régression.
- Le double montage des effets en React Strict Mode annulait la frame de révélation
  puis laissait le clip SVG à zéro. Reproduit dans le navigateur distant (largeur 0),
  corrigé puis vérifié après rechargement (largeur 372).

## Design proposé

Les couleurs, les familles de caractères et les glyphes validés restent inchangés.
L’accueil conserve sa promesse et ses douze repères et donne accès à la démonstration.
La démonstration comporte une composition à deux colonnes sur ordinateur, empilée sur
mobile, un calendrier, une navigation explicite, trois boutons d’axe et un seul grand
score. Les aspects sont traduits en clair ; orbes et contributions sont dépliables.
Un changement de jour ou d’axe referme les détails. Le pied de page requis est présent.

## Vérifications

- Avant correction : 150 tests unitaires passent.
- Après correction : 165 tests passent ; types, lint et build passent.
- La commande e2e réussit les 3 tests d’API, mais les tests avec navigateur ne
  démarrent pas : exécutable Chromium absent. Aucun test supprimé ou ignoré.
- Contrôle distant : accueil accessible, lien vers la démo, changement d’axe au clavier,
  changement de date, curseur, retour au début, dépliage des mesures et dernier jour.
  Ruban visible après rechargement ; pas de débordement à 1363 px ; capture ordinateur
  inspectée avant l’intégration de la consigne de titres mono. La suite mobile et la capture mobile restent à faire.
- L’aperçu distant utilise les polices de repli quand Google Fonts n’est pas joignable
  depuis son environnement. Le build de production réussit le chargement des polices.
- Adaptateur minimal de commande de développement pour les arguments de l’aperçu ;
  Next.js et le gestionnaire de paquets restent inchangés. Le serveur de tests écoute
  explicitement sur 127.0.0.1 pour éviter une énumération réseau indisponible ici.

## Points qui restent ouverts

- Le quiz a été ajouté dans le commit concurrent. Le parcours personnalisé complet
  et l’écran des jours rares ne sont pas encore réalisés. La page remaniée reste explicitement une démonstration à données fixes.
- Le cache de rareté en mémoire est sans limite ; chaque requête distincte peut ajouter
  une entrée. Le calcul synchrone de l’API peut être coûteux. À mesurer et borner avant
  d’ouvrir à un trafic public significatif.
- Le calcul signale les heures de naissance inexistantes au changement d’heure mais
  l’API peut encore produire un rapport avec cette anomalie. Le parcours devra exposer
  ou refuser ce cas explicitement ; ce comportement n’est pas modifié dans cette revue.
- Les scores sont relatifs à la fenêtre et lissés, tandis que les deux aspects cités
  sont les plus forts du jour brut. Un score bas ne garantit donc pas deux signes
  négatifs. Ne pas présenter ces deux aspects comme une décomposition mathématique
  exhaustive du score normalisé.
- La recherche de rareté est approximative (pas mensuel puis journalier). La formulation
  « jamais auparavant » mérite une vérification spécialisée avant commercialisation ;
  absence de détection ne constitue pas à elle seule une preuve d’absence.

La proposition reste en brouillon tant que les cinq contrôles requis par le projet
ne passent pas tous. Pas de fusion et pas de déploiement.
