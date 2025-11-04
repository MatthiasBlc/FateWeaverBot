# Plan de Refactorisation Bot - FateWeaverBot

**Date de création**: 2025-10-30
**Basé sur**: Audit complet post-refactoring Phases 1-5
**Objectifs**: DRY, maintenabilité, optimisation tokens AI, professionnalisme

---

## Vue d'Ensemble

### État Actuel
- **158 fichiers TypeScript** (~35,390 lignes)
- **Refactoring Phases 1-5** déjà complétées
- **Build**: ✅ Compile sans erreurs
- **Architecture**: Feature-based avec utils centralisés

### Problèmes Identifiés
1. **54 fichiers** avec emojis hardcodés (❌ ✅ ⚠️ etc.)
2. **3 mega-handlers** (3,989 lignes total) - token bloat
3. **57 fichiers** avec types `any` - manque de type safety
4. **8 directories** sans barrel exports (index.ts)
5. **623 blocs try-catch** avec patterns similaires
6. **19 fichiers** avec console.log au lieu de logger

### Impact Token Estimé
- **Économies potentielles**: 700-975 tokens (15-20%)
- **Amélioration maintenabilité**: Significative
- **Réduction dette technique**: Majeure

---

## Phase 1: Quick Wins (1-2 jours)

### 1.1 Centralisation Emojis 🎯 PRIORITÉ CRITIQUE

**Problème**: 54 fichiers contiennent des emojis hardcodés au lieu d'utiliser les constantes centralisées.

**Solution**: Importer depuis `/bot/src/constants/emojis.ts` (qui re-exporte `/shared/constants/emojis.ts`)

#### Fichier Principal: constants/messages.ts
**Impact**: 50+ emojis hardcodés dans les messages d'erreur

```typescript
// AVANT
export const ERROR_MESSAGES = {
  NO_CHARACTER: "❌ Aucun personnage actif trouvé.",
  CHARACTER_DEAD: "❌ Un personnage mort ne peut pas effectuer cette action.",
  // ... 50+ autres
}

// APRÈS
import { STATUS } from './emojis';

export const ERROR_MESSAGES = {
  NO_CHARACTER: `${STATUS.ERROR} Aucun personnage actif trouvé.`,
  CHARACTER_DEAD: `${STATUS.ERROR} Un personnage mort ne peut pas effectuer cette action.`,
  // ...
}
```

#### Liste Complète des Fichiers (54 total)
Voir `/docs/RefactorisationBot/action-items.md` Section 1.1 pour la liste exhaustive.

**Estimation**: 4-6 heures
**Token savings**: 200-250 tokens

---

### 1.2 Barrel Exports (index.ts) 🎯 PRIORITÉ HAUTE

**Problème**: 8 directories sans fichier index.ts = imports longs et verbeux

#### Fichiers à Créer

1. **`/src/services/index.ts`**
```typescript
export * from './api/index.js';
export * from './capability.service.js';
export * from './characters.service.js';
export * from './chantiers.service.js';
export * from './logger.js';
export * from './httpClient.js';
// ... etc
```

2. **`/src/features/admin/index.ts`**
```typescript
export * from './character-admin/index.js';
export * from './expedition-admin.handlers.js';
export * from './stock-admin/index.js';
export * from './projects-admin/index.js';
// ... etc
```

3. **`/src/features/admin/stock-admin/index.ts`**
4. **`/src/features/admin/projects-admin/index.ts`**
5. **`/src/features/admin/character-admin/index.ts`**
6. **`/src/features/expeditions/handlers/index.ts`**
7. **`/src/commands/index.ts`**
8. **`/src/constants/index.ts`**

**Estimation**: 1-2 heures
**Token savings**: 50-75 tokens

---

### 1.3 Fix Type Safety - Base API Service 🎯 PRIORITÉ HAUTE

**Problème**: `base-api.service.ts` désactive les règles TypeScript avec `any` types

**Fichier**: `/src/services/api/base-api.service.ts`

