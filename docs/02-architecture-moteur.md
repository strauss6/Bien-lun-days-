# Bien.Luné — Architecture du moteur astro et du scoring

> Document de validation. Aucune ligne de code produite avant accord.

## 0. Contraintes actées

- **Éphémérides : `astronomy-engine` (MIT).** Swiss Ephemeris est exclu — AGPL ou licence
  commerciale, incompatible avec la vente du produit. Contrainte bloquante, non contournée.
- Aucune API tierce pour la géo ni pour le fuseau : GeoNames `cities5000` importée en base,
  `tz-lookup` embarqué, `luxon` pour la conversion.
- Toutes les fonctions de `/lib/astro/` sont **pures** : entrées sérialisables, sortie
  déterministe, zéro accès réseau, zéro `Date.now()`. Le moteur est testable sans base.

## 1. Arborescence

```
lib/astro/
  time.ts        résolution heure locale → UTC, fuseau historique
  ephemeris.ts   couche mince au-dessus d'astronomy-engine (longitudes écliptiques)
  natal.ts       thème natal : 10 planètes + ASC/MC/DSC/IC, maisons signes entiers
  aspects.ts     détection d'aspects, orbes, exactitude
  transits.ts    échantillonnage des positions sur 90 jours
  scoring.ts     scores bruts, lissage, normalisation intra-personne, sélection des dates
  types.ts
  __tests__/     time, natal (thèmes de référence), aspects, scoring (invariants)
```

## 2. `time.ts` — le point le plus dangereux du produit

Une heure d'erreur = ~15° d'Ascendant = produit faux. Pipeline :

1. `ville → { lat, lng }` : table `cities` importée de GeoNames `cities5000`, recherche
   trigram + population décroissante. Aucun appel réseau.
