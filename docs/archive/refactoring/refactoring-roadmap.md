# 🗺️ Roadmap de Refactorisation du Bot FateWeaver

**Objectif** : Réduire le code de ~1,270 lignes et améliorer la maintenabilité
**Durée estimée** : 2-3 semaines (2-3h par jour)
**Statut actuel** : Phase 1 en cours (30% complété)

---

## 📊 Vue d'Ensemble

| Phase | Description | Lignes | Statut | Fichiers |
|-------|-------------|--------|--------|----------|
| **Phase 1** | Extraction UI Utils | -570 | 🟡 30% | 37 fichiers |
| **Phase 2** | Découpage Expeditions | 0 (réorg) | ⚪ 0% | 1 fichier → 6 |
| **Phase 3** | Logique Métier | -400 | ⚪ 0% | 20+ fichiers |
| **Phase 4** | Admin Split (optionnel) | -300 | ⚪ 0% | 2 fichiers → 6 |

---

## 🎯 Phase 1: Extraction des Fonctions d'UI (PRIORITÉ HAUTE)

**Objectif** : Centraliser les embeds et composants Discord
**Gain estimé** : -570 lignes
**Fichiers créés** : ✅ `utils/embeds.ts`, ✅ `utils/discord-components.ts`

### ✅ Complété (30%)

- [x] Créer `utils/embeds.ts` avec builders réutilisables
- [x] Créer `utils/discord-components.ts` pour composants
- [x] Migrer 1 exemple dans `character-admin.interactions.ts`
- [x] Vérifier compilation TypeScript
- [x] Vérifier ESLint

### 📋 TODO: Migration des Embeds (37 embeds restants)

#### Batch 1: character-admin.interactions.ts (6 embeds) - 2h
- [ ] **1.1** Migrer `handleAdvancedStatsModalSubmit` (ligne ~306-343)
  - Remplacer `new EmbedBuilder().setColor(0x00ff00)...` par `createSuccessEmbed()`
  - Utiliser `EMBED_COLORS.SUCCESS`
- [ ] **1.2** Migrer `handleKillButton` (ligne ~419-423)
  - Utiliser `createErrorEmbed("Personnage Tué", ...)`
- [ ] **1.3** Migrer `handleToggleRerollButton` (ligne ~473-483)
  - Utiliser `createSuccessEmbed()`
- [ ] **1.4** Migrer `handleViewCapabilities` (ligne ~680-686)
  - Utiliser `createInfoEmbed()` avec `EMBED_COLORS.INFO`
- [ ] **1.5** Migrer `handleCapabilitySelect` embeds (ligne ~756-762)
  - Utiliser `createSuccessEmbed()` ou `createErrorEmbed()` selon l'action
- [ ] **1.6** Vérifier compilation après batch 1

#### Batch 2: users.handlers.ts (5 embeds) - 2h
- [ ] **2.1** Migrer fonction `createProfileEmbed` (ligne ~237-373)
  - Utiliser `getHungerColor()` depuis `utils/embeds.ts`
  - Simplifier la création d'embed avec `createCustomEmbed()`
- [ ] **2.2** Migrer les embeds de capacités
  - Utiliser `createListEmbed()` pour la liste de capacités
- [ ] **2.3** Nettoyer les imports inutilisés
- [ ] **2.4** Vérifier compilation après batch 2

#### Batch 3: expedition.handlers.ts (8 embeds) - 3h
- [ ] **3.1** Migrer `handleExpeditionMainCommand` embed (ligne ~100-165)
  - Utiliser `createInfoEmbed()` pour affichage expédition
- [ ] **3.2** Migrer `handleExpeditionJoinCommand` embeds (ligne ~750-810)
  - Utiliser `createListEmbed()` pour liste d'expéditions
- [ ] **3.3** Migrer `handleExpeditionInfoCommand` embed (ligne ~942-1006)
  - Utiliser `createCustomEmbed()` avec champs personnalisés
- [ ] **3.4** Migrer les embeds de confirmation/erreur
  - Remplacer par `createSuccessEmbed()` / `createErrorEmbed()`
- [ ] **3.5** Vérifier compilation après batch 3

#### Batch 4: stock-admin.handlers.ts (6 embeds) - 2h
- [ ] **4.1** Migrer `handleStockAdminCommand` embed principal
  - Utiliser `createCustomEmbed()` avec `getStockColor()`
