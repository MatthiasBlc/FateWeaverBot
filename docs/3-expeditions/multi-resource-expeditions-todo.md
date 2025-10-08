# Système de ressources multiples pour les expéditions

## Objectif
Étendre le système d'expédition pour permettre la sélection et la gestion de plusieurs types de ressources lors de la création et pendant l'expédition.

## Ressources disponibles
Le système supporte actuellement 7 types de ressources :
- **Vivres** 🍞 - Ressource brute de survie (base)
- **Bois** 🌲 - Matériau brut (base)
- **Minerai** ⛏️ - Matériau brut (base)
- **Métal** ⚙️ - Produit du minerai (transformé)
- **Tissu** 🧵 - Produit du bois (transformé)
- **Planches** 🪵 - Produit du bois (transformé)
- **Nourriture** 🍖 - Produit des vivres (transformé)

## Fonctionnalités à implémenter

### 1. Interface de sélection de ressources multiples
- **Fichier concerné** : `bot/src/features/expeditions/expedition.handlers.ts`
- **Modifications** :
  - Modifier `createExpeditionCreationModal()` pour afficher plusieurs champs de ressources
  - Ajouter des champs pour chaque type de ressource avec quantités
  - Interface intuitive avec descriptions des ressources

### 2. Traitement côté bot
- **Fichier concerné** : `bot/src/features/expeditions/expedition.handlers.ts`
- **Modifications** :
  - Modifier `handleExpeditionCreationModal()` pour traiter plusieurs ressources
  - Valider que les quantités sont positives et que la ville a assez de stock
  - Construire le tableau `initialResources` avec tous les types sélectionnés

### 3. Backend - Traitement des ressources multiples
- **Fichier concerné** : `backend/src/controllers/expedition.ts`
- **Modifications** :
  - Le contrôleur accepte déjà `initialResources[]` - pas de changement nécessaire
  - Vérifier que tous les types de ressources demandés existent
  - Vérifier que la ville a assez de chaque ressource demandée

### 4. Affichage des ressources multiples
- **Fichiers concernés** :
  - `bot/src/features/expeditions/expedition.handlers.ts` (affichage création)
  - `bot/src/types/expedition.ts` (types)
  - Tous les endroits où les ressources d'expédition sont affichées

- **Modifications** :
  - Afficher toutes les ressources prises par l'expédition
  - Format : "🍞 Vivres: 50, 🌲 Bois: 20, ⛏️ Minerai: 10"
  - Gérer l'affichage dans les embeds et les messages

### 5. Interface utilisateur proposée

#### Modal de création d'expédition :
```
🏕️ Créer une nouvelle expédition

📝 Nom de l'expédition
[_________________________]

📦 Ressources à emporter

🍞 Vivres (stock ville: 100)
[___] quantité

🌲 Bois (stock ville: 50)
[___] quantité

⛏️ Minerai (stock ville: 25)
[___] quantité

⚙️ Métal (stock ville: 10)
[___] quantité

🧵 Tissu (stock ville: 5)
[___] quantité

🪵 Planches (stock ville: 15)
[___] quantité

🍖 Nourriture (stock ville: 30)
[___] quantité

⏱️ Durée de l'expédition (jours)
[___] 1-30 jours

[Créer l'expédition] [Annuler]
```

### 6. Validation des données
- **Côté bot** :
  - Vérifier que les quantités sont des nombres positifs
  - Vérifier que la somme des ressources demandées ne dépasse pas les stocks de la ville
  - Minimum 1 ressource sélectionnée

- **Côté backend** :
  - Vérifier que tous les types de ressources existent
  - Vérifier que la ville a assez de chaque ressource
  - Empêcher la création si ressources insuffisantes

### 7. Affichage des ressources
- **Format proposé** :
  ```
  📦 Ressources de l'expédition :
  🍞 Vivres: 50
  🌲 Bois: 20
  ⛏️ Minerai: 10
  🍖 Nourriture: 15
  ```

### 8. Points techniques à considérer
- **Performance** : Récupérer les stocks de la ville avant d'afficher le modal
- **UX** : Interface claire avec descriptions et stocks actuels
- **Validation** : Prévention des erreurs côté client et serveur
- **Extensibilité** : Facile d'ajouter de nouveaux types de ressources

## Tests à effectuer
1. **Création avec ressources multiples** : Vérifier que plusieurs ressources peuvent être sélectionnées
2. **Validation des stocks** : Empêcher la création si ressources insuffisantes
3. **Affichage correct** : Vérifier que les ressources s'affichent correctement
4. **Transfert automatique** : Vérifier que les ressources sont bien transférées de la ville vers l'expédition

## Conclusion
Cette fonctionnalité va considérablement améliorer l'utilité des expéditions en permettant aux joueurs de préparer leurs expéditions selon leurs besoins spécifiques (construction, nourriture, etc.).
