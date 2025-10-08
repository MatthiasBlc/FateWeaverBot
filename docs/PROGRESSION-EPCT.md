# 📋 PROGRESSION EPCT - Node Discord /update

**Dernière mise à jour** : 2025-10-08
**Session actuelle** : 50% tokens utilisés (100k/200k)
**Statut** : En cours - Phase 3

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

### 🔄 Phase 2: Infrastructure Emojis (EN COURS - Supernova)
- [x] Créer `bot/src/constants/emojis.ts` (FAIT)
- [ ] Migrer `text-formatters.ts` (Supernova en cours)
- [ ] Migrer `users.handlers.ts` (Supernova en cours)
- [ ] Migrer `chantiers.handlers.ts` (Supernova en cours)
- [ ] Build validé
- [ ] Commits créés

**Prompt Supernova** : `docs/supernova-prompt-phase2-emojis.md`
**Attendre rapport** : Supernova doit fournir métriques

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

## 📅 PHASES FUTURES

---

### Phase 5: Expéditions Multi-Ressources (6h estimé)

#### Sous-tâche 5.1: Transfert Multi-Ressources (4h)
**Fichiers** :
- `bot/src/modals/expedition-modals.ts`
- `bot/src/features/expeditions/handlers/expedition-transfer.ts`

**Backend** : ✅ Déjà prêt (`transferResource` supporte tout)

**Tâches** :
- [ ] Modifier `createExpeditionTransferAmountModal` :
  - [ ] Ajouter 2 champs : Vivres + Nourriture
  - [ ] CustomId: `expedition_transfer_amount_modal_${direction}`
- [ ] Modifier `handleExpeditionTransferModal` :
  - [ ] Parser les 2 champs
  - [ ] Appels API séparés si quantité > 0
  - [ ] Validation quantités
- [ ] Tests : vivres seul, nourriture seule, les deux, insuffisant
- [ ] Build + commit

**État** : ⏸️ À VENIR

---

#### Sous-tâche 5.2: Retour Urgence (2h)
**Fichiers** :
- Backend: nouvelle table `expedition_emergency_votes`
- Backend: `expedition.service.ts`, nouveau controller
- Bot: `expedition-display.ts`, nouveau handler

**Tâches** :
- [ ] Migration DB : table votes
- [ ] Backend: endpoints vote/dévote
- [ ] Backend: logique 50% membres
- [ ] Backend: flag `pendingEmergencyReturn`
- [ ] Bot: bouton si status DEPARTED :
  - [ ] `expedition_emergency_return:${expId}`
  - [ ] Toggle vote
  - [ ] Afficher décompte votes
- [ ] Cron: vérifier flag et forcer RETURNED
- [ ] Tests : vote, dévote, seuil, retour effectif
- [ ] Build + commits

**État** : ⏸️ À VENIR

---

### Phase 6: Chantiers Ressources (8h estimé)

#### Sous-tâche 6.1: Refonte UI (2h)
**Fichier** : `bot/src/features/chantiers/chantiers.command.ts`

**Tâches** :
- [ ] Supprimer subcommands
- [ ] Handler direct : affiche liste + bouton "Participer"
- [ ] Flow : bouton → select menu → modal PA/ressources
- [ ] Tests navigation
- [ ] Build + commit

**État** : ⏸️ À VENIR

---

#### Sous-tâche 6.2: Système Coûts Ressources (6h)
**Fichiers** :
- Backend: migration Prisma `ChantierResourceCost`
- Backend: controllers, services
- Bot: admin handlers, user handlers

**Tâches** :
- [ ] Migration DB : table ChantierResourceCost
- [ ] Backend: `POST /chantiers` avec resourceCosts
- [ ] Backend: `POST /chantiers/:id/contribute-resources`
- [ ] Backend: `GET /chantiers/:id` avec resourceCosts
- [ ] Bot admin: flow création avec ressources
- [ ] Bot user: affichage progrès PA + ressources
- [ ] Bot user: boutons "Investir PA" | "Contribuer Ressources"
- [ ] Tests : PA seul, PA + ressources, complétion
- [ ] Builds + commits

**État** : ⏸️ À VENIR

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

**Tokens utilisés** : ~62k / 200k (31%)
**Phases complétées** : 4/7 (Phase 1, 2, 3, 4 terminées)
**Commits créés** : 10 commits
**Temps estimé restant** : ~17h de dev

### Détails :
- ✅ Phase 1 : Quick Wins (bug fix + suppressions + renommages)
- ✅ Phase 2 : Emojis (migration centralisée terminée via Supernova)
- ✅ Phase 3 : UX (/stock + /help améliorés)
- ✅ Phase 4 : Système "Manger +" (corrections TS appliquées)
- ⏸️ Phase 5-7 : À venir

---

## 🚨 SI SESSION INTERROMPUE

### Reprendre le travail :
1. **Lire ce fichier** : `docs/PROGRESSION-EPCT.md`
2. **Continuer Phase 5** : Expéditions Multi-Ressources (transfert + retour urgence)
3. **Cocher au fur et à mesure** ✅

### Fichiers de référence :
- Plan général : `docs/TODO.md` (section "Node Discord /update")
- Config emojis : `bot/src/constants/emojis.ts`
- Architecture : `bot/ARCHITECTURE.md`
- Système Manger+ : `bot/src/features/hunger/eat-more.handlers.ts`

---

**Dernière action** : Phase 4 corrigée (erreurs TypeScript résolues, build OK)
**Prochaine action** : Démarrer Phase 5 (Expéditions Multi-Ressources)