- [ ] **4.2** Migrer les embeds de modification de stock
  - Utiliser `createSuccessEmbed()` pour confirmations
- [ ] **4.3** Migrer les embeds d'erreur
  - Utiliser `createErrorEmbed()`
- [ ] **4.4** Vérifier compilation après batch 4

#### Batch 5: Autres fichiers (12 embeds) - 3h
- [ ] **5.1** Migrer `chantiers.handlers.ts` (3 embeds)
- [ ] **5.2** Migrer `hunger.handlers.ts` (2 embeds)
- [ ] **5.3** Migrer `foodstock.handlers.ts` (2 embeds)
- [ ] **5.4** Migrer `admin/expedition-admin.handlers.ts` (3 embeds)
- [ ] **5.5** Migrer `help/` handlers (2 embeds)
- [ ] **5.6** Vérifier compilation finale

#### Batch 6: Migration des Boutons (15 occurrences) - 2h
- [ ] **6.1** Remplacer créations de `ActionRowBuilder<ButtonBuilder>` dans `expedition.handlers.ts`
  - Utiliser `createActionButtons()` depuis `utils/discord-components.ts`
  - Lignes concernées: ~112-120, ~195-203, ~1011-1020
- [ ] **6.2** Migrer les boutons de `character-admin.components.ts`
  - Utiliser `createConfirmationButtons()`
- [ ] **6.3** Migrer les menus de sélection vers `createSelectMenu()`
- [ ] **6.4** Vérifier compilation après batch 6

### ✅ Validation Phase 1
- [ ] **V1.1** Build TypeScript sans erreur
- [ ] **V1.2** ESLint sans nouvelles erreurs
- [ ] **V1.3** Tests manuels: `/profile`, `/expedition`, `/stock-admin`
- [ ] **V1.4** Compter les lignes gagnées (objectif: -570)

---

## 🚀 Phase 2: Découpage Expeditions (PRIORITÉ HAUTE)

**Objectif** : Diviser `expedition.handlers.ts` (1,731 lignes) en modules cohérents
**Gain estimé** : 0 lignes (mais +50% maintenabilité)
**Durée** : 6-8h (réparties sur plusieurs jours)

### Structure Cible

```
features/expeditions/
├── expedition.command.ts          # Entry point (~100 lignes)
├── expedition-utils.ts            # ✅ CRÉÉ (~80 lignes)
├── handlers/
│   ├── expedition-display.ts     # Affichage et info (~300 lignes)
│   ├── expedition-create.ts      # Création (~350 lignes)
│   ├── expedition-join.ts        # Rejoindre/quitter (~400 lignes)
│   └── expedition-manage.ts      # Gestion/transfer (~500 lignes)
└── expedition.types.ts            # Types existants
```

### 📋 TODO: Préparation (1h)

- [x] **P2.1** Créer `expedition-utils.ts` avec helpers
  - ✅ `getStatusEmoji()`, `isExpeditionEditable()`, etc.
- [ ] **P2.2** Créer le répertoire `handlers/`
  - ✅ Déjà créé
- [ ] **P2.3** Analyser les dépendances entre fonctions
  - Lister les imports partagés
  - Identifier les fonctions appelées mutuellement
- [ ] **P2.4** Créer un fichier `expedition-shared.ts` pour types/constantes communes

### 📋 TODO: Extraction Display (2h)

- [ ] **D2.1** Créer `handlers/expedition-display.ts`
- [ ] **D2.2** Extraire `handleExpeditionMainCommand` (ligne 48-250)
  - Copier la fonction complète
  - Ajouter les imports nécessaires
  - Utiliser `getStatusEmoji()` depuis `expedition-utils.ts`
- [ ] **D2.3** Extraire `handleExpeditionInfoCommand` (ligne 881-1037)
  - Copier la fonction
  - Utiliser les helpers depuis `expedition-utils.ts`
- [ ] **D2.4** Créer fonction helper `createExpeditionEmbed(expedition, options?)`
  - Factoriser la création d'embed répétée
  - Utiliser `createCustomEmbed()` depuis `utils/embeds.ts`
- [ ] **D2.5** Exporter toutes les fonctions
- [ ] **D2.6** Vérifier compilation

### 📋 TODO: Extraction Create (2h)