2. `{ lat, lng } → zone IANA` : `tz-lookup`.
3. `(date locale, heure locale, zone) → UTC` : `DateTime.fromObject(..., { zone })` de
   `luxon`, qui applique la règle **en vigueur à cette date** via la tzdata du runtime
   (heure d'été, décalages historiques, offsets non entiers).

Signature :

```ts
resolveBirthInstant(input: {
  date: string; time: string | null; lat: number; lng: number;
}): {
  utc: string;              // ISO
  zone: string;             // "Europe/Paris"
  offsetMinutes: number;    // +60, +9 (PMT), +330...
  precision: 'exact' | 'noon-fallback';
  anomaly: null | 'dst-gap' | 'dst-ambiguous';
}
```

Deux cas limites traités explicitement, pas ignorés :
- **`dst-gap`** — heure locale inexistante (passage à l'heure d'été). Luxon renvoie
  l'instant décalé ; on le conserve et on lève le drapeau.
- **`dst-ambiguous`** — heure locale vécue deux fois (retour à l'heure d'hiver). On retient
  le **premier** offset, drapeau levé. Le rapport le mentionne d'une ligne.

`time === null` (case « je ne la connais pas ») → 12:00 local, `precision: 'noon-fallback'`.
Dans ce mode, le poids de la Lune est divisé par 2 et l'axe Énergie ne s'appuie plus sur
l'Ascendant mais sur Soleil/Mars — parce que l'ASC est inconnu à ±180°. Le produit reste
honnête au lieu de simuler une précision qu'il n'a pas.

### Cas de test (bloquants avant toute suite)

| # | Naissance | Attendu |
|---|---|---|
| 1 | Paris, 14/03/1991 14:07 | UTC+1 → `13:07Z` |
| 2 | Paris, 15/07/1985 03:30 | UTC+2 (CEST) → `01:30Z` |
| 3 | Paris, 28/03/1976 02:30 | `dst-gap` — l'heure d'été est réintroduite cette nuit-là |
| 4 | New York, 05/11/2000 01:30 | `dst-ambiguous`, premier offset UTC−4 |
| 5 | Paris, 05/02/1911 08:00 | **Paris Mean Time, UTC+00:09:21** → `07:50:39Z` — naissance avant 1945 en France |
| 6 | Paris, 10/06/1943 09:00 | UTC+2 (heure allemande d'été, occupation) → `07:00Z` |
| 7 | Kolkata, 01/01/1990 06:00 | UTC+5:30 |
| 8 | Sydney, 01/01/1990 06:00 | UTC+11 (été austral) |

Les cas 5 et 6 sont les vrais tests de régression : ils échouent avec toute implémentation
naïve à offset fixe.

## 3. `natal.ts`

Longitudes écliptiques géocentriques apparentes via `astronomy-engine` :
`GeoVector(body, time, true)` → `Ecliptic(...)` pour les planètes, `GeoMoon` pour la Lune,
`Body.Pluto` inclus. Précision de la bibliothèque : quelques secondes d'arc sur la période
utile — sans commune mesure avec le bruit du modèle astrologique lui-même.

**Ascendant et Milieu du Ciel**, dérivés du temps sidéral local, de la latitude et de
l'obliquité :

```
θ  = SiderealTime(t) * 15 + lng            (RAMC en degrés)
ε  = 23.4392911 − 0.0130042·T − 1.64e-7·T² + 5.04e-7·T³      (T = siècles depuis J2000)
MC  = atan2( sin θ, cos θ · cos ε )
ASC = atan2( cos θ, −( sin θ · cos ε + tan φ · sin ε ) )
DSC = ASC + 180°   IC = MC + 180°
```

Gestion des quadrants et normalisation `[0,360)` explicites. Latitudes |φ| > 66° :
l'Ascendant reste défini, on le calcule sans cas particulier.

**Maisons en signes entiers** — décision actée, Placidus non implémenté :
`house(p) = ((signe(p) − signe(ASC) + 12) mod 12) + 1`.

**Validation** : trois thèmes de référence documentés (données de naissance publiques),
comparaison aux longitudes de référence — tolérance **0,05°** pour les planètes, **0,2°**
pour ASC/MC. Ces tests conditionnent la suite du développement.

## 4. `aspects.ts`

| Aspect | Angle | Orbe |
|---|---|---|
| Conjonction | 0° | ±6° |
| Sextile | 60° | ±4° |
| Carré | 90° | ±5° |
| Trigone | 120° | ±5° |
| Opposition | 180° | ±6° |

Exactitude, pondération de la proximité à l'exact :

```
e = (1 − orbe / orbeMax) ^ 1.6
```

À 0,5° d'orbe sur un trigone (max 5°) : `e = 0,84`. À 4,5° : `e = 0,025`. Rapport **≈ 34×**.
Un aspect large existe sans peser ; un aspect serré domine la journée.

## 5. `transits.ts`

- Fenêtre : J → J+89, 90 jours, calés sur **midi dans le fuseau de résidence** de
  l'utilisateur (le fuseau de naissance ne sert qu'au thème natal).
- Planètes lentes : un échantillon par jour suffit (Mars ≈ 0,5°/j).
- **Lune : 3 échantillons** (00 h, 12 h, 24 h locales) et on retient le meilleur orbe du
  jour. Elle avance de 13°/jour ; échantillonner à midi seul ferait manquer un exact à 20 h.
- Chaque jour renvoie la liste brute des aspects trouvés `{ transit, aspect, natal, orb, e }`,
  conservée jusqu'au rapport : c'est elle qui alimente les textes et l'affichage des orbes.

Volume : 48 couples (transit × point natal) × 5 aspects × 90 jours = **21 600 combinaisons
testées**, typiquement 200 à 400 aspects retenus. Ce sont ces deux nombres réels qui
s'affichent sur l'écran de calcul.

## 6. `scoring.ts`

### 6.1 Poids

Planètes en transit :

| Axe | Poids |
|---|---|
| Business | Jupiter 1,00 · Saturne 0,90 · Mercure 0,60 · Soleil 0,70 |
| Amour | Vénus 1,00 · Mars 0,70 · Jupiter 0,65 · Lune 0,45 |
| Énergie | Mars 1,00 · Saturne 0,85 · Soleil 0,80 · Lune 0,50 |

Points natals visés :

| Axe | Poids |
|---|---|
| Business | Soleil 1,00 · MC 0,95 · Mercure 0,70 · Jupiter 0,60 |
| Amour | Vénus 1,00 · Lune 0,80 · DSC 0,75 · Soleil 0,60 |
| Énergie | ASC 1,00 · Soleil 0,85 · Mars 0,80 · Lune 0,55 |

Polarité de l'aspect, modulée par la nature du transitant :

| | Trigone | Sextile | Conjonction | Carré | Opposition |
|---|---|---|---|---|---|
| Jupiter, Vénus, Soleil, Mercure, Lune | +1,00 | +0,70 | **+0,90** | −1,00 | −0,90 |
| Saturne, Mars | +0,60 | +0,45 | **−0,80** | −1,00 | −0,90 |

Jupiter en carré est ramené à −0,50 : c'est de l'excès, pas un mur.

**Bonus d'exactitude du jour (+15 %)** si l'orbe de ce jour est inférieur à celui de la
veille *et* du lendemain. C'est ce qui règle le problème des transits lents : sans lui, un
Saturne carré Soleil pendant trois semaines produit un plateau ; avec lui, le jour de
l'exact ressort comme un pic.

Score brut du jour = `Σ poidsTransit × poidsNatal × polarité × e × (1 + bonusExact)`.

### 6.2 Normalisation intra-personne — le point qui décide de la valeur du produit

Un produit plat ne vaut rien. Une échelle absolue rend la moitié des rapports plats.
Le percentile pur garantit l'amplitude mais **détruit la forme** : un vrai pic devient un
plateau, et le ruban perd son intérêt. Approche retenue, hybride :

```
1. lissage    s = 0,25·x[d−1] + 0,50·x[d] + 0,25·x[d+1]     (bords renormalisés)
2. centrage robuste   z = (s − médiane) / max(1,4826·MAD, ε)
3. compression        c = tanh(z / 2,2)                       ∈ (−1, 1)
4. étalement          score = 3 + 94 · (c − min c) / (max c − min c)
```

Résultat garanti : minimum ≈ 3, maximum ≈ 97, **par personne**, tout en conservant la
forme réelle de la courbe — les pics restent des pics, les plateaux restent des plateaux.
Le lissage élimine le bruit lunaire d'un jour isolé sans effacer les vrais événements.

Cas dégénéré (`max c − min c` quasi nul, thème avec très peu d'aspects sur la fenêtre) :
recalcul avec des orbes élargies ×1,5. Un test couvre ce cas.

**Effet de bord assumé.** L'étalement absorbe l'offset constant produit par les transits
lents. On ne perd pas cette information : on l'affiche à part, une ligne par axe en tête
du rapport — *« Fond de période : Saturne traverse ta maison 10 sur les 90 jours. »*
Ajout que je recommande : c'est l'information la plus impressionnante du rapport et elle
disparaîtrait sinon.

### 6.3 Sélection des dates

Top 5 et bottom 3 par axe avec **contrainte d'espacement minimum de 3 jours** : on garde le
meilleur jour de chaque grappe. Sans elle, un seul transit exact livre cinq dates
consécutives et le rapport paraît vide.

## 7. Génération des textes

- Modèle : `claude-sonnet-4-6`, côté serveur uniquement.
- Entrée : l'aspect canonique réel (transitant, aspect, point natal, orbe, axe, maison),
  **jamais le prénom** — il est injecté après coup dans le gabarit, pour que le cache soit
  partagé entre utilisateurs.
- Sortie attendue : une phrase qui cite l'aspect, une phrase qui dit quoi en faire.
  Ton direct, concret, adulte. Interdits explicites dans le prompt : « les astres te
  sourient », « l'univers t'envoie un signe », « énergies négatives », et toute formulation
  de voyance.
- **Cache en base** — table `aspect_copy`, clé =
  `axe | transitant | aspect | pointNatal | seau d'orbe (0–1° / 1–3° / 3°+) | rétrograde`.
  Environ 1 400 combinaisons possibles au total : le coût en tokens tend vers zéro dès les
  premières centaines de rapports.
- **Garde-fou santé, axe Énergie.** Règle écrite dans le prompt *et* vérifiée en sortie
  par un filtre déterministe (lexique médical : opération, chirurgie, médecin, symptôme,
  diagnostic, traitement, médicament, maladie, douleur…). Sur détection : une régénération
  avec contrainte renforcée, puis repli sur une phrase gabarit déterministe. Aucun texte
  non vérifié ne peut atteindre l'utilisateur.

## 8. Base de données

```
readings      id · first_name · birth_date · birth_time · birth_time_known
              city_id · lat · lng · tz · birth_utc · dst_anomaly
              natal jsonb · scores jsonb · priority_axis
              email · stripe_session_id · paid_at · created_at

cities        geonames_id · name · ascii_name · admin1 · country
              lat · lng · population · tz     (index trigram sur ascii_name)

aspect_copy   key (pk) · axis · body · aspect · natal_point · orb_bucket
              retro · text · model · created_at
```

L'email est enregistré **avant** la redirection Stripe, donc conservé même si le paiement
échoue. Confirmation de paiement par webhook Stripe uniquement, jamais par retour client.

## 9. Ordre d'exécution

1. `time.ts` + ses 8 tests — rien d'autre tant qu'ils ne passent pas.
2. `natal.ts` + les 3 thèmes de référence.
3. `aspects.ts`, `transits.ts`, `scoring.ts` + tests d'invariants
   (min ≈ 3, max ≈ 97, espacement des dates, cas dégénéré).
4. `<TideRibbon>` en composant isolé, sur une page de démonstration alimentée par de
   vrais scores.
5. Le tunnel complet.
6. Stripe, Resend, image de partage.