```typescript
// AVANT
/* eslint-disable @typescript-eslint/no-explicit-any */
params?: Record<string, any>
catch (error: any)

// APRÈS
// Supprimer le eslint-disable
params?: Record<string, string | number | boolean>
catch (error: unknown) {
  if (error instanceof Error) {
    // Handle typed error
  }
}
```

**Estimation**: 1 heure
**Impact**: Meilleure type safety dans toute l'app

---

### 1.4 Remplacer console.log par logger 🎯 PRIORITÉ MOYENNE

**Fichiers affectés**: 19 fichiers (5 identifiés par grep)

```typescript
// AVANT
console.log("Debug info")
console.error("Error occurred")

// APRÈS
import logger from '../../services/logger.js';

logger.info("Debug info")
logger.error("Error occurred")
```

**Estimation**: 30 minutes
**Fichiers prioritaires**:
- `/src/features/users/users.handlers.ts`
- `/src/features/expeditions/handlers/expedition-display.ts`
- `/src/features/projects/project-creation.ts`
- `/src/services/capability.service.ts`
- `/src/config/index.ts`

---

## Phase 2: Architecture Improvements (2-3 jours)

### 2.1 Créer Error Handler Utility 🎯 PRIORITÉ HAUTE

**Problème**: 623 blocs try-catch avec patterns répétitifs

**Solution**: Créer `/src/utils/error-handlers.ts`

```typescript
import { STATUS } from '../constants/emojis';
import logger from '../services/logger.js';
import type { Interaction } from 'discord.js';

export async function handleApiError(
  error: unknown,
  interaction: Interaction,
  context: string
): Promise<void> {
  logger.error(`API error in ${context}`, { error });

  if (interaction.isRepliable()) {
    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ['Ephemeral']
    });
  }
}

export async function handleValidationError(
  error: unknown,
  interaction: Interaction
): Promise<void> {
  const message = error instanceof Error ? error.message : 'Erreur de validation';
  logger.warn(`Validation error: ${message}`);

  if (interaction.isRepliable()) {
    await interaction.reply({
      content: `${STATUS.WARNING} ${message}`,
      flags: ['Ephemeral']
    });
  }
}
```

**Usage dans les features**:
```typescript
// AVANT
try {
  const data = await apiService.get(url);
} catch (error) {
  logger.error("Error", { error });
  await interaction.reply({ content: "Error", flags: ["Ephemeral"] });
}

// APRÈS
try {
  const data = await apiService.get(url);
} catch (error) {
  await handleApiError(error, interaction, "fetching data");
}
```

**Estimation**: 2 heures (création)
**Token savings**: 50-100 tokens
**Refactoring**: 3-4 heures (appliquer dans top 20 handlers)

---

### 2.2 Ajouter Return Types 🎯 PRIORITÉ MOYENNE

**Problème**: Beaucoup de fonctions sans type de retour explicite

**Solution**: Ajouter annotations de type pour toutes les fonctions exportées

```typescript
// AVANT
export async function handleProfileCommand(interaction: any) {
  // ...
}

// APRÈS
export async function handleProfileCommand(
  interaction: ButtonInteraction
): Promise<void> {
  // ...
}
```

**Estimation**: 3-4 heures
**Impact**: Meilleure autocomplete et détection d'erreurs

---

### 2.3 Réduire Usage de Type Assertions 🎯 PRIORITÉ MOYENNE

**Problème**: 68 utilisations de `as any` / `as unknown`

**Solution**: Créer des interfaces propres au lieu de contourner le système de types

```typescript
// AVANT
const data = response.data as any;

// APRÈS
interface ApiResponse {
  data: CharacterData;
  status: string;
}
const response: ApiResponse = await apiService.get(...);
```

**Estimation**: 4-6 heures

---

## Phase 3: Handler Splitting (3-5 jours) 🎯 PRIORITÉ CRITIQUE

### 3.1 Problème: Mega-Handlers