- [ ] **C2.1** Créer `handlers/expedition-create.ts`
- [ ] **C2.2** Extraire `handleExpeditionCreateNewButton` (ligne 251-293)
- [ ] **C2.3** Extraire `handleExpeditionStartCommand` (ligne 334-413)
- [ ] **C2.4** Extraire `handleExpeditionCreationModal` (ligne 415-695)
  - Fonction la plus longue: 280 lignes
  - Peut être subdivisée en helpers internes
- [ ] **C2.5** Créer helper `validateExpeditionData(data)`
  - Extraire la validation répétée
- [ ] **C2.6** Vérifier compilation

### 📋 TODO: Extraction Join (2h)

- [ ] **J2.1** Créer `handlers/expedition-join.ts`
- [ ] **J2.2** Extraire `handleExpeditionJoinExistingButton` (ligne 295-332)
- [ ] **J2.3** Extraire `handleExpeditionJoinCommand` (ligne 697-815)
- [ ] **J2.4** Extraire `handleExpeditionJoinSelect` (ligne 817-879)
- [ ] **J2.5** Extraire `handleExpeditionLeaveButton` (ligne 1054-1187)
  - ~130 lignes de logique de départ
- [ ] **J2.6** Créer helper `canCharacterJoinExpedition(character, expedition)`
- [ ] **J2.7** Vérifier compilation

### 📋 TODO: Extraction Manage (2-3h)

- [ ] **M2.1** Créer `handlers/expedition-manage.ts`
- [ ] **M2.2** Extraire `handleExpeditionTransferButton` (ligne 1188-1314)
- [ ] **M2.3** Extraire `handleExpeditionTransferDirectionSelect` (ligne 1316-1457)
- [ ] **M2.4** Extraire `handleExpeditionTransferModal` (ligne 1459-fin)
  - Fonction complexe avec beaucoup de logique métier
- [ ] **M2.5** Créer helpers de validation:
  - `validateTransferAmount(amount, available)`
  - `calculateTransferResult(from, to, amount)`
- [ ] **M2.6** Vérifier compilation

### 📋 TODO: Création Entry Point (1h)

- [ ] **E2.1** Créer `expedition.command.ts`
- [ ] **E2.2** Importer toutes les fonctions depuis `handlers/`
- [ ] **E2.3** Exporter un objet avec tous les handlers:
  ```typescript
  export const expeditionHandlers = {
    main: handleExpeditionMainCommand,
    info: handleExpeditionInfoCommand,
    create: handleExpeditionCreateNewButton,
    // ... etc
  };
  ```
- [ ] **E2.4** Créer une fonction de routing si nécessaire

### 📋 TODO: Migration des Imports (1h)

- [ ] **I2.1** Identifier tous les fichiers qui importent `expedition.handlers.ts`
  - `index.ts`
  - `button-handler.ts`
  - `modal-handler.ts`
  - `select-menu-handler.ts`
- [ ] **I2.2** Mettre à jour les imports dans `index.ts`
- [ ] **I2.3** Mettre à jour les imports dans `button-handler.ts`
- [ ] **I2.4** Mettre à jour les imports dans `modal-handler.ts`
- [ ] **I2.5** Mettre à jour les imports dans `select-menu-handler.ts`

### 📋 TODO: Nettoyage (30min)

- [ ] **N2.1** Supprimer l'ancien `expedition.handlers.ts`
- [ ] **N2.2** Vérifier qu'aucun import cassé ne reste
- [ ] **N2.3** Build TypeScript complet
- [ ] **N2.4** ESLint sur tous les nouveaux fichiers

### ✅ Validation Phase 2
- [ ] **V2.1** Build sans erreur
- [ ] **V2.2** ESLint sans nouvelles erreurs
- [ ] **V2.3** Tests manuels: toutes les commandes `/expedition`
- [ ] **V2.4** Vérifier les logs: pas d'erreurs au runtime
- [ ] **V2.5** Mesurer complexité: chaque fichier < 400 lignes

---

## 🔧 Phase 3: Mutualisation Logique Métier (PRIORITÉ MOYENNE)

**Objectif** : Extraire la logique dupliquée
**Gain estimé** : -400 lignes
**Durée** : 4-5h

### 📋 TODO: Création Utils Validation (1h)

- [ ] **UV3.1** Créer `utils/validation.ts`
- [ ] **UV3.2** Créer `validateCharacterActive(character)`
  - Vérifier `!character.isDead && character.isActive`
  - Retourner message d'erreur si invalide
