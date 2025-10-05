# Expédition - TODO Détaillé

## Vue d'ensemble
Système d'expéditions permettant aux personnages de participer à des expéditions qui emportent de la nourriture de leur ville et la restituent après une durée spécifiée.

## ✅ FONCTIONNALITÉS DÉJÀ TERMINÉES

### Backend (100% complet)
- [x] Modèles Prisma (`Expedition`, `ExpeditionMember`, `ExpeditionStatus`)
- [x] Service métier (`expedition.service.ts`) avec toutes les fonctions CRUD
- [x] Contrôleur (`expedition.ts`) avec tous les endpoints REST
- [x] Routes (`expedition.ts`) avec authentification
- [x] Jobs cron (`expedition.cron.ts`) pour transitions automatiques

### Bot Discord (80% complet)
- [x] Commandes utilisateur (`/expedition start/join/info`)
- [x] Handlers utilisateurs avec embeds et boutons
- [x] Commandes admin (`/expedition-admin`)
- [x] Handlers admin avec interface de sélection
- [x] Modales de création d'expédition

## 🔄 FONCTIONNALITÉS À IMPLÉMENTER

### 1. Fonctionnalités utilisateur manquantes ⚠️ **PRIORITÉ CRITIQUE**

#### Bouton "Quitter l'expédition"
- [x] Implémenter `handleExpeditionLeaveButton()` dans `expedition.handlers.ts` (logique complète avec vérifications, gestion dernier membre, logs)

#### Bouton "Transférer nourriture" 
- [x] Créer un modal pour saisir montant et direction (`to_town`/`from_town`)
- [ ] Implémenter `handleExpeditionTransferButton()` 
- [ ] Ajouter la logique de transfert via l'API
- [ ] Mettre à jour l'embed avec les nouveaux stocks

### 2. Fonctionnalités admin manquantes ⚠️ **PRIORITÉ HAUTE**

#### Modification admin (durée/stock)
- [x] Créer un modal pour modification avec champs durée et stock
- [x] Implémenter `handleExpeditionAdminModify()`
- [x] Ajouter les endpoints backend si nécessaire
- [x] Mettre à jour l'embed après modification

#### Gestion des membres admin
- [ ] Créer une interface de sélection de personnage à ajouter/retirer
- [ ] Implémenter `handleExpeditionAdminMembers()`
- [ ] Ajouter les fonctions backend pour gestion forcée des membres
- [ ] Gérer les permissions et notifications

### 3. Améliorations système ⚠️ **PRIORITÉ MOYENNE**

#### Validation d'expédition lors de création/rejointure
- [ ] Ajouter une vérification avant création/rejointure d'expédition
- [ ] Retourner une erreur si personnage déjà dans une expédition active
- [ ] Afficher le message d'erreur : "vous êtes déjà dans une expédition **nom de l'expédition**"

#### Tests et qualité
- [ ] Créer des tests unitaires pour les services
- [ ] Créer des tests d'intégration pour les endpoints
- [ ] Tester les scénarios edge (dernier membre, transferts, etc.)

## 📋 DÉTAILS TECHNIQUES À IMPLÉMENTER

### Modales à créer
1. **Modal de transfert de nourriture**
   - Champs: montant (number), direction (select: "Vers la ville" / "Vers l'expédition")
   - Validation côté client

2. **Modal de modification admin**
   - Champs: durée (number), stock (number)
   - Pré-remplir avec valeurs actuelles

### Handlers à compléter
1. **handleExpeditionLeaveButton()**
   ```typescript
   // Récupérer l'expédition du personnage
   // Vérifier status === PLANNING
   // Appeler API leaveExpedition()
   // Mettre à jour l'embed ou fermer
   ```

2. **handleExpeditionTransferButton()**
   ```typescript
   // Récupérer l'expédition du personnage  
   // Vérifier status === PLANNING
   // Afficher modal de transfert
   // Traiter le submit du modal
   ```

### Endpoints backend manquants
1. **PUT /admin/expeditions/:id** - Modification admin
2. **POST /admin/expeditions/:id/members** - Gestion membres
3. **DELETE /admin/expeditions/:id/members/:characterId** - Retirer membre

## 🧪 TESTS À ÉCRIRE

### Tests unitaires
- [ ] Création d'expédition avec/sans nourriture
- [ ] Join/leave d'expédition
- [ ] Transfert de nourriture (les deux sens)
- [ ] Verrouillage/départ/retour automatique
- [ ] Cas edge (dernier membre, stock insuffisant)

### Tests d'intégration
- [ ] Flux complet utilisateur (créer → rejoindre → quitter)
- [ ] Interface admin complète
- [ ] Interactions boutons/modales

## 🎯 PROCHAINES ÉTAPES

1. **Implémenter les boutons utilisateur** (quitter + transférer)
2. **Implémenter les fonctions admin** (modifier + gérer membres)
3. **Ajouter les validations de statut**
4. **Créer les tests**

## 📅 ÉCHÉANCIER SUGGÉRÉ

- **Semaine 1** : Boutons utilisateur (quitter + transférer)
- **Semaine 2** : Fonctions admin (modifier + gérer membres)  
- **Semaine 3** : Validations et tests
- **Semaine 4** : Polish et documentation finale

## ✅ CRITÈRES D'ACCEPTATION

- [ ] Toutes les fonctionnalités utilisateur opérationnelles
- [ ] Interface admin complète et fonctionnelle
- [ ] Pas d'erreurs console lors des interactions
- [ ] Transitions automatiques fonctionnelles
- [ ] Logs appropriés pour toutes les actions
- [ ] Tests passent (si implémentés)
