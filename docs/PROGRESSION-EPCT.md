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

### Phase 3: Améliorations UX (EN COURS)

#### Tâche 3.1: Simplifier /stock
**Fichier** : `bot/src/features/stock/stock.handlers.ts`

**Modifications à faire** :
- [ ] Supprimer lignes 102-109 (info personnage)
- [ ] Supprimer total ressources
- [ ] Supprimer phrase descriptive ville
- [ ] Ajouter tri par catégorie :
  - [ ] Groupe 1 : Nourriture + Vivres en premier
  - [ ] Groupe 2 : Autres ressources par paires (brut + transformé)
- [ ] Tester build
- [ ] Commit : "Simplify /stock display - Remove character info, add resource sorting"

**État** : ⏸️ EN ATTENTE

---

#### Tâche 3.2: Améliorer /help avec catégories
**Fichier** : `bot/src/features/help/help.handlers.ts`

**Modifications à faire** :
- [ ] Créer catégories :
  - [ ] 🍖 Survie (profil, stock)
  - [ ] 🚀 Aventure (expedition)
  - [ ] 🏗️ Communauté (chantiers)
- [ ] Ajouter emojis par catégorie (utiliser constantes)
- [ ] Ajouter exemples d'usage
- [ ] Améliorer descriptions
- [ ] Tester build
- [ ] Commit : "Improve /help with categories and examples"

**État** : ⏸️ EN ATTENTE

---

## 📅 PHASES FUTURES

### Phase 4: Système "Manger +" (3h estimé)
**Fichiers** :
- `bot/src/features/users/users.handlers.ts`
- `bot/src/features/hunger/` (nouveaux handlers)
- Backend: nouveau endpoint `/characters/:id/eat-to-full`

**Tâches** :
- [ ] Ajouter bouton "Manger +" dans profil (si hungerLevel 1-3)
- [ ] Créer handler `handleEatMoreButton` :
  - [ ] Détecter ville vs expédition DEPARTED
  - [ ] Récupérer stocks (vivres + nourriture)
  - [ ] Calculer besoin (4 - hungerLevel)
  - [ ] Afficher embed éphémère avec état + stocks + alertes
  - [ ] 4 boutons dynamiques :
    - [ ] `eat_vivre_1` - Manger 1 vivre
    - [ ] `eat_nourriture_1` - Manger 1 nourriture (si stock > 0)
    - [ ] `eat_vivre_full` - À satiété vivres (X) (si besoin > 1)
    - [ ] `eat_nourriture_full` - À satiété nourriture (X) (si stock >= 2, besoin > 1)
- [ ] Backend: endpoint `eatToFull(characterId, resourceTypeName)`
- [ ] Handlers pour les 4 boutons
- [ ] Tests : ville, expédition, stocks partiels
- [ ] Build + commit

**État** : ⏸️ À VENIR

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

**Tokens utilisés** : 101k / 200k (50%)
**Phases complétées** : 1/7
**Phases en cours** : 2 (Phase 2 Supernova, Phase 3 en cours)
**Temps estimé restant** : ~25h de dev

---

## 🚨 SI SESSION INTERROMPUE

### Reprendre le travail :
1. **Lire ce fichier** : `docs/PROGRESSION-EPCT.md`
2. **Vérifier rapport Supernova Phase 2** (si terminé)
3. **Continuer Phase 3** depuis la dernière tâche cochée
4. **Cocher au fur et à mesure** ✅

### Fichiers de référence :
- Plan général : `docs/TODO.md` (section "Node Discord /update")
- Prompts Supernova : `docs/supernova-prompt-phase*.md`
- Config emojis : `bot/src/constants/emojis.ts`
- Architecture : `bot/ARCHITECTURE.md`

---

**Dernière action** : Création fichier progression, début Phase 3
**Prochaine action** : Simplifier /stock (supprimer info personnage, trier ressources)