- [ ] **UV3.3** Créer `validateUserPermissions(interaction, requiredRole?)`
  - Vérifier permissions admin si nécessaire
- [ ] **UV3.4** Créer `validateResourceQuantity(quantity, available)`
  - Vérifier quantité > 0 et <= disponible
- [ ] **UV3.5** Créer `validatePAAvailable(character, required)`
  - Vérifier PA suffisants pour action
- [ ] **UV3.6** Export toutes les fonctions

### 📋 TODO: Création Utils Formatting (1h)

- [ ] **UF3.1** Créer `utils/formatting.ts`
- [ ] **UF3.2** Créer `formatCharacterStats(character)`
  - Retourner string formaté: "PA: 3/4, PV: 5/5, PM: 4/5"
- [ ] **UF3.3** Créer `formatResourceList(resources)`
  - Retourner liste formatée avec emojis
- [ ] **UF3.4** Créer `formatTimeRemaining(date)`
  - Retourner "2j 5h" ou "3h 20min"
- [ ] **UF3.5** Créer `formatMemberList(members)`
  - Retourner liste "• Nom - @username"
- [ ] **UF3.6** Créer `formatHungerStatus(hungerLevel)`
  - Retourner emoji + texte

### 📋 TODO: Création Utils Interaction Helpers (1h)

- [ ] **UI3.1** Créer `utils/interaction-helpers.ts`
- [ ] **UI3.2** Créer `replyWithError(interaction, message, details?)`
  - Utiliser `createErrorEmbed()` automatiquement
  - Gérer flags ephemeral par défaut
- [ ] **UI3.3** Créer `replyWithSuccess(interaction, title, description?, fields?)`
  - Utiliser `createSuccessEmbed()` automatiquement
- [ ] **UI3.4** Créer `deferAndExecute(interaction, handler)`
  - Wrapper pour defer + execute + error handling
- [ ] **UI3.5** Créer `handleCharacterCheck(interaction)`
  - Récupérer et valider personnage actif
  - Retourner character ou null + reply d'erreur

### 📋 TODO: Migration Validation (2h)

- [ ] **MV3.1** Migrer `character-admin.interactions.ts`
  - Remplacer validations par fonctions utils
  - Réduction estimée: ~30 lignes
- [ ] **MV3.2** Migrer `expedition/handlers/*.ts`
  - Remplacer validations répétées
  - Réduction estimée: ~80 lignes
- [ ] **MV3.3** Migrer `users.handlers.ts`
  - Utiliser `handleCharacterCheck()`
  - Réduction estimée: ~20 lignes
- [ ] **MV3.4** Migrer `chantiers.handlers.ts`
  - Réduction estimée: ~40 lignes
- [ ] **MV3.5** Migrer autres handlers
  - Réduction estimée: ~50 lignes

### 📋 TODO: Migration Formatting (1h)

- [ ] **MF3.1** Migrer affichages de stats dans `users.handlers.ts`
  - Utiliser `formatCharacterStats()`
- [ ] **MF3.2** Migrer listes de ressources dans `stock-admin.handlers.ts`
  - Utiliser `formatResourceList()`
- [ ] **MF3.3** Migrer affichages de temps dans `expedition/handlers/*.ts`
  - Utiliser `formatTimeRemaining()`
- [ ] **MF3.4** Migrer listes de membres
  - Utiliser `formatMemberList()`

### 📋 TODO: Migration Interaction Helpers (1h)

- [ ] **MI3.1** Migrer réponses d'erreur dans tous les handlers
  - Remplacer `interaction.reply({ content: "❌...", flags: ["Ephemeral"] })`
  - Par `replyWithError(interaction, "...")`
  - Réduction estimée: ~100 lignes
- [ ] **MI3.2** Migrer réponses de succès
  - Utiliser `replyWithSuccess()`
  - Réduction estimée: ~50 lignes
- [ ] **MI3.3** Migrer checks de personnage répétés
  - Utiliser `handleCharacterCheck()`
  - Réduction estimée: ~70 lignes

### ✅ Validation Phase 3
- [ ] **V3.1** Build sans erreur
- [ ] **V3.2** ESLint sans nouvelles erreurs
- [ ] **V3.3** Tests fonctionnels complets
- [ ] **V3.4** Compter lignes gagnées (objectif: -400)

---

## 📦 Phase 4: Simplification Handlers Admin (OPTIONNEL)

