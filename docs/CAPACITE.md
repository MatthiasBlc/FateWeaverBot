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
