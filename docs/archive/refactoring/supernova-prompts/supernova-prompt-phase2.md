# 🚀 Prompt pour Code Supernova - Phase 2 Refactoring

**Mission : Décomposer expedition.handlers.ts (1,725 lignes) en 5 modules**
**Équipe : Claude Code (planning/validation) + Supernova (exécution) + Utilisateur (oversight)**

---

## 🎯 Objectif de la Mission

Décomposer le fichier monolithique `expedition.handlers.ts` en 5 modules spécialisés pour :
- ✅ Améliorer la maintenabilité (+50%)
- ✅ Réduire la taille des fichiers (< 500 lignes par module)
- ✅ Faciliter la lecture et les tests
- ✅ Économiser ~1,200 lignes de contexte par lecture

**Résultat attendu :**
```
expedition.handlers.ts (1,725 lignes)
    ↓
handlers/
  ├── expedition-display.ts      (~250 lignes)
  ├── expedition-create.ts       (~400 lignes)
  ├── expedition-join.ts         (~450 lignes)
  ├── expedition-leave.ts        (~150 lignes)
  └── expedition-transfer.ts     (~450 lignes)

expedition.command.ts              (~25 lignes)
```

---

## 📋 Infrastructure Déjà en Place

✅ **Fichiers créés (Phase 1) :**
- `utils/embeds.ts` - Fonctions d'embeds
- `utils/discord-components.ts` - Fonctions de composants
- `expedition-utils.ts` - Utilitaires expéditions

✅ **Imports disponibles :**
```typescript
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../utils/embeds";
import { createActionButtons, createConfirmationButtons } from "../../utils/discord-components";
import { getStatusEmoji, isExpeditionEditable, canJoinExpedition } from "./expedition-utils";
```

---

## 🔄 Workflow Requis

**⚠️ IMPORTANT : Toutes les commandes npm doivent être exécutées dans le dossier `bot/` !**

**Pour CHAQUE module que tu crées :**
1. ✅ Lire le fichier source (expedition.handlers.ts)
2. ✅ Extraire les fonctions correspondantes
3. ✅ Créer le nouveau fichier module
4. ✅ Ajouter les imports nécessaires
5. ✅ **TESTER : `cd bot && npm run build`**
6. ✅ Si OK → passer au suivant
7. ❌ Si erreur → STOP et documenter

**Après TOUS les modules créés :**
1. ✅ Créer expedition.command.ts (entry point)
2. ✅ Mettre à jour les imports dans index.ts, button-handler.ts, etc.
3. ✅ Supprimer l'ancien expedition.handlers.ts
4. ✅ **TESTER : `cd bot && npm run build`**
5. ✅ Commit final

---

## 📦 Module 1: expedition-display.ts (~250 lignes)

**Fichier à créer :** `bot/src/features/expeditions/handlers/expedition-display.ts`

### Fonctions à extraire
```typescript
export async function handleExpeditionMainCommand(interaction: ChatInputCommandInteraction)
export async function handleExpeditionInfoCommand(interaction: ChatInputCommandInteraction)
```

### Imports nécessaires
```typescript
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createInfoEmbed, createSuccessEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { getStatusEmoji } from "../expedition-utils";
```

### Lignes à copier
- **handleExpeditionMainCommand** : lignes ~47-248
- **handleExpeditionInfoCommand** : lignes ~878-1049

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Module 2: expedition-create.ts (~400 lignes)

**Fichier à créer :** `bot/src/features/expeditions/handlers/expedition-create.ts`

### Fonctions à extraire
```typescript
export async function handleExpeditionCreateNewButton(interaction: any)
export async function handleExpeditionStartCommand(interaction: ChatInputCommandInteraction)
export async function handleExpeditionCreationModal(interaction: ModalSubmitInteraction)
```

### Imports nécessaires
```typescript
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
  type ModalSubmitInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand, getActiveCharacterFromModal } from "../../../utils/character";
import { createExpeditionCreationModal } from "../../../modals/expedition-modals";
import { getTownByGuildId } from "../../../services/towns.service";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
```

### Lignes à copier
- **handleExpeditionCreateNewButton** : lignes ~250-292
- **handleExpeditionStartCommand** : lignes ~333-412
- **handleExpeditionCreationModal** : lignes ~414-692

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Module 3: expedition-join.ts (~450 lignes)

**Fichier à créer :** `bot/src/features/expeditions/handlers/expedition-join.ts`

### Fonctions à extraire
```typescript
export async function handleExpeditionJoinExistingButton(interaction: any)
export async function handleExpeditionJoinCommand(interaction: ChatInputCommandInteraction)
export async function handleExpeditionJoinSelect(interaction: any)
```

### Imports nécessaires
```typescript
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type GuildMember,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { getTownByGuildId } from "../../../services/towns.service";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { getStatusEmoji, canJoinExpedition } from "../expedition-utils";
```

