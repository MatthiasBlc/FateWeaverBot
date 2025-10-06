# Capacités V1 – ToDo

## ✅ État d'avancement

**Base de données et Backend : 100% terminé**
- Tous les modèles Prisma et services backend sont opérationnels
- Système de saisons avec cron hebdomadaire fonctionnel
- Logique de capacités avec effets aléatoires implémentée

**Commandes Discord : 60% terminé**
- ✅ `/use-capacity` : Complètement fonctionnelle avec toutes les fonctionnalités
- ✅ `/profil` : Section capacités + boutons d'action rapide
- ⏳ Prochaines étapes : `/character-admin`, `/season-admin`

**Tests : 0% terminé**
- Tests unitaires et validation à programmer

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
  - [x] Créer le cron hebdomadaire pour le changement de saison (`season-change.cron.ts`) et l'intégrer au démarrage du serveur

## Étape 3 : Commandes Discord
- [x] `/use-capacity` :
  - [x] Menu déroulant des capacités disponibles
  - [x] Validation des conditions (PA, localisation)
  - [x] Application des effets
  - [x] Logs publics
  - [x] Autocomplétion des capacités
  - [x] Gestion spéciale pêche (lucky roll)

- [ ] Mise à jour `/profil` :
  - [x] Section "Capacités connues"
  - [x] Boutons d'action rapide

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
- [x] `bot/src/commands/use-capacity.ts` - Nouveau
- [ ] `bot/src/commands/season-admin.ts` - Nouveau
- [ ] Mise à jour des commandes existantes
- [ ] Tests unitaires
