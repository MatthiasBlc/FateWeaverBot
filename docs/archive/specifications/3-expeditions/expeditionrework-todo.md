# Refactorisation des commandes d'expédition

## Objectif
Refactoriser les commandes d'expédition pour améliorer l'UX utilisateur avec une commande principale `/expedition` intelligente qui s'adapte au contexte du personnage.

## Commandes actuelles
- `/expedition start` - Créer une nouvelle expédition
- `/expedition join` - Rejoindre une expédition existante
- `/expedition info` - Voir les informations de son expédition
- `/expedition admin` - Administration des expéditions (inchangé)

## Nouveau comportement souhaité
### Commande `/expedition` (principale)
- **Si le personnage est membre d'une expédition** : affiche les informations détaillées de son expédition (comme `/expedition info` actuel)
- **Si le personnage n'est pas membre d'une expédition** : affiche la liste des expéditions disponibles avec deux boutons :
  - "Créer une nouvelle expédition" → redirige vers `/expedition start`
  - "Rejoindre une expédition" → redirige vers `/expedition join` (si des expéditions sont disponibles)

## Détail des tâches

### 1. Analyse du comportement actuel
- **Fichier concerné** : `bot/src/commands/user-commands/expedition.ts`
- **Analyse** :
  - Commande actuelle avec sous-commandes (`start`, `join`, `info`)
  - Chaque sous-commande appelle un handler spécifique
  - Structure : `new SlashCommandBuilder().setName("expedition").addSubcommand(...).addSubcommand(...)`

### 2. Modification de la commande principale
- **Fichier à modifier** : `bot/src/commands/user-commands/expedition.ts`
- **Changements** :
  - Supprimer les sous-commandes (`start`, `join`, `info`)
  - Créer une commande simple sans sous-commandes
  - Changer l'execute pour appeler `handleExpeditionMainCommand`
- **Résultat attendu** :
  ```typescript
  const command: Command = {
    data: new SlashCommandBuilder()
      .setName("expedition")
      .setDescription("Gérer les expéditions - commande principale"),
    async execute(interaction: any) {
      await withUser(handleExpeditionMainCommand)(interaction);
    },
  };
  ```

### 3. Création du handler principal
- **Fichier à modifier** : `bot/src/features/expeditions/expedition.handlers.ts`
- **Nouvelle fonction** : `handleExpeditionMainCommand`
- **Logique** :
  1. Récupérer le personnage actif de l'utilisateur
  2. Vérifier s'il est membre d'une expédition active
  3. **Si membre** : appeler fonction d'affichage des infos d'expédition
  4. **Si non membre** : appeler fonction d'affichage de la liste d'expéditions

### 4. Fonction d'affichage pour membres d'expédition
- **Nom de fonction** : `handleExpeditionInfoForMember`
- **Comportement** :
  - Récupérer l'expédition active du personnage
  - Créer un embed avec les informations (nom, stock, durée, statut, ville)
  - Ajouter des boutons si l'expédition est en PLANNING :
    - "Quitter" → redirige vers logique de départ
    - "Transférer nourriture" → redirige vers logique de transfert
  - Répondre avec l'embed et les boutons

### 5. Fonction d'affichage pour non-membres
- **Nom de fonction** : `handleExpeditionListForNonMember`
- **Comportement** :
  1. Récupérer les expéditions disponibles (status = PLANNING) de la ville
  2. **Si aucune expédition disponible** :
     - Afficher message "Aucune expédition en cours de planification"
     - Bouton unique "Créer une nouvelle expédition"
  3. **Si expéditions disponibles** :
     - Lister les expéditions avec format `**1.** Nom (durée)`
     - Deux boutons :
       - "Créer une nouvelle expédition" (bouton primaire)
       - "Rejoindre une expédition" (bouton secondaire)

### 6. Gestionnaires de boutons
- **Nouveaux handlers à créer** :
  - `handleExpeditionCreateNewButton` : redirige vers `handleExpeditionStartCommand`
  - `handleExpeditionJoinExistingButton` : redirige vers `handleExpeditionJoinCommand`
- **Intégration** : ajouter ces handlers aux gestionnaires de boutons existants

### 7. Structure des réponses

#### Pour membres d'expédition :
```
🚀 Nom de l'expédition
📦 Stock de nourriture : 50
⏱️ Durée : 3 jours
📍 Statut : 🔄 PLANIFICATION
🏛️ Ville : Nom de la ville

[Quitter] [Transférer nourriture]
```

#### Pour non-membres (aucune expédition) :
```
🏕️ Aucune expédition en cours de planification.

Vous pouvez créer une nouvelle expédition :

[Créer une nouvelle expédition]
```

#### Pour non-membres (expéditions disponibles) :
```
🏕️ Expéditions disponibles :
**1.** Expédition Alpha (3j)
**2.** Expédition Beta (5j)

Choisissez une action :

[Créer une nouvelle expédition] [Rejoindre une expédition]
```

### 8. Points d'attention
- **Préservation des fonctionnalités** : toutes les fonctionnalités existantes doivent être préservées
- **Gestion des erreurs** : même gestion d'erreurs que les commandes actuelles
- **Logs** : maintenir les logs existants pour le debugging
- **Types** : utiliser les types existants (`Expedition`, `Character`, etc.)
- **Middleware** : utiliser `withUser` comme les autres commandes

### 9. Tests à effectuer
1. **Test membre d'expédition** :
   - Créer un personnage membre d'une expédition
   - Utiliser `/expedition`
   - Vérifier que les infos d'expédition s'affichent avec les bons boutons

2. **Test non-membre (aucune expédition)** :
   - Créer un personnage non membre
   - Utiliser `/expedition`
   - Vérifier que le message "aucune expédition" avec bouton création s'affiche

3. **Test non-membre (expéditions disponibles)** :
   - Créer un personnage non membre avec des expéditions PLANNING disponibles
   - Utiliser `/expedition`
   - Vérifier que la liste s'affiche avec les deux boutons

4. **Test boutons** :
   - Cliquer sur "Créer une nouvelle expédition" → doit ouvrir le modal de création
   - Cliquer sur "Rejoindre une expédition" → doit ouvrir la liste de sélection

### 10. Fichiers à modifier
1. `bot/src/commands/user-commands/expedition.ts` - commande principale
2. `bot/src/features/expeditions/expedition.handlers.ts` - handlers principaux
3. Éventuellement les gestionnaires de boutons si nécessaire

### 11. Commandes à conserver
- Les anciennes commandes sous forme de fonctions restent disponibles
- `/expedition admin` inchangé
- Tous les handlers de boutons existants préservés

## Conclusion
Cette refactorisation améliore significativement l'UX en réduisant la complexité cognitive pour l'utilisateur. Au lieu d'avoir à choisir entre 3 commandes différentes, l'utilisateur a maintenant une commande unique qui s'adapte intelligemment à son contexte.