### Lignes à copier
- **handleExpeditionJoinExistingButton** : lignes ~294-331
- **handleExpeditionJoinCommand** : lignes ~694-812
- **handleExpeditionJoinSelect** : lignes ~814-876

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Module 4: expedition-leave.ts (~150 lignes)

**Fichier à créer :** `bot/src/features/expeditions/handlers/expedition-leave.ts`

### Fonctions à extraire
```typescript
export async function handleExpeditionLeaveButton(interaction: any)
```

### Imports nécessaires
```typescript
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { getStatusEmoji } from "../expedition-utils";
```

### Lignes à copier
- **handleExpeditionLeaveButton** : lignes ~1051-1183

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Module 5: expedition-transfer.ts (~450 lignes)

**Fichier à créer :** `bot/src/features/expeditions/handlers/expedition-transfer.ts`

### Fonctions à extraire
```typescript
export async function handleExpeditionTransferButton(interaction: any)
export async function handleExpeditionTransferDirectionSelect(interaction: any)
export async function handleExpeditionTransferModal(interaction: ModalSubmitInteraction)
```

### Imports nécessaires
```typescript
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type GuildMember,
  type ModalSubmitInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand, getActiveCharacterFromModal } from "../../../utils/character";
import { createExpeditionTransferModal, createExpeditionTransferAmountModal } from "../../../modals/expedition-modals";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { getStatusEmoji } from "../expedition-utils";
```

### Lignes à copier
- **handleExpeditionTransferButton** : lignes ~1185-1311
- **handleExpeditionTransferDirectionSelect** : lignes ~1313-1454
- **handleExpeditionTransferModal** : lignes ~1456-1725

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Module 6: expedition.command.ts (Entry Point)

**Fichier à créer :** `bot/src/features/expeditions/expedition.command.ts`

### Contenu
```typescript
/**
 * Entry point pour toutes les fonctions d'expéditions
 * Re-exporte les handlers depuis les modules spécialisés
 */

// Display
export { handleExpeditionMainCommand, handleExpeditionInfoCommand } from "./handlers/expedition-display";

// Create
export { handleExpeditionCreateNewButton, handleExpeditionStartCommand, handleExpeditionCreationModal } from "./handlers/expedition-create";

// Join
export { handleExpeditionJoinExistingButton, handleExpeditionJoinCommand, handleExpeditionJoinSelect } from "./handlers/expedition-join";

// Leave
export { handleExpeditionLeaveButton } from "./handlers/expedition-leave";

// Transfer
export { handleExpeditionTransferButton, handleExpeditionTransferDirectionSelect, handleExpeditionTransferModal } from "./handlers/expedition-transfer";
```

### Vérification
```bash
cd bot && npm run build
```

---

## 🔄 Étape 7: Migration des Imports

**Fichiers à mettre à jour :**

### 1. bot/src/index.ts
```typescript
// AVANT
import { handleExpeditionMainCommand, handleExpeditionInfoCommand } from "./features/expeditions/expedition.handlers";

// APRÈS
import { handleExpeditionMainCommand, handleExpeditionInfoCommand } from "./features/expeditions/expedition.command";
```

### 2. bot/src/core/button-handler.ts
```typescript
// AVANT
import {
  handleExpeditionCreateNewButton,
  handleExpeditionJoinExistingButton,
  handleExpeditionLeaveButton,
  handleExpeditionTransferButton,
} from "../features/expeditions/expedition.handlers";

// APRÈS
import {
  handleExpeditionCreateNewButton,
  handleExpeditionJoinExistingButton,
  handleExpeditionLeaveButton,
  handleExpeditionTransferButton,
} from "../features/expeditions/expedition.command";
```

### 3. bot/src/core/modal-handler.ts
```typescript
// AVANT
import {
  handleExpeditionCreationModal,
  handleExpeditionTransferModal,
} from "../features/expeditions/expedition.handlers";

// APRÈS
import {
  handleExpeditionCreationModal,
  handleExpeditionTransferModal,
} from "../features/expeditions/expedition.command";
```

### 4. bot/src/core/select-menu-handler.ts
```typescript
// AVANT
import {
  handleExpeditionJoinSelect,
  handleExpeditionTransferDirectionSelect,
} from "../features/expeditions/expedition.handlers";

// APRÈS
import {
  handleExpeditionJoinSelect,
  handleExpeditionTransferDirectionSelect,
} from "../features/expeditions/expedition.command";
```

### Vérification après CHAQUE fichier
```bash
cd bot && npm run build
```

---

## 🗑️ Étape 8: Nettoyage Final

**Après avoir vérifié que tout compile :**

1. **Supprimer l'ancien fichier :**
```bash
rm src/features/expeditions/expedition.handlers.ts
```

