# 📋 PROGRESSION EPCT - Node Discord /update

**Dernière mise à jour** : 2025-10-09
**Session actuelle** : 25% tokens utilisés (50k/200k)
**Statut** : En cours - Phase 5 (5.2 terminée)

---

## ✅ PHASES COMPLÉTÉES

### ✅ Phase 1: Quick Wins (TERMINÉE)
- [x] Fix bug `/character-admin` capacités (button IDs)
- [x] Supprimer `/foodstock` (Supernova)
- [x] Supprimer `/manger` (Supernova)
- [x] Supprimer `/ping` (Supernova)
- [x] Renommer `/admin-help` → `/help-admin` (Supernova)
- [x] Renommer `/config-channel` → `/config-channel-admin` (Supernova)
- [x] Build validé ✅
- [x] 5 commits créés
- [ ] ⚠️ Déploiement Discord (à faire manuellement - auth error)

**Fichiers modifiés** :
- `bot/src/features/admin/character-admin.components.ts` (bug fix)
- Supprimés : `foodstock.ts`, `manger.ts`, `ping.ts`, `features/foodstock/`
- Renommés : `help-admin.ts`, `config.command.ts`

---

### ✅ Phase 2: Infrastructure Emojis (TERMINÉE - Supernova)
- [x] Créer `bot/src/constants/emojis.ts` (FAIT)
- [x] Migrer `text-formatters.ts` (11 emojis remplacés)
- [x] Migrer `users.handlers.ts` (~30 emojis remplacés, 3 parties)
- [x] Migrer `chantiers.handlers.ts` (~15 emojis remplacés)
- [x] Build validé ✅ (3/3 builds réussis)
- [x] Commits créés (3 commits Supernova)

**Métriques Supernova** :
- Fichiers migrés : 3
- Emojis remplacés : ~50+
- Imports ajoutés : 3
- Aucune erreur TypeScript sur les modifications

**Bénéfices** :
- Single source of truth pour emojis
- Changement global en 1 fichier
- Autocomplete TypeScript
- Meilleure maintenabilité

**Commits** :
- 721f7e9 - Migrate text-formatters.ts
- 6a5ab06 - Migrate users.handlers.ts (1/3)
- 985542c - Migrate chantiers.handlers.ts

**État** : ✅ MISSION ACCOMPLIE

---

## 🚧 PHASE EN COURS

### ✅ Phase 3: Améliorations UX (TERMINÉE)

#### ✅ Tâche 3.1: Simplifier /stock
**Fichier** : `bot/src/features/stock/stock.handlers.ts`

**Modifications faites** :
- [x] Supprimé lignes 102-109 (info personnage)
- [x] Supprimé total ressources
- [x] Supprimé phrase descriptive ville
- [x] Ajouté tri par catégorie :
  - [x] Groupe 1 : Nourriture + Vivres en premier
  - [x] Groupe 2 : Autres ressources alphabétique
- [x] Testé build ✅
- [x] Commit : "Simplify /stock display" (ce9ca02)

**État** : ✅ TERMINÉE

---

#### ✅ Tâche 3.2: Améliorer /help avec catégories
**Fichier** : `bot/src/features/help/help.utils.ts`

**Modifications faites** :
- [x] Créé catégories :
  - [x] 🍖 Survie (profil, stock)
  - [x] 🚀 Aventure (expedition)
  - [x] 🏗️ Communauté (chantiers)
  - [x] 📚 Aide (help)
  - [x] 🔧 Administration
- [x] Ajouté emojis par catégorie
- [x] Ajouté section exemples d'usage
- [x] Amélioré organisation
- [x] Testé build ✅
- [x] Commit : "Improve /help with better categories" (c973f02)

**État** : ✅ TERMINÉE

---

### ✅ Phase 4: Système "Manger +" (TERMINÉE)

**Note** : Cette phase était déjà implémentée dans une conversation précédente. Seules les corrections TypeScript ont été nécessaires.

#### ✅ Implémentation
**Fichiers** :
- `bot/src/features/users/users.handlers.ts` (bouton Manger+ ajouté)
- `bot/src/features/hunger/eat-more.handlers.ts` (handlers créés)
- `bot/src/utils/button-handler.ts` (handlers enregistrés)

**Modifications faites** :
- [x] Bouton "Manger +" ajouté dans profil (hungerLevel 1-3)
- [x] Handler `handleEatMoreButton` créé :
  - [x] Détecte ville vs expédition DEPARTED
  - [x] Récupère stocks (vivres + nourriture)
  - [x] Calcule besoin (4 - hungerLevel)
  - [x] Affiche embed éphémère avec état + stocks + alertes
  - [x] 4 boutons dynamiques :
    - [x] `eat_vivre_1` - Manger 1 vivre
    - [x] `eat_nourriture_1` - Manger 1 nourriture
    - [x] `eat_vivre_full` - À satiété vivres (X)
    - [x] `eat_nourriture_full` - À satiété nourriture (X)