| Fichier | Lignes | Impact Tokens |
|---------|--------|---------------|
| button-handler.ts | 1,849 | ~200 tokens |
| select-menu-handler.ts | 1,187 | ~120 tokens |
| modal-handler.ts | 953 | ~100 tokens |
| **TOTAL** | **3,989** | **~420 tokens** |

### 3.2 Solution: Distribution par Features

#### Structure Actuelle (Centralisée)
```
src/utils/
├── button-handler.ts (1,849 lignes)
├── modal-handler.ts (953 lignes)
└── select-menu-handler.ts (1,187 lignes)
```

#### Structure Proposée (Feature-based)
```
src/features/
├── expeditions/
│   ├── handlers/
│   │   ├── expedition-buttons.ts (buttons liés aux expéditions)
│   │   ├── expedition-modals.ts (modals d'expédition)
│   │   └── expedition-selects.ts (menus de sélection)
├── projects/
│   ├── handlers/
│   │   ├── project-buttons.ts
│   │   └── project-modals.ts
├── admin/
│   ├── handlers/
│   │   ├── admin-buttons.ts
│   │   ├── admin-modals.ts
│   │   └── admin-selects.ts
└── users/
    └── handlers/
        ├── user-buttons.ts (eat_food, etc.)
        └── user-modals.ts

src/core/handlers/
├── button-router.ts (dispatcher léger)
├── modal-router.ts (dispatcher léger)
└── select-router.ts (dispatcher léger)
```

### 3.3 Implémentation: Router Pattern

**Créer `/src/core/handlers/button-router.ts`**:
```typescript
import type { ButtonInteraction } from 'discord.js';
import { handleExpeditionButtons } from '../../features/expeditions/handlers/expedition-buttons.js';
import { handleProjectButtons } from '../../features/projects/handlers/project-buttons.js';
import { handleAdminButtons } from '../../features/admin/handlers/admin-buttons.js';
import { handleUserButtons } from '../../features/users/handlers/user-buttons.js';

export async function routeButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;

  // Route to appropriate feature handler based on prefix
  if (customId.startsWith('expedition_')) {
    await handleExpeditionButtons(interaction);
  } else if (customId.startsWith('project_')) {
    await handleProjectButtons(interaction);
  } else if (customId.startsWith('character_admin_') || customId.startsWith('stock_admin_')) {
    await handleAdminButtons(interaction);
  } else if (customId.startsWith('eat_food:') || customId.startsWith('use_cataplasm:')) {
    await handleUserButtons(interaction);
  } else {
    // Handle unknown button
    logger.warn(`Unknown button interaction: ${customId}`);
  }
}
```

**Exemple: `/src/features/expeditions/handlers/expedition-buttons.ts`**:
```typescript
import type { ButtonInteraction } from 'discord.js';
import { handleExpeditionJoin } from './expedition-join.js';
import { handleExpeditionLeave } from './expedition-leave.js';
import { handleExpeditionTransfer } from './expedition-transfer.js';
// ... etc

export async function handleExpeditionButtons(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;

  if (customId.startsWith('expedition_join:')) {
    await handleExpeditionJoin(interaction);
  } else if (customId.startsWith('expedition_leave:')) {
    await handleExpeditionLeave(interaction);
  } else if (customId.startsWith('expedition_transfer:')) {
    await handleExpeditionTransfer(interaction);
  }
  // ... handle other expedition buttons
}
```

### 3.4 Étapes d'Implémentation

1. **Créer les routers légers** (core/handlers/) - 2 heures
2. **Extraire handlers par feature** (button → features/) - 6-8 heures
3. **Extraire handlers modals** (modal → features/) - 4-6 heures
4. **Extraire handlers select menus** (select → features/) - 4-6 heures
5. **Mettre à jour index.ts** pour nouveau flow - 1 heure
6. **Testing et validation** - 2-3 heures

**Estimation totale**: 19-26 heures (3-5 jours)
**Token savings**: 300-400 tokens

---

## Phase 4: Handler Consolidation (2-3 jours)

### 4.1 Fichiers Complexes à Réorganiser

