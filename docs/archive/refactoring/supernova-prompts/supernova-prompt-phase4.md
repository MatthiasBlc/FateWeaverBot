# 🚀 Prompt pour Code Supernova - Phase 4 Refactoring

**Mission : Décomposer les Fichiers Admin (stock-admin + character-admin)**
**Équipe : Claude Code (planning/validation) + Supernova (exécution) + Utilisateur (oversight)**

---

## 🎯 Objectif de la Mission

Décomposer 2 fichiers admin volumineux en modules spécialisés :
- ✅ stock-admin.handlers.ts (811 lignes) → 3 modules
- ✅ character-admin.interactions.ts (760 lignes) → 3 modules

**Résultat attendu :**
```
admin/
├── stock-admin/
│   ├── stock-display.ts      (~150 lignes)
│   ├── stock-add.ts          (~350 lignes)
│   └── stock-remove.ts       (~350 lignes)
│
├── character-admin/
│   ├── character-select.ts   (~200 lignes)
│   ├── character-stats.ts    (~300 lignes)
│   └── character-capabilities.ts (~300 lignes)
│
├── stock-admin.command.ts    (~20 lignes)
└── character-admin.command.ts (~20 lignes)

Réduction plus gros fichier : 811 → ~350 lignes
```

---

## 📋 Infrastructure Existante

✅ **Utils disponibles :**
- `utils/embeds.ts` - Embeds centralisés
- `utils/discord-components.ts` - Composants
- `utils/character-validation.ts` - Validations
- `utils/interaction-helpers.ts` - Helpers
- `utils/text-formatters.ts` - Formatters

---

## 🔄 Workflow Requis

**⚠️ IMPORTANT : Toutes les commandes npm doivent être exécutées dans le dossier `bot/` !**

**Pour CHAQUE module créé :**
1. ✅ Créer le répertoire si nécessaire
2. ✅ Créer le fichier module
3. ✅ Extraire les fonctions correspondantes
4. ✅ Ajouter les imports nécessaires
5. ✅ **TESTER : `cd bot && npm run build`**
6. ✅ Si OK → passer au suivant
7. ❌ Si erreur → STOP et documenter

**Après TOUS les modules créés :**
1. ✅ Créer les fichiers command (entry points)
2. ✅ Mettre à jour les imports dans handlers
3. ✅ Supprimer les anciens fichiers
4. ✅ **TESTER : `cd bot && npm run build`**
5. ✅ Commit final

---

## 📦 PARTIE A: Stock Admin (811 lignes → 3 modules)

### Étape A1: Créer le répertoire

```bash
mkdir -p src/features/admin/stock-admin
```

---

### Étape A2: stock-display.ts (~150 lignes)

**Fichier à créer :** `bot/src/features/admin/stock-admin/stock-display.ts`

**Fonctions à extraire :**
```typescript
export async function handleStockAdminCommand(interaction: ChatInputCommandInteraction)
export async function handleStockAdminViewButton(interaction: any)
```

**Lignes à copier depuis stock-admin.handlers.ts :**
- handleStockAdminCommand : lignes ~24-125
- handleStockAdminViewButton : lignes ~127-201

**Imports nécessaires :**
```typescript
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createCustomEmbed, getStockColor } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

### Étape A3: stock-add.ts (~350 lignes)

**Fichier à créer :** `bot/src/features/admin/stock-admin/stock-add.ts`

**Fonctions à extraire :**
```typescript
export async function handleStockAdminAddButton(interaction: any)
export async function handleStockAdminAddSelect(interaction: any)
export async function handleStockAdminAddModal(interaction: ModalSubmitInteraction)
```

**Lignes à copier depuis stock-admin.handlers.ts :**
- handleStockAdminAddButton : lignes ~203-297
- handleStockAdminAddSelect : lignes ~375-449
- handleStockAdminAddModal : lignes ~515-677

**Imports nécessaires :**
```typescript
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { replyEphemeral } from "../../../utils/interaction-helpers";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

### Étape A4: stock-remove.ts (~350 lignes)

**Fichier à créer :** `bot/src/features/admin/stock-admin/stock-remove.ts`

**Fonctions à extraire :**
```typescript
export async function handleStockAdminRemoveButton(interaction: any)
export async function handleStockAdminRemoveSelect(interaction: any)
export async function handleStockAdminRemoveModal(interaction: ModalSubmitInteraction)
```