- [x] Handlers pour les 4 boutons enregistrés
- [x] Utilise endpoints backend existants (eatFood, eatFoodAlternative)
- [x] Correction TypeScript : getExpeditionsByTown au lieu de getExpeditionsByGuild
- [x] Build validé ✅
- [x] Commit : "Fix TypeScript errors in eat-more handler" (d9ff96d)

**État** : ✅ TERMINÉE

---

### ✅ Phase 5: Expéditions Multi-Ressources (EN COURS)

#### ✅ Sous-tâche 5.1: Transfert Multi-Ressources (TERMINÉE)
**Fichiers** :
- `bot/src/modals/expedition-modals.ts` (modal avec 2 champs)
- `bot/src/features/expeditions/handlers/expedition-transfer.ts` (handlers)
- `bot/src/services/api.ts` (méthode getResourceTypes)

**Backend** : ✅ Utilise `/resources/*/transfer` existant

**Modifications faites** :
- [x] Modal `createExpeditionTransferAmountModal` modifié :
  - [x] Ajouté 2 champs : Vivres + Nourriture
  - [x] Placeholders dynamiques avec max
  - [x] Champs optionnels (laissez vide si 0)
- [x] Handler `handleExpeditionTransferDirectionSelect` :
  - [x] Récupère stocks Vivres + Nourriture (expédition + ville)
  - [x] Passe maxVivres et maxNourriture au modal
- [x] Handler `handleExpeditionTransferModal` :
  - [x] Parse les 2 champs (vivres + nourriture)
  - [x] Validation : au moins 1 ressource > 0
  - [x] Validation : quantités <= stocks disponibles
  - [x] Récupère resource type IDs via getResourceTypes()
  - [x] Appels transferResource séparés si quantité > 0
  - [x] Affiche résumé combiné avec stocks mis à jour
- [x] Build validé ✅
- [x] Commit : "Implement multi-resource expedition transfers" (05cec16)

**État** : ✅ TERMINÉE

---

#### ✅ Sous-tâche 5.2: Retour Urgence (TERMINÉE)
**Fichiers** :
- Backend: `backend/prisma/schema.prisma` (ExpeditionEmergencyVote model)
- Backend: `backend/src/services/expedition.service.ts` (toggleEmergencyVote, forceEmergencyReturns)
- Backend: `backend/src/controllers/expedition.ts` (toggleEmergencyVote controller)
- Backend: `backend/src/routes/expedition.ts` (emergency-vote route)
- Backend: `backend/src/cron/expedition.cron.ts` (processEmergencyReturns cron)
- Bot: `bot/src/features/expeditions/handlers/expedition-display.ts` (bouton urgence)
- Bot: `bot/src/features/expeditions/handlers/expedition-emergency.ts` (handler)
- Bot: `bot/src/services/api/expedition-api.service.ts` (toggleEmergencyVote API)
- Bot: `bot/src/utils/button-handler.ts` (enregistrement handler)
- Bot: `bot/src/features/expeditions/expedition.command.ts` (export handler)

**Modifications faites** :
- [x] Migration DB : table `expedition_emergency_votes` créée
- [x] Migration DB : champ `pendingEmergencyReturn` ajouté au modèle Expedition
- [x] Backend: endpoint `POST /expeditions/:id/emergency-vote` créé
- [x] Backend: logique toggle vote (ajoute si absent, retire si présent)
- [x] Backend: logique 50% membres (`Math.ceil(membersCount / 2)`)
- [x] Backend: flag `pendingEmergencyReturn` activé/désactivé selon seuil
- [x] Backend: méthode `forceEmergencyReturns()` pour traiter les expéditions flaggées
- [x] Backend: cron job toutes les 10 minutes (`*/10 * * * *`)
- [x] Bot: bouton "🚨 Voter retour d'urgence" si status DEPARTED
- [x] Bot: customId `expedition_emergency_return:${expId}`
- [x] Bot: handler toggle vote avec affichage décompte et seuil
- [x] Bot: messages éphémères avec état vote + progression
- [x] Bot: logs envoyés au canal de logs
- [x] Build validé ✅
- [x] Commit : "Implement Phase 5.2: Emergency return voting system" (97d4e34)

**État** : ✅ TERMINÉE

---

### Phase 6: Chantiers Ressources (8h estimé)

#### Sous-tâche 6.1: Refonte UI (2h)
**Fichier** : `bot/src/features/chantiers/chantiers.command.ts`

**Tâches** :
- [x] Supprimer subcommands
- [x] Handler direct : affiche liste + bouton "Participer"
- [x] Flow : bouton → select menu → modal PA/ressources
- [x] Tests navigation
- [x] Build + commit

**Modifications faites** :
- [x] Suppression des subcommands `liste` et `build`
- [x] Création de `handleChantiersCommand()` avec affichage liste + bouton "Participer"
- [x] Création de `handleParticipateButton()` avec select menu puis modal
- [x] Enregistrement dans `button-handler.ts` pour `chantier_participate:*`
- [x] Build validé ✅
- [x] Commit : "Refactor /chantiers command: Remove subcommands, add direct UI flow" (7f16e38)

