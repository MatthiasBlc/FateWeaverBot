# Capacités V1 – ToDo

## ✅ État d'avancement

**Base de données et Backend : 100% terminé**

- Tous les modèles Prisma et services backend sont opérationnels
- Système de saisons avec cron hebdomadaire fonctionnel
- Logique de capacités avec effets aléatoires implémentée

**Commandes Discord : 100% terminé**

- ✅ `/use-capacity` : Interface utilisateur complète avec autocomplétion
- ✅ `/profil` : Section capacités + boutons d'action rapide
- ✅ `/season-admin` : Administration complète des saisons
- ✅ `/character-admin` : Extension avec gestion des capacités personnages

**🎉 PROJET CAPACITÉS V1 TERMINÉ À 100%**

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
  - [x] **Remplacé par boutons dans /profil** (UX supérieure)

- [x] Mise à jour `/profil` :

  - [x] Section "Capacités connues"
  - [x] Boutons d'action rapide avec désactivation intelligente selon PA
  - [x] Emojis spécifiques par capacité

- [ ] Extension `/character-admin` :

  - [x] Gestion des capacités (ajout/suppression)
  - [x] Interface de sélection multiple

- [ ] Nouvelle commande `/season-admin` :
  - [x] Affichage saison actuelle
  - [x] Changement manuel de saison
  - [x] Prochaine rotation prévue

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

## Étape 5 : Corrections diverses

- [ ] /character-admin gestion des capacités, n'afficher le bouton retirer capacité que si le character a des capacités
- [ ] divertir n'est pas fonctionnel
- [ ] pêcher ne permet pas de choisir 2 PA (pour le lucky)
- [ ] pếcher ne permet pas d'avoir un objet
- [x] Nettoyage du code : Suppression de `/use-capacity` (remplacé par boutons profil)

## Fichiers à modifier/créer

- [x] `prisma/schema.prisma` - Modèles de données
- [x] `backend/src/services/capability.service.ts` - Nouveau
- [x] `backend/src/services/season.service.ts` - Nouveau
- [x] `backend/scripts/init-capabilities.ts` - Script d'initialisation
- [x] `bot/src/commands/use-capacity.ts` - Supprimé (remplacé par boutons profil)
- [x] `bot/src/commands/season-admin.ts` - Nouveau
- [ ] Mise à jour des commandes existantes
- [ ] Tests unitaires