**Lignes à copier depuis stock-admin.handlers.ts :**
- handleStockAdminRemoveButton : lignes ~299-373
- handleStockAdminRemoveSelect : lignes ~451-513
- handleStockAdminRemoveModal : lignes ~679-811

**Imports nécessaires :**
```typescript
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { replyEphemeral } from "../../../utils/interaction-helpers";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

### Étape A5: stock-admin.command.ts (Entry Point)

**Fichier à créer :** `bot/src/features/admin/stock-admin.command.ts`

**Contenu :**
```typescript
/**
 * Entry point pour toutes les fonctions d'admin stock
 * Re-exporte les handlers depuis les modules spécialisés
 */

// Display
export { handleStockAdminCommand, handleStockAdminViewButton } from "./stock-admin/stock-display";

// Add
export { handleStockAdminAddButton, handleStockAdminAddSelect, handleStockAdminAddModal } from "./stock-admin/stock-add";

// Remove
export { handleStockAdminRemoveButton, handleStockAdminRemoveSelect, handleStockAdminRemoveModal } from "./stock-admin/stock-remove";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

## 📦 PARTIE B: Character Admin (760 lignes → 3 modules)

### Étape B1: Créer le répertoire

```bash
mkdir -p src/features/admin/character-admin
```

---

### Étape B2: character-select.ts (~200 lignes)

**Fichier à créer :** `bot/src/features/admin/character-admin/character-select.ts`

**Fonctions à extraire :**
```typescript
export async function handleCharacterSelect(interaction: StringSelectMenuInteraction)
export async function handleCharacterAction(interaction: ButtonInteraction)
```

**Lignes à copier depuis character-admin.interactions.ts :**
- handleCharacterSelect : lignes ~34-60
- handleCharacterAction : lignes ~62-131

**Imports nécessaires :**
```typescript
import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createInfoEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

### Étape B3: character-stats.ts (~300 lignes)

**Fichier à créer :** `bot/src/features/admin/character-admin/character-stats.ts`

**Fonctions à extraire :**
```typescript
export async function handleStatsModalSubmit(interaction: ModalSubmitInteraction)
export async function handleAdvancedStatsModalSubmit(interaction: ModalSubmitInteraction)
```

**Lignes à copier depuis character-admin.interactions.ts :**
- handleStatsModalSubmit : lignes ~133-260
- handleAdvancedStatsModalSubmit : lignes ~262-494

**Imports nécessaires :**
```typescript
import {
  ModalSubmitInteraction,
  type GuildMember,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromModal } from "../../../utils/character";
import { createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

### Étape B4: character-capabilities.ts (~300 lignes)

**Fichier à créer :** `bot/src/features/admin/character-admin/character-capabilities.ts`

**Fonctions à extraire :**
```typescript
export async function handleCapabilitiesButton(interaction: ButtonInteraction)
export async function handleAddCapabilities(interaction: ButtonInteraction)
export async function handleRemoveCapabilities(interaction: ButtonInteraction)
export async function handleViewCapabilities(interaction: ButtonInteraction)
export async function handleCapabilitySelect(interaction: StringSelectMenuInteraction)
```

**Lignes à copier depuis character-admin.interactions.ts :**
- handleCapabilitiesButton : lignes ~496-543
- handleAddCapabilities : lignes ~545-601
- handleRemoveCapabilities : lignes ~603-648
- handleViewCapabilities : lignes ~650-687
- handleCapabilitySelect : lignes ~689-760

**Imports nécessaires :**
```typescript
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

### Étape B5: character-admin.command.ts (Entry Point)

**Fichier à créer :** `bot/src/features/admin/character-admin.command.ts`

**Contenu :**
```typescript
/**
 * Entry point pour toutes les fonctions d'admin character
 * Re-exporte les handlers depuis les modules spécialisés
 */

// Select & Actions
export { handleCharacterSelect, handleCharacterAction } from "./character-admin/character-select";

// Stats
export { handleStatsModalSubmit, handleAdvancedStatsModalSubmit } from "./character-admin/character-stats";

// Capabilities
export {
  handleCapabilitiesButton,
  handleAddCapabilities,
  handleRemoveCapabilities,
  handleViewCapabilities,
  handleCapabilitySelect
} from "./character-admin/character-capabilities";
```

**Vérification :**
```bash
cd bot && npm run build
```

---

## 🔄 Étape C: Migration des Imports

**Fichiers à mettre à jour :**

### 1. src/core/button-handler.ts

```typescript
// AVANT
import {
  handleStockAdminViewButton,
  handleStockAdminAddButton,
  handleStockAdminRemoveButton,
} from "../features/admin/stock-admin.handlers";

import {
  handleCharacterAction,
  handleCapabilitiesButton,
  handleAddCapabilities,
  handleRemoveCapabilities,
  handleViewCapabilities,
} from "../features/admin/character-admin.interactions";

// APRÈS
import {
  handleStockAdminViewButton,
  handleStockAdminAddButton,
  handleStockAdminRemoveButton,
} from "../features/admin/stock-admin.command";

import {
  handleCharacterAction,
  handleCapabilitiesButton,
  handleAddCapabilities,
  handleRemoveCapabilities,
  handleViewCapabilities,
} from "../features/admin/character-admin.command";
```

### 2. src/core/modal-handler.ts

```typescript
// AVANT
import {
  handleStockAdminAddModal,
  handleStockAdminRemoveModal,
} from "../features/admin/stock-admin.handlers";

import {
  handleStatsModalSubmit,
  handleAdvancedStatsModalSubmit,
} from "../features/admin/character-admin.interactions";

// APRÈS
import {
  handleStockAdminAddModal,
  handleStockAdminRemoveModal,
} from "../features/admin/stock-admin.command";

import {
  handleStatsModalSubmit,
  handleAdvancedStatsModalSubmit,
} from "../features/admin/character-admin.command";
```

### 3. src/core/select-menu-handler.ts

```typescript
// AVANT
import {
  handleStockAdminAddSelect,
  handleStockAdminRemoveSelect,
} from "../features/admin/stock-admin.handlers";

import {
  handleCharacterSelect,
  handleCapabilitySelect,
} from "../features/admin/character-admin.interactions";

// APRÈS
import {
  handleStockAdminAddSelect,
  handleStockAdminRemoveSelect,
} from "../features/admin/stock-admin.command";

import {
  handleCharacterSelect,
  handleCapabilitySelect,
} from "../features/admin/character-admin.command";
```

### 4. src/index.ts (si nécessaire)

Vérifier et mettre à jour les imports de `handleStockAdminCommand` si présent.

**Vérification après CHAQUE fichier :**
```bash
cd bot && npm run build
```

---

## 🗑️ Étape D: Nettoyage Final

**Après avoir vérifié que tout compile :**

1. **Supprimer les anciens fichiers :**
```bash
rm src/features/admin/stock-admin.handlers.ts
rm src/features/admin/character-admin.interactions.ts
```

2. **Vérification finale :**
```bash
cd bot && npm run build
cd bot && npm run lint
```

3. **Commit final :**
```bash
git add .
git commit -m "refactor(phase4): decompose admin files into modules

Stock Admin:
- Created stock-admin/stock-display.ts
- Created stock-admin/stock-add.ts
- Created stock-admin/stock-remove.ts
- Created stock-admin.command.ts

Character Admin:
- Created character-admin/character-select.ts
- Created character-admin/character-stats.ts
- Created character-admin/character-capabilities.ts
- Created character-admin.command.ts

Updated all imports in handlers
Deleted old monolithic files

Result: 811 + 760 lines → 6 modules < 350 lines each"
```

---

## 🚨 Règles Strictes

### ✅ OBLIGATOIRE
1. **Créer les répertoires D'ABORD** : `mkdir -p src/features/admin/stock-admin`
2. **Tester après CHAQUE module** : `cd bot && npm run build`
3. **⚠️ Toutes les commandes npm dans le dossier bot/** : `cd bot && npm run ...`
4. **Copier EXACTEMENT les lignes** indiquées (pas de modification logique)
5. **Respecter l'ordre** : Stock modules → Character modules → Entry points → Imports → Nettoyage
6. **Si erreur** : STOP et documente

### ❌ INTERDIT
1. Modifier la logique métier
2. Changer les noms de fonctions exportées
3. Créer plusieurs modules avant de tester
4. Continuer si le build casse
5. Supprimer les anciens fichiers avant que tout compile

---

## 📊 Métriques Attendues

**Avant Phase 4 :**
```bash
# Plus gros fichier
find src -name "*.ts" -exec wc -l {} + | sort -rn | head -1
# 811 stock-admin.handlers.ts
```

**Après Phase 4 :**
```bash
# Nouveaux modules
wc -l src/features/admin/stock-admin/*.ts
wc -l src/features/admin/character-admin/*.ts

# Plus gros fichier restant
find src -name "*.ts" -exec wc -l {} + | sort -rn | head -1
# Devrait être < 700 lignes
```

---

## ✅ Checklist de Finalisation

Après avoir terminé TOUTES les étapes :

- [ ] Répertoire stock-admin/ créé
- [ ] 3 modules stock créés et compilent
- [ ] stock-admin.command.ts créé
- [ ] Répertoire character-admin/ créé
- [ ] 3 modules character créés et compilent
- [ ] character-admin.command.ts créé
- [ ] button-handler.ts mis à jour
- [ ] modal-handler.ts mis à jour
- [ ] select-menu-handler.ts mis à jour
- [ ] index.ts vérifié
- [ ] stock-admin.handlers.ts supprimé
- [ ] character-admin.interactions.ts supprimé
- [ ] `cd bot && npm run build` ✅
- [ ] `cd bot && npm run lint` ✅
- [ ] Commit créé

---

## 📝 Rapport Final à Générer

```markdown
# Phase 4 - TERMINÉE ✅

## Modules Stock Admin (3)
1. ✅ stock-display.ts (~XXX lignes, 2 fonctions)
2. ✅ stock-add.ts (~XXX lignes, 3 fonctions)
3. ✅ stock-remove.ts (~XXX lignes, 3 fonctions)

## Modules Character Admin (3)
1. ✅ character-select.ts (~XXX lignes, 2 fonctions)
2. ✅ character-stats.ts (~XXX lignes, 2 fonctions)
3. ✅ character-capabilities.ts (~XXX lignes, 5 fonctions)

## Entry Points
✅ stock-admin.command.ts
✅ character-admin.command.ts

## Migrations
✅ button-handler.ts
✅ modal-handler.ts
✅ select-menu-handler.ts
✅ index.ts (si nécessaire)

## Nettoyage
✅ stock-admin.handlers.ts supprimé
✅ character-admin.interactions.ts supprimé

## Tests
- Build : ✅
- ESLint : ✅

## Métriques
- Avant : 2 fichiers (811 + 760 = 1,571 lignes)
- Après : 6 modules + 2 entry points (~XXX lignes)
- Plus gros fichier : XXX lignes

## Problèmes
[Aucun ou liste]

## ✅ Phase 4 Milestone Atteint
Admin files décomposés avec succès !
Prêt pour Phase 5 : Application globale des utils
```

---

## 🚀 Commande de Lancement

**Copie cette commande dans Supernova :**

```
Exécute la Phase 4 du refactoring.
Suis exactement le fichier docs/supernova-prompt-phase4.md.

⚠️ IMPORTANT : Exécute toutes les commandes npm DEPUIS le dossier bot/ :
cd bot && npm run build

Ordre d'exécution :
PARTIE A - Stock Admin:
1. Créer répertoire stock-admin/
2. Créer stock-display.ts
3. Créer stock-add.ts
4. Créer stock-remove.ts
5. Créer stock-admin.command.ts

PARTIE B - Character Admin:
6. Créer répertoire character-admin/
7. Créer character-select.ts
8. Créer character-stats.ts
9. Créer character-capabilities.ts
10. Créer character-admin.command.ts

PARTIE C - Migrations:
11. Mettre à jour button-handler.ts
12. Mettre à jour modal-handler.ts
13. Mettre à jour select-menu-handler.ts

PARTIE D - Nettoyage:
14. Supprimer anciens fichiers
15. Tests finaux
16. Commit

Teste après CHAQUE module.
Si erreur : STOP et documente.

Génère le rapport final quand terminé.
```

---

**Bon courage pour cette décomposition admin, Supernova ! 🏗️**

*Créé par Claude Code - Collaboration Phase 4*
*Date: 2025-10-08*
