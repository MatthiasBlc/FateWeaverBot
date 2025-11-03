# Guide: Modal & Select Handler Refactoring

**Purpose**: Step-by-step guide for completing Phase 3.2 and 3.3
**Prerequisites**: Button handler refactoring completed (Phase 3.1)
**Estimated Time**: 4-6 hours
**Token Savings**: ~220 additional tokens

---

## 📋 Pre-Flight Checklist

Before starting, ensure you have:
- [ ] Reviewed `PHASE_3_RESULTS.md`
- [ ] Reviewed `audit-modal-exports.py` output
- [ ] Understanding of router pattern from button-handler refactoring
- [ ] Clean git working directory
- [ ] Build passing (`npm run build`)

---

## 🔧 Step 1: Fix Missing Exports (2 hours)

### 1.1 Fix Expedition Transfer Modal

**File**: `src/features/expeditions/handlers/expedition-transfer.ts`

**Current status**: Function exists at line 221 but modal-handler imports from wrong path

**Action**: No change needed in expedition-transfer.ts (function already exported)

**Note**: Will fix import path in modal feature module

### 1.2 Fix Project Admin Modal Handlers

**File**: `src/features/admin/projects-admin.command.ts` (47 lines)

**Issue**: 8 modal handlers not exported

**Functions needed**:
```typescript
export async function handleProjectAdminAddStep1Modal(interaction: ModalSubmitInteraction)
export async function handleProjectAdminEditModal(interaction: ModalSubmitInteraction)
export async function handleProjectAddQuantityModal(interaction: ModalSubmitInteraction)
export async function handleProjectAddResourceQuantityModal(interaction: ModalSubmitInteraction)
export async function handleProjectAddBlueprintPAModal(interaction: ModalSubmitInteraction)
export async function handleProjectAddBlueprintResourceQuantityModal(interaction: ModalSubmitInteraction)
export async function handleProjectAddNameModal(interaction: ModalSubmitInteraction)
```

**Options**:

**Option A**: Extract from modal-handler.ts inline implementations
1. Copy implementation from modal-handler.ts lines where these are defined
2. Create functions in appropriate files
3. Export them

**Option B**: Keep inline in modal feature module (RECOMMENDED)
1. Don't create separate functions
2. Keep implementation inline in `features/projects/modals.ts`
3. Similar to button-handler pattern

**Recommendation**: **Option B** - Simpler, less refactoring, same end result

---

## 🏗️ Step 2: Create Modal Feature Modules (2-3 hours)

### 2.1 Create Users Modal Module

**File**: `src/features/users/modals.ts`

```typescript
/**
 * Modal handlers for Users (Character creation, reroll)
 */
import type { ModalSubmitInteraction } from "discord.js";
import type { ModalHandler } from "../../utils/modal-handler";
import { logger } from "../../services/logger";
import { STATUS } from "@shared/constants/emojis";

export function registerUserModals(handler: ModalHandler): void {
  // Character creation modal
  handler.registerHandler("character_creation_modal", async (interaction) => {
    try {
      const { handleCharacterCreation } = await import(
        "../../modals/character-modals.js"
      );
      await handleCharacterCreation(interaction);
    } catch (error) {
      logger.error("Error handling character creation modal:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création du personnage.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Reroll modal
  handler.registerHandler("reroll_modal", async (interaction) => {
    try {
      const { handleReroll } = await import("../../modals/character-modals.js");
      await handleReroll(interaction);
    } catch (error) {
      logger.error("Error handling reroll modal:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du reroll du personnage.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
```

### 2.2 Create Expeditions Modal Module

**File**: `src/features/expeditions/modals.ts`

**Key Points**:
- Import from `./handlers/expedition-transfer.js` (NOT `./expedition.command.js`)
- All other expedition handlers are correctly exported

