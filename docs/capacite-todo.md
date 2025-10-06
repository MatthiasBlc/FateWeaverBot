# Capacités V1 – ToDo

## Étape 1 : Base de données
- [ ] Ajouter les modèles Prisma :
  - [ ] `Capability` avec les champs requis
  - [ ] `CharacterCapability` pour la relation many-to-many
  - [ ] Ajouter `divertCounter` dans `Character`
  - [ ] Créer la table `Season`

## Étape 2 : Backend
- [ ] Créer les services :
  - [ ] `capability.service.ts` pour gérer les capacités
  - [ ] `season.service.ts` pour la gestion des saisons
  - [ ] Implémenter la logique de random et lucky roll
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
- `prisma/schema.prisma` - Modèles de données
- `backend/src/services/capability.service.ts` - Nouveau
- `backend/src/services/season.service.ts` - Nouveau
- `bot/src/commands/use-capacity.ts` - Nouveau
- `bot/src/commands/season-admin.ts` - Nouveau
- Mise à jour des commandes existantes
- Tests unitaires
