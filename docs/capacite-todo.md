# Capacités V1 – ToDo

## Étape 1 : Base de données
- [x] Ajouter les modèles Prisma :
  - [x] `Capability` avec les champs requis
  - [x] `CharacterCapability` pour la relation many-to-many
  - [x] Ajouter `divertCounter` dans `Character`
  - [x] Créer la table `Season`

## Étape 2 : Backend
- [x] Créer les services :
  - [x] `capability.service.ts` pour gérer les capacités
  - [x] `season.service.ts` pour la gestion des saisons
  - [x] Implémenter la logique de random et lucky roll
  - [ ] Créer le cron hebdomadaire pour le changement de saison

## Étape 3 : Commandes Discord
- [ ] `/use-capacity` :
  - [ ] Menu déroulant des capacités disponibles
  - [ ] Validation des conditions (PA, localisation)
  - [ ] Application des effets
  - [ ] Logs publics

- [ ] Mise à jour `/profil` :
  - [ ] Section "Capacités connues"
  - [ ] Boutons d'action rapide

- [ ] Extension `/character-admin` :
  - [ ] Gestion des capacités (ajout/suppression)
  - [ ] Interface de sélection multiple

- [ ] Nouvelle commande `/season-admin` :
  - [ ] Affichage saison actuelle
  - [ ] Changement manuel de saison
  - [ ] Prochaine rotation prévue

## Étape 4 : Tests & Validation
- [ ] Tester chaque capacité :
  - [ ] Chasse (été/hiver)
  - [ ] Cueillette (été/hiver)
  - [ ] Pêche avec lucky roll
  - [ ] Divertir (compteur et bonus PM)

- [ ] Vérifier :
  - [ ] Gestion des PA
  - [ ] Mise à jour des stocks
  - [ ] Logs publics
  - [ ] Changement automatique de saison
  - [ ] Gestion des erreurs

## Fichiers à modifier/créer
- [x] `prisma/schema.prisma` - Modèles de données
- [x] `backend/src/services/capability.service.ts` - Nouveau
- [x] `backend/src/services/season.service.ts` - Nouveau
- [x] `backend/scripts/init-capabilities.ts` - Script d'initialisation
- [ ] `bot/src/commands/use-capacity.ts` - Nouveau
- [ ] `bot/src/commands/season-admin.ts` - Nouveau
- [ ] Mise à jour des commandes existantes
- [ ] Tests unitaires