**Functions to register** (9 total):
- `expedition_creation_modal`
- `expedition_create_resource_quantity:`
- `expedition_resource_add_quantity:`
- `expedition_resource_remove_quantity:`
- `expedition_modify_modal`
- `expedition_transfer_amount_modal_`
- `expedition_duration_modal_`
- `expedition_resource_add_modal_`
- `expedition_resource_modify_modal_`

### 2.3 Create Projects Modal Module

**File**: `src/features/projects/modals.ts`

**Approach**: Keep 8 problem handlers inline (Option B from Step 1)

```typescript
export function registerProjectModals(handler: ModalHandler): void {
  // ... handlers with correct exports ...

  // Inline handlers for missing exports
  handler.registerHandler("project_add_quantity_modal:", async (interaction) => {
    try {
      // Get implementation from current modal-handler.ts line ~425
      // Copy the existing logic here
    } catch (error) {
      logger.error("Error handling project add quantity modal:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de la quantité.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Repeat for 7 other missing handlers
}
```

### 2.4 Create Admin Modal Modules

**Files to create**:
- `src/features/admin/character-admin/modals.ts`
- `src/features/admin/stock-admin/modals.ts`
- `src/features/admin/object-admin/modals.ts`

**Note**: All exports exist for admin handlers - straightforward

### 2.5 Create Chantiers Modal Module

**File**: `src/features/chantiers/modals.ts`

Simple - only 2 handlers, both have correct exports

---

## 🔄 Step 3: Transform modal-handler.ts to Router (1 hour)

### 3.1 Create New Router File

**File**: `src/utils/modal-handler.ts`

```typescript
import { ModalSubmitInteraction } from "discord.js";
import { logger } from "../services/logger.js";

// Import feature modal registrations
import { registerUserModals } from "../features/users/modals.js";
import { registerExpeditionModals } from "../features/expeditions/modals.js";
import { registerChantierModals } from "../features/chantiers/modals.js";
import { registerProjectModals } from "../features/projects/modals.js";
import { registerCharacterAdminModals } from "../features/admin/character-admin/modals.js";
import { registerStockAdminModals } from "../features/admin/stock-admin/modals.js";
import { registerObjectAdminModals } from "../features/admin/object-admin/modals.js";

export class ModalHandler {
  private static instance: ModalHandler;
  private handlers: Map<string, (interaction: ModalSubmitInteraction) => Promise<void>> = new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  public static getInstance(): ModalHandler {
    if (!ModalHandler.instance) {
      ModalHandler.instance = new ModalHandler();
    }
    return ModalHandler.instance;
  }

  public registerHandler(
    modalId: string,
    handler: (interaction: ModalSubmitInteraction) => Promise<void>
  ) {
    this.handlers.set(modalId, handler);
    logger.debug(`Registered modal handler for: ${modalId}`);
  }

  public registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: ModalSubmitInteraction) => Promise<void>
  ) {
    this.handlers.set(`prefix:${prefix}`, handler);
    logger.debug(`Registered modal handler for prefix: ${prefix}`);
  }

  private registerDefaultHandlers() {
    logger.info("🎭 Initializing modal handlers from feature modules...");

    registerUserModals(this);
    registerExpeditionModals(this);
    registerChantierModals(this);
    registerProjectModals(this);
    registerCharacterAdminModals(this);
    registerStockAdminModals(this);
    registerObjectAdminModals(this);

    logger.info(
      `✅ Modal handlers initialized: ${this.handlers.size} handlers`
    );
  }

  public async handleModal(interaction: ModalSubmitInteraction): Promise<boolean> {
    const { customId } = interaction;
    logger.debug(`🎭 Modal interaction: ${customId} from ${interaction.user.username}`);

    try {
      // Try exact match
      const exactHandler = this.handlers.get(customId);
      if (exactHandler) {
        await exactHandler(interaction);
        return true;
      }

      // Try prefix match
      for (const [key, handler] of this.handlers) {
        if (key.startsWith("prefix:") && customId.startsWith(key.substring(7))) {
          await handler(interaction);
          return true;
        }
      }

      logger.warn(`⚠️ No handler found for modal: ${customId}`);
      return false;
    } catch (error) {
      logger.error(`Error handling modal ${customId}:`, { error });
      throw error;
    }
  }
}

export const modalHandler = ModalHandler.getInstance();
```