**État** : ✅ TERMINÉE

---

#### Sous-tâche 6.2: Système Coûts Ressources (6h)
**Fichiers** :
- Backend: migration Prisma `ChantierResourceCost`
- Backend: controllers, services
- Bot: admin handlers, user handlers

**Tâches** :
- [x] Migration DB : table ChantierResourceCost
- [x] Backend: `POST /chantiers` avec resourceCosts
- [x] Backend: `POST /chantiers/:id/contribute-resources`
- [x] Backend: `GET /chantiers/:id` avec resourceCosts
- [x] Bot admin: flow création avec ressources
- [x] Bot user: affichage progrès PA + ressources
- [x] Bot user: modal dynamique PA + ressources (max 4)
- [x] Tests : PA seul, PA + ressources, complétion
- [x] Builds + commits

**Modifications faites** :
- [x] Migration Prisma : modèle `ChantierResourceCost` avec relation vers Chantier
- [x] Backend: `chantierService.createChantier()` avec `resourceCosts?`
- [x] Backend: `chantierService.contributeResources()` avec validations
- [x] Backend: endpoint `POST /chantiers/:id/contribute-resources`
- [x] Backend: inclusion des `resourceCosts` dans `getChantiersByTown()` et `getChantierById()`
- [x] Bot: interface `ResourceCost` dans chantiers.handlers.ts
- [x] Bot: affichage avec emojis et progression `${emoji} ${contributed}/${required}`
- [x] Bot: modal dynamique avec PA + jusqu'à 4 ressources (champs générés selon resourceCosts)
- [x] Bot: parsing contributions dans `handleInvestModalSubmit()`
- [x] Bot: 3 modes de contribution : PA seul, ressources seules, PA + ressources
- [x] Bot: `contributeResources()` API method dans chantier-api.service.ts
- [x] Fix erreur TypeScript: `this.apiClient` → `this.api`
- [x] Fix erreur TypeScript: type explicite `(r: ResourceCost) =>`
- [x] Fix erreur backend: ajout `pendingEmergencyReturn` dans expedition.service.ts
- [x] Build validé ✅
- [x] Commit : "Implement Phase 6.2: Chantiers resource costs system" (f1ce834)

**État** : ✅ TERMINÉE

---

### Phase 7: Tests Finaux (Variable)
- [ ] Tests multi-personnages expéditions
- [ ] Vérifier visibilité commandes serveur "A Tale of a Star"
- [ ] Tests votes retour urgence
- [ ] Tests chantiers contributions multiples
- [ ] Validation complète

**État** : ⏸️ À VENIR

---

## 🔧 COMMANDES UTILES

### Build & Deploy
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot
npm run build
npm run deploy
```

### Git
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot
git status
git add -A
git commit -m "message"
git log --oneline -5
```

### Vérifications
```bash
# Linter
npm run lint

# Diagnostics
npx tsc --noEmit
```

---

## 📊 MÉTRIQUES SESSION

**Tokens utilisés** : ~35k / 200k (17.5%)
**Phases complétées** : 6/7 (Phase 1-6 complètes)
**Commits créés** : 4 commits cette session
- 97d4e34 - Implement Phase 5.2: Emergency return voting system
- 04a1bd8 - Update PROGRESSION: Mark Phase 5.2 as completed
- 7f16e38 - Refactor /chantiers command: Remove subcommands, add direct UI flow
- f1ce834 - Implement Phase 6.2: Chantiers resource costs system
**Temps estimé restant** : ~10h de dev

### Détails :
- ✅ Phase 1 : Quick Wins (bug fix + suppressions + renommages) - 5 commits
- ✅ Phase 2 : Emojis (migration centralisée, ~50+ emojis) - 3 commits Supernova
- ✅ Phase 3 : UX (/stock + /help améliorés) - 2 commits
- ✅ Phase 4 : Système "Manger +" (corrections TS appliquées) - 2 commits
- ✅ Phase 5 : Expéditions Multi-Ressources (5.1 + 5.2 terminées) - 4 commits
- ⏸️ Phase 6-7 : À venir

---

## 🚨 SI SESSION INTERROMPUE

### Reprendre le travail :
1. **Lire ce fichier** : `docs/PROGRESSION-EPCT.md`
2. **Passer à Phase 6** : Chantiers Ressources (refonte UI + système coûts ressources)
3. **Cocher au fur et à mesure** ✅

### Fichiers de référence :
- Plan général : `docs/TODO.md` (section "Node Discord /update")
- Config emojis : `bot/src/constants/emojis.ts` (~50+ emojis centralisés)
- Architecture : `bot/ARCHITECTURE.md`
- Système Manger+ : `bot/src/features/hunger/eat-more.handlers.ts`
- Transferts multi-ressources : `bot/src/features/expeditions/handlers/expedition-transfer.ts`

---

**Dernière action** : Phase 5.2 terminée (système de vote retour d'urgence expéditions)
**Prochaine action** : Phase 6 (Chantiers Ressources)