| Fichier | Lignes | Action |
|---------|--------|--------|
| project-add.ts | 1,695 | Split form logic vs validation |
| new-element-admin.handlers.ts | 1,682 | Split par type d'élément |
| element-object-admin.handlers.ts | 1,522 | Modulariser les CRUD |
| projects.handlers.ts | 1,512 | Séparer display/invest/complete |

### 4.2 Exemples de Split

#### projects.handlers.ts (1,512 lignes)
```
features/projects/
├── project.command.ts (entry point)
└── handlers/
    ├── project-display.ts (affichage)
    ├── project-invest.ts (investissement)
    ├── project-complete.ts (finalisation)
    └── project-buttons.ts (interactions)
```

#### new-element-admin.handlers.ts (1,682 lignes)
```
features/admin/
├── elements/
│   ├── element-resource.ts
│   ├── element-skill.ts
│   ├── element-capability.ts
│   └── element-object.ts
```

**Estimation**: 16-24 heures (2-3 jours)

---

## État d'Avancement

### Checklist Globale

#### Phase 1: Quick Wins ⏳
- [ ] 1.1 Emojis centralisés (54 fichiers) - 4-6h
- [ ] 1.2 Barrel exports (8 fichiers) - 1-2h
- [ ] 1.3 Fix base-api.service.ts types - 1h
- [ ] 1.4 Console.log → logger (19 fichiers) - 0.5h

**Total Phase 1**: 6.5-9.5 heures

#### Phase 2: Architecture ⏳
- [ ] 2.1 Error handler utility + application (top 20) - 5-6h
- [ ] 2.2 Return type annotations - 3-4h
- [ ] 2.3 Réduire type assertions - 4-6h

**Total Phase 2**: 12-16 heures

#### Phase 3: Handler Splitting ⏳
- [ ] 3.1 Créer routers (button/modal/select) - 2h
- [ ] 3.2 Extraire button handlers - 6-8h
- [ ] 3.3 Extraire modal handlers - 4-6h
- [ ] 3.4 Extraire select handlers - 4-6h
- [ ] 3.5 Update imports et testing - 3-4h

**Total Phase 3**: 19-26 heures

#### Phase 4: Handler Consolidation ⏳
- [ ] 4.1 Split project-add.ts - 4-6h
- [ ] 4.2 Split new-element-admin - 4-6h
- [ ] 4.3 Split element-object-admin - 4-6h
- [ ] 4.4 Split projects.handlers - 4-6h

**Total Phase 4**: 16-24 heures

---

## Estimation Totale

| Phase | Durée | Tokens Saved |
|-------|-------|--------------|
| Phase 1 | 1-2 jours | 250-325 |
| Phase 2 | 2-3 jours | 150-250 |
| Phase 3 | 3-5 jours | 300-400 |
| Phase 4 | 2-3 jours | Maintenabilité |
| **TOTAL** | **8-13 jours** | **700-975 tokens** |

**Réduction estimée du contexte AI**: 15-20%

---

## Protocole de Reprise

Pour reprendre le travail à tout moment sans contexte:

1. **Lire ce fichier** (`PLAN_REFACTORISATION.md`)
2. **Checker l'état d'avancement** (cocher les cases ci-dessus)
3. **Lire les détails de la tâche en cours** dans `action-items.md`
4. **Référencer les findings** dans `findings-summary.md` si besoin

### Commande de Reprise
```
Claude, continue la refactorisation du bot. Lis /docs/RefactorisationBot/PLAN_REFACTORISATION.md
et reprends là où on s'est arrêté.
```

---

## Documentation Complémentaire

- **`findings-summary.md`**: Résumé des problèmes identifiés
- **`action-items.md`**: Liste détaillée des actions (362 lignes)
- **`report-audit.md`**: Rapport complet de l'audit (377 lignes)
- **`README.md`**: Guide de navigation de la documentation

---

**Dernière mise à jour**: 2025-10-30
**Prochaine étape**: Commencer Phase 1.1 (Emojis)