### 3.2 Test Build

```bash
npm run build
```

**Expected**: Should compile without errors

### 3.3 Commit Changes

```bash
git add .
git commit -m "Refactor: Split modal-handler into feature modules (Phase 3.2)

- Refactored 955-line modal-handler.ts into router pattern
- Created 7 feature modal modules
- Reduced modal-handler.ts from 955 → ~150 lines (84% reduction)
- Token savings: ~100 tokens
- Build verified: ✅ PASSING

🤖 Generated with Claude Code"
```

---

## 🔁 Step 4: Repeat for Select Menus (2-3 hours)

### 4.1 Run Audit for Selects

Create `audit-select-exports.py` (similar to modal audit)

### 4.2 Create Select Feature Modules

**Files to create**:
- `src/features/expeditions/selects.ts`
- `src/features/projects/selects.ts`
- `src/features/chantiers/selects.ts`
- `src/features/admin/character-admin/selects.ts`
- `src/features/admin/stock-admin/selects.ts`

### 4.3 Transform select-menu-handler.ts to Router

Similar pattern to modal-handler.ts

### 4.4 Test & Commit

```bash
npm run build
git commit -m "Refactor: Split select-menu-handler into feature modules (Phase 3.3)"
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] `npm run build` passes without errors
- [ ] All 3 handlers transformed to router pattern:
  - [ ] button-handler.ts (~150 lines)
  - [ ] modal-handler.ts (~150 lines)
  - [ ] select-menu-handler.ts (~150 lines)
- [ ] Feature modules created (total ~25 files):
  - [ ] 9 button modules
  - [ ] 7 modal modules
  - [ ] 5 select modules
- [ ] Git commits clean with good messages
- [ ] Documentation updated

---

## 📊 Expected Results

### Metrics
- **Code reduction**: 4,014 → ~450 lines router + ~2,000 lines modules = ~1,600 lines savings
- **Token savings**: ~520 tokens (15% improvement)
- **Maintainability**: Significantly improved
- **Build time**: No change expected

### File Structure
```
src/
├── utils/
│   ├── button-handler.ts (143 lines) ✅
│   ├── modal-handler.ts (~150 lines)
│   └── select-menu-handler.ts (~150 lines)
└── features/
    ├── expeditions/
    │   ├── buttons.ts ✅
    │   ├── modals.ts
    │   └── selects.ts
    ├── projects/
    │   ├── buttons.ts ✅
    │   ├── modals.ts
    │   └── selects.ts
    └── ... (other features)
```

---

## 🚨 Common Pitfalls

1. **Wrong import paths**: Always verify exports exist before creating imports
2. **Missing error handling**: Copy error handling patterns from button modules
3. **Forgetting prefix handlers**: Use `registerHandlerByPrefix` for patterns ending with `_` or `:`
4. **Breaking existing functionality**: Test after each module creation
5. **Incomplete refactoring**: Ensure modal-handler.ts only has router code, no inline handlers

---

## 💡 Tips

1. **Start with users/chantiers**: Simplest modules with fewest handlers
2. **Use audit scripts**: Verify exports before writing code
3. **Copy-paste patterns**: Button modules are good templates
4. **Commit frequently**: After each feature module
5. **Test incrementally**: Don't wait until end to run build

---

## 📚 References

- `PHASE_3_RESULTS.md` - Current state and findings
- `audit-modal-exports.py` - Export verification tool
- `src/utils/button-handler.ts` - Reference implementation
- `src/features/*/buttons.ts` - Pattern examples

---

**Good luck! This guide should make the refactoring straightforward and systematic.**