2. **Vérification finale :**
```bash
cd bot && npm run build
cd bot && npm run lint
```

3. **Commit final :**
```bash
git add .
git commit -m "refactor(phase2): decompose expedition.handlers.ts into 5 modules

- Created handlers/expedition-display.ts
- Created handlers/expedition-create.ts
- Created handlers/expedition-join.ts
- Created handlers/expedition-leave.ts
- Created handlers/expedition-transfer.ts
- Created expedition.command.ts as entry point
- Updated all imports
- Deleted old expedition.handlers.ts

Result: 1,725 lines → 5 modules < 500 lines each"
```

---

## 🚨 Règles Strictes

### ✅ OBLIGATOIRE
1. **Créer le répertoire handlers/ d'abord** : `mkdir -p bot/src/features/expeditions/handlers`
2. **Test après CHAQUE module créé** : `cd bot && npm run build`
3. **Tous les npm run build/lint doivent être exécutés DANS le dossier bot/** : `cd bot && npm run ...`
4. **Si erreur** : STOP et documente
5. **Copier EXACTEMENT** les lignes indiquées (pas de modification logique)
6. **Respecter l'ordre** : Modules 1-5 → Entry point → Migration imports → Nettoyage

### ❌ INTERDIT
1. Modifier la logique métier
2. Changer les noms de fonctions exportées
3. Créer plusieurs modules avant de tester
4. Continuer si le build casse
5. Supprimer l'ancien fichier avant que tout compile

---

## 📊 Métriques Attendues

**Avant Phase 2 :**
```bash
# Plus gros fichier
find src -name "*.ts" -exec wc -l {} + | sort -rn | head -1
# expedition.handlers.ts : 1,725 lignes
```

**Après Phase 2 :**
```bash
# Nouveaux fichiers
wc -l src/features/expeditions/handlers/*.ts
# Tous < 500 lignes chacun

# Plus gros fichier restant
find src -name "*.ts" -exec wc -l {} + | sort -rn | head -1
# Devrait être < 850 lignes
```

---

## ✅ Checklist de Finalisation

Après avoir terminé TOUTES les étapes :

- [ ] Répertoire handlers/ créé
- [ ] 5 modules créés et compilent
- [ ] expedition.command.ts créé
- [ ] index.ts mis à jour
- [ ] button-handler.ts mis à jour
- [ ] modal-handler.ts mis à jour
- [ ] select-menu-handler.ts mis à jour
- [ ] expedition.handlers.ts supprimé
- [ ] `cd bot && npm run build` ✅
- [ ] `cd bot && npm run lint` ✅
- [ ] Commit créé

---

## 📝 Rapport Final à Générer

```markdown
# Phase 2 - TERMINÉE ✅

## Modules créés (5)
1. ✅ expedition-display.ts (~XXX lignes)
2. ✅ expedition-create.ts (~XXX lignes)
3. ✅ expedition-join.ts (~XXX lignes)
4. ✅ expedition-leave.ts (~XXX lignes)
5. ✅ expedition-transfer.ts (~XXX lignes)

## Entry point
✅ expedition.command.ts créé

## Migrations
✅ index.ts
✅ button-handler.ts
✅ modal-handler.ts
✅ select-menu-handler.ts

## Nettoyage
✅ expedition.handlers.ts supprimé

## Tests
- Build : ✅
- ESLint : ✅

## Métriques
- Avant : 1 fichier de 1,725 lignes
- Après : 5 modules de ~XXX lignes chacun
- Plus gros fichier : XXX lignes

## Problèmes
[Aucun ou liste]

## ✅ Phase 2 Milestone Atteint
expedition.handlers.ts décomposé avec succès !
Prêt pour Phase 3 : Logique Métier
```

---

## 🚀 Commande de Lancement

**Copie cette commande dans Supernova :**

```
Exécute la Phase 2 du refactoring.
Suis exactement le fichier docs/supernova-prompt-phase2.md.

Ordre d'exécution :
1. Créer répertoire handlers/
2. Module 1: expedition-display.ts
3. Module 2: expedition-create.ts
4. Module 3: expedition-join.ts
5. Module 4: expedition-leave.ts
6. Module 5: expedition-transfer.ts
7. Entry point: expedition.command.ts
8. Migrer imports (index, button-handler, modal-handler, select-menu-handler)
9. Supprimer expedition.handlers.ts
10. Commit final

⚠️ IMPORTANT : Exécute toutes les commandes npm DEPUIS le dossier bot/ :
cd bot && npm run build

Teste après CHAQUE module.
Si erreur : STOP et documente.

Génère le rapport final quand tout est terminé.
```

---

**Bon courage pour cette décomposition, Supernova ! 🏗️**

*Créé par Claude Code - Collaboration Phase 2*
*Date: 2025-10-08*
