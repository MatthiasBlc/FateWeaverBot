# Système de Capacités

## Vue d'ensemble

Le système de capacités permet aux personnages d'effectuer des actions spéciales dans le jeu. Chaque capacité a un coût en Points d'Action (PA) et peut apporter divers avantages ou effets au personnage et à sa ville.

## Types de Capacités

### 1. Capacités de Récolte

Ces capacités permettent d'obtenir des ressources pour la ville.

#### Chasser (🦌)

- **Coût** : 1 PA
- **Effet** : Rapporte des vivres à la ville
- **Détails** :
  - Rendement aléatoire plus élevé en été
  - Utilise la fonction `getHuntYield()` pour déterminer le rendement

#### Cueillir (🌿)

- **Coût** : 1 PA
- **Effet** : Récolte des plantes comestibles
- **Détails** :
  - Rendement plus élevé en été
  - Utilise la fonction `getGatherYield()`

#### Pêcher (🎣)

- **Coût** : 1 PA (2 PA pour un meilleur lancer)
- **Effet** : Pêche des poissons pour la ville
- **Spécial** :
  - Possibilité de faire un "lucky roll" en dépensant 1 PA supplémentaire

### 2. Capacités Sociales

#### Divertir

- **Effet** : Réduit le stress des autres personnages
- **Mécanique** :
  - Un compteur est incrémenté à chaque utilisation
  - Tous les 5 utilisations, un spectacle est organisé
  - Le spectacle offre des avantages supplémentaires à la ville

## Gestion des Capacités

### Acquisition des Capacités

- Les personnages peuvent acquérir de nouvelles capacités via le menu d'administration
- Chaque capacité a un coût en PA à l'utilisation
- Certaines capacités peuvent avoir des prérequis

### Utilisation des Capacités

1. Le joueur sélectionne une capacité disponible
2. Le système vérifie si le personnage a assez de PA
3. L'effet de la capacité est appliqué
4. Les PA sont déduits du total du personnage

## Système de PA (Points d'Action)

- Chaque personnage dispose de PA qui se régénèrent avec le temps
- Les capacités consomment des PA à l'utilisation
- Le nombre maximum de PA est de 4 par défaut

## Gestion Administrative

### Ajout/Suppression de Capacités

Les administrateurs peuvent :

- Ajouter des capacités à un personnage
- Retirer des capacités d'un personnage
- Voir la liste des capacités d'un personnage

### Types de Capacités

Les capacités sont catégorisées pour une meilleure organisation :

- `HARVEST` : Capacités de récolte (chasse, cueillette, pêche)
- `SOCIAL` : Capacités d'interaction sociale
- `CRAFT` : Capacités d'artisanat (à implémenter)

## Exemple d'Utilisation

```typescript
// Exemple d'utilisation d'une capacité de chasse
const result = await capabilityService.executeHarvestCapacity(
  characterId,
  "chasser",
  isSummer,
  useLuckyRoll
);

if (result.success) {
  // Afficher le résultat au joueur
  console.log(result.message);
}
```

## Notes Techniques

- Les capacités sont stockées dans la table `capability` de la base de données
- La relation entre les personnages et les capacités est gérée via la table de jointure `characterCapability`
- Les capacités peuvent être modifiées dynamiquement via l'interface d'administration

## Équilibrage

- Les rendements des capacités sont équilibrés en fonction de la saison (été/hiver)
- Les coûts en PA sont ajustés pour maintenir un équilibre entre les différentes capacités

---

Divertir ne fonctionne pas pour l'instant :

UPDATE:
pêche n'est pas impactée par la saison.
Nouvelle table de tirage :

utilisation de 1 PA :
[0 vivre, 1 vivre, 1 vivre, 1 vivre,1 vivre,2 bois,2 bois,2 minerai, 2 minerai,2 vivres,2 vivres,2 vivres, 3 vivres,3 vivres,3 vivres,4 vivres, 4 vivres]