**Objectif** : Réduire complexité des fichiers admin
**Gain estimé** : -300 lignes
**Durée** : 3-4h
**Priorité** : BASSE (faire si temps disponible)

### 📋 TODO: Découpage Stock Admin (2h)

- [ ] **SA4.1** Créer `features/admin/stock/`
- [ ] **SA4.2** Créer `stock-admin.command.ts` (~100 lignes)
- [ ] **SA4.3** Créer `stock-view.handlers.ts` (~300 lignes)
  - Extraire affichage principal
- [ ] **SA4.4** Créer `stock-modify.handlers.ts` (~300 lignes)
  - Extraire ajout/modification/suppression
- [ ] **SA4.5** Créer `stock-embeds.ts` (~100 lignes)
  - Factoriser création d'embeds
- [ ] **SA4.6** Migrer les imports

### 📋 TODO: Découpage Character Admin (2h)

- [ ] **CA4.1** Créer `features/admin/character/`
- [ ] **CA4.2** Créer `character-stats.handlers.ts` (~300 lignes)
  - Extraire modification de stats
- [ ] **CA4.3** Créer `character-capabilities.handlers.ts` (~300 lignes)
  - Extraire gestion des capacités
- [ ] **CA4.4** Créer `character-embeds.ts` (~100 lignes)
  - Factoriser embeds
- [ ] **CA4.5** Migrer les imports

### ✅ Validation Phase 4
- [ ] **V4.1** Build sans erreur
- [ ] **V4.2** Tests admin complets
- [ ] **V4.3** Compter lignes gagnées (objectif: -300)

---

## 📈 Suivi de Progression

### Métriques Actuelles (au démarrage)

```
Total lignes: 12,693
Fichiers: 99
Top 5 fichiers:
  1. expedition.handlers.ts: 1,731 lignes (13.6%)
  2. stock-admin.handlers.ts: 836 lignes (6.6%)
  3. character-admin.interactions.ts: 772 lignes (6.1%)
  4. users.handlers.ts: 684 lignes (5.4%)
  5. chantiers.handlers.ts: 646 lignes (5.1%)
```

### Objectifs Finaux

```
Total lignes: ~11,400 (-10%)
Fichiers: ~115 (+16 fichiers mieux organisés)
Plus gros fichier: <500 lignes
Embeds dupliqués: 0 (vs 37)
Fonctions utilitaires: +30
```

---

## 🎮 Commandes de Suivi

### Compter les lignes actuelles
```bash
find bot/src -name "*.ts" -exec wc -l {} + | tail -1
```

### Compter les embeds restants à migrer
```bash
grep -rn "new EmbedBuilder" bot/src --include="*.ts" | wc -l
```

### Vérifier la taille des fichiers
```bash
find bot/src -name "*.ts" -exec wc -l {} + | sort -rn | head -10
```

### Build et tests
```bash
npm run build
npm run lint
```

---

## 📝 Notes de Session

**Comment utiliser ce document :**

1. **Chaque jour** : Choisir 1-2 tâches d'un batch
2. **Cocher** les cases au fur et à mesure
3. **Commit** après chaque batch complété
4. **Tester** régulièrement (pas seulement à la fin)
5. **Documenter** les problèmes rencontrés dans cette section

### Session 1 (Date: _____)
- Tâches: _______________
- Durée: _______________
- Problèmes: _______________
- Notes: _______________

### Session 2 (Date: _____)
- Tâches: _______________
- Durée: _______________
- Problèmes: _______________
- Notes: _______________

---

## ❓ FAQ

**Q: Puis-je faire les phases dans un ordre différent ?**
R: Oui, mais Phase 1 est recommandée en premier car elle réduit le plus de duplication.

**Q: Combien de temps par jour ?**
R: 30min minimum, 2-3h idéal pour maintenir le contexte.

**Q: Que faire si un test casse ?**
R: Revenir en arrière immédiatement, commit la version qui fonctionne.

**Q: Puis-je sauter Phase 4 ?**
R: Oui, c'est optionnel. Phases 1-3 apportent 90% des bénéfices.

**Q: Comment demander à Claude de continuer ?**
R: "Continue le refactoring, fais les tâches X.Y à X.Z du batch N"

---

**Dernière mise à jour** : ${new Date().toISOString().split('T')[0]}
**Version** : 1.0
**Auteur** : Claude Code Assistant