Utilisation de 2PA
[1 vivres,2 vivres,2 vivres,2 vivres,2 vivres,4 bois, 4 minerai,3 vivres,3 vivres,3 vivres,3 vivres,6 bois,5 minerai,5 vivres,5 vivres,10 vivres,1 grigri]
(pour le grigri, pour l'instant juste mettre un message, logique à implémenter)

Harvest supplémentaires :
Miner → 2PA = Minerai (tirage entre 2 et 6 minerai)
Bûcheronner → 1 PA = 2-3 Bois

Bûcheronner est une capacité de base que tout les personnages doivent avoir à leur création.

CRAFT
Tisser → 1/2PA = 1-5 Minerai → 2-12 Tissu (X bois = min X-1 | max X3)
Forger → 1/2PA = 1-5 Minerai → 2-12 Métaux (X bois = min X-1 | max X3)
Travailler le bois → 1/2PA = 1-5 Bois → 2-12 Planches (X bois = min X-1 | max X3)
Cuisiner → 1/2PA = 1-5 Vivres → 2-12 Nourriture (X vivres = min X-1 | max X3)

Nouvelle catégorie : SCIENTIST
SCIENTIST
Cartographier → 1/2 PA = prévi carte sur 1/3 cases (type + dangerosité)
Soigner → 1 PA = +1 PV à qqn / 2PA = +1 Cataplasme (Cataplasme = 1 PV portatif. 3 max dans le monde)
Rechercher → 1/2 PA = 1/3 infos sur (sujet choisi)
Auspice → 1/2 PA = prévi météo sur 1/3 jours

V2 Draft:

Objectif : Implémentation complète du système de capacités V2

🎯 Mission

Mettre à jour le système de capacités du jeu pour passer en Version 2, avec intégration des nouvelles mécaniques CRAFT, SCIENCE et ajustements sur les capacités existantes.

⚙️ CONTEXTE TECHNIQUE

Pense à l'économie de tokens et demande moi de déléguer avec un prompt à supernova si cela peut te faire économiser des crédits.

Tu es à 45% de token used pour cette session. Prévois des documents permettant de continuer le travail depuis une autre machine (sans historique de conversation) avant d'arriver à 100%

Les capacités sont définies dans la table capability

Les relations personnages ↔ capacités sont gérées via characterCapability

Les ressources sont gérées dans townStock et expeditionStock

Chaque capacité consomme des Points d’Action (PA)

Les logs sont générés par le logService

La commande /stock (ville) remplace désormais /foodstock

🧱 TÂCHES À EFFECTUER
1️⃣ Mise à jour des ressources
➕ Ajouter dans la DB :

Cataplasme

➕ Vérifier l’existence et corriger :

Bois

Minerai

Vivres

Tissu

Fer

Planches

Nourriture

⚠️ Contrainte :

cataplasme doit avoir un stock max de 3 par ville (somme ville + expéditions liées).

2️⃣ Capacités de récolte (HARVEST)
🎣 Pêcher

Ne dépend plus de la saison

Tables fixes :

1 PA :

[0 vivre, 1 vivre, 1 vivre, 1 vivre, 1 vivre, 2 bois, 2 bois, 2 minerai, 2 minerai, 2 vivres, 2 vivres, 2 vivres, 3 vivres, 3 vivres, 3 vivres, 4 vivres, 4 vivres]

2 PA :

[1 vivres, 2 vivres, 2 vivres, 2 vivres, 2 vivres, 4 bois, 4 minerai, 3 vivres, 3 vivres, 3 vivres, 3 vivres, 6 bois, 5 minerai, 5 vivres, 5 vivres, 10 vivres, 1 grigri]

Si le tirage donne 1 grigri → log uniquement :

“{character} a trouvé un grigri !”

Nouvelles capacités de récolte
a. Bûcheronner

Catégorie : HARVEST

Coût : 1 PA

Effet : Tire un nombre aléatoire de bois entre 2 et 3

Implémentation :

Ajout direct de la ressource “Bois” dans le stock de la ville

Capacité de base : tous les personnages l’ont dès leur création

b. Miner

Catégorie : HARVEST

Coût : 2 PA

Effet : Tire un nombre aléatoire de minerai entre 2 et 6

Implémentation :

Ajoute du “Minerai” à la ville

Peut être réservée à certaines classes ou acquise par progression

3️⃣ Capacités d’artisanat (CRAFT)
🪡 Tisser

Entrée : Bois → Sortie : Tissu

Utilisable uniquement en ville

PA Entrée Sortie Règle
1 max 1 bois Tissu Y = random(X−1, X×3)
2 choix 1–5 bois Tissu Y = random(X−1, X×3)

Log :

“{character} a tissé du tissu à partir de {X} bois et obtenu {Y} tissu.”

⚒️ Forger

Entrée : Minerai → Sortie : Fer

Même règles que Tisser

🪵 Travailler le bois

Entrée : Bois → Sortie : Planches

Même logique que Tisser/Forger

🍲 Cuisiner

Entrée : Vivres → Sortie : Nourriture

Même logique que Tisser/Forger

Log :

“{character} a cuisiné {X} vivres et obtenu {Y} nourritures.”

4️⃣ Capacités de science et médecine (SCIENCE)
⚕️ Soigner

1 PA → +1 PV à une cible

2 PA → Crée 1 cataplasme

Log selon le cas :

“{character} soigne {target} (+1 PV).”

“{character} prépare un cataplasme.”

🩹 Gestion des cataplasmes :

Ressource stockable (max 3 par ville)

Peut être transportée dans une expédition DEPARTED

Si un personnage :

est vivant

manque de PV

et a accès à ≥1 cataplasme (ville ou expédition)

alors afficher un bouton “Utiliser un cataplasme” dans /stock ou /expedition.

🩹 Effet du bouton :

Consomme 1 cataplasme

Restaure +1 PV

Log :

“{character} utilise un cataplasme et retrouve des forces (+1 PV).”

🔬 Analyse / Recherche / Auspice / Cartographie

Capacités de type SCIENCE.

PA Effet Log
1 1 information (résolution admin) “{character} étudie {subject}.”
2 3 informations (résolution admin) “{character} analyse en profondeur {subject}.”

Ces capacités sont manuelles côté admin, mais le log doit être automatique avec tag d’intervention possible.

5️⃣ Capacités sociales
🎭 Divertir

1 PA = +1 à un compteur sur le personnage (divertirCount)

Si compteur < 5 :

“{character} prépare un spectacle.”

Si compteur atteint 5 :

Log : “{character} fait son spectacle.”

Effet : +1 PM à tous les personnages de la ville

Reset compteur à 0

6️⃣ Ajustements divers

Ajouter Travailler le bois comme capacité de base donnée à tout personnage à la création.

Supprimer /foodstock → /stock

Mettre à jour le rendu /stock et /expedition pour intégrer :

cataplasme

nourriture

tissu

fer

planches

Adapter les affichages de ressources consommables pour les capacités à plusieurs PA (choix dynamique du coût).

🧮 Données à seed / migration
Table capability

Ajouter (si manquants) :

["tisser", "forger", "travailler_le_bois", "cuisiner", "soigner", "analyser", "cartographier", "auspice"]

Table resource

Ajouter :

["cataplasme"]

Table characterCapability

✅ Tests attendus

Vérifier chaque capacité individuellement avec 1 PA et 2 PA

Vérifier que la limite de 3 cataplasmes fonctionne

Vérifier que “Utiliser un cataplasme” s’affiche uniquement quand c’est possible

Vérifier que les rendements aléatoires sont dans les bornes définies

Vérifier que le spectacle de “Divertir” se déclenche correctement

Vérifier que les ressources sont bien affichées dans /stock et /expedition

💬 À la fin de la tâche

Claude doit produire :

Update de GAME-MECHANICS.md

Un log clair dans la console ou via l’UI lors de l’exécution de chaque capacité.
