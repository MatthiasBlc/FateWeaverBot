# OPTIMIZATION AUDIT - DETAILED ACTION ITEMS

## PHASE 1: QUICK WINS (Est. 1-2 days)

### 1.1 Fix Hardcoded Emojis (54 files)

**Action:** Replace ALL hardcoded emoji strings with imports from `@shared/constants/emojis`

**Files to update:**

#### CRITICAL (50+ hardcoded emojis):
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/constants/messages.ts` - 50+ instances of ❌

#### HIGH PRIORITY:
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/deploy-commands-force.ts` - ⚠️, ✅
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/index.ts` - multiple emoji strings
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/button-handler.ts` - emoji in strings
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/modal-handler.ts` - emoji usage
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/select-menu-handler.ts` - emoji in strings
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/projects.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/projects-admin/project-add.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/give-object.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/users.handlers.ts`

#### REMAINING (38 files):
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin/character-objects.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/projects-admin/project-delete.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/projects-admin/project-display.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/projects-admin/project-edit.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-display.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-emergency.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/auspice.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/cartography.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/researching.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/cooking.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/healing.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/fishing.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/channels.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/hunger/eat-more.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/expedition-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/project-creation.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/embeds.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/chantiers/chantiers.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-create-resources.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-create.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-leave.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/stock/stock.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-resource-management.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-transfer.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-join.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/help/help.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin/character-skills.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin/character-stats.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/element-capability-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/element-object-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/element-resource-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/element-skill-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/emoji-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/expedition-admin-resource-handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/new-element-admin.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/stock-admin/stock-add.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/stock-admin/stock-display.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/stock-admin/stock-remove.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/deploy-commands.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin/character-capabilities.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin/character-select.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/config/config.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/hunger/hunger.handlers.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/character-validation.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/discord-components.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/chantiers/chantier-creation.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/roles.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/admin.ts`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/commands/_template.ts`

**Expected Result:** 0 hardcoded emoji strings, all imported from constants

---

### 1.2 Create Missing Barrel Export Files (8 new files)

**Action:** Create `index.ts` files for these directories to consolidate exports

- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/services/index.ts`
  - Export: apiService, all service classes
  
- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/index.ts`
  - Export: character-admin, expedition-admin, etc.
  
- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/stock-admin/index.ts`
  - Export: handleStockAdd, handleStockRemove, handleStockDisplay
  
- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/projects-admin/index.ts`
  - Export: handleProjectAdd, handleProjectEdit, handleProjectDelete
  
- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin/index.ts`
  - Export: character skill/object/capability handlers
  
- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/index.ts`
  - Export: all expedition handler functions
  
- [ ] Create `/home/bouloc/Repo/FateWeaverBot/bot/src/commands/index.ts`
  - Export: all command classes/handlers

**Expected Result:** Clean import statements throughout codebase

---

### 1.3 Fix Type Safety in API Base (Priority)

**File:** `/home/bouloc/Repo/FateWeaverBot/bot/src/services/api/base-api.service.ts`

**Changes needed:**

- [ ] Line 1: Remove `/* eslint-disable @typescript-eslint/no-explicit-any */`
- [ ] Line 19: Change `params?: Record<string, any>` to proper interface
- [ ] Line 32: Change `catch (error: any)` to `catch (error: unknown)`
- [ ] Line 51: Change `data?: any` to properly typed parameter
- [ ] Line 70: Change `data?: any` to properly typed parameter
- [ ] Line 90: Change `data?: any` to properly typed parameter

**Code example:**
```typescript
// Before:
protected async get<T>(url: string, params?: Record<string, any>): Promise<T>

// After:
interface ApiQueryParams {
  [key: string]: string | number | boolean | undefined
}
protected async get<T>(url: string, params?: ApiQueryParams): Promise<T>
```

---

### 1.4 Replace console.log with logger (19 files)

**Command:** Search and replace `console.log`, `console.error`, `console.warn` with `logger.*`

**Files to update:**
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/services/capability.service.ts:5`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/config/index.ts:2`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/users.handlers.ts:7`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-display.ts:2`
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/project-creation.ts:3`
- [ ] + 14 more

**Expected Result:** Consistent logging via centralized logger service

---

## PHASE 2: ARCHITECTURE (Est. 2-3 days)

### 2.1 Create Error Handler Utility

**File to create:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/error-handlers.ts`

**Purpose:** Consolidate 623 try-catch blocks with standard error patterns

**Functions needed:**
```typescript
export async function handleApiError(
  error: unknown,
  interaction: Interaction,
  context: string
): Promise<void>

export function logApiError(
  url: string,
  error: unknown,
  context: string
): void

export async function handleInteractionError(
  error: unknown,
  interaction: Interaction
): Promise<void>
```

**Usage:**
```typescript
// Before (repeated 623 times):
try {
  const data = await apiService.get(url)
} catch (error) {
  logger.error("Error", { error })
  await interaction.reply("An error occurred")
}

// After (cleaner):
try {
  const data = await apiService.get(url)
} catch (error) {
  await handleApiError(error, interaction, "profile fetch")
}
```

---

### 2.2 Create Service Root Index

**File to create:** `/home/bouloc/Repo/FateWeaverBot/bot/src/services/index.ts`

**Purpose:** Barrel export all services for consistency

**Content:**
```typescript
// Core services
export { apiService } from './api'
export { logger } from './logger'
export { httpClient } from './httpClient'

// Business services
export { CharacterService } from './characters.service'
export { UserService } from './users.service'
export { CapabilityService } from './capability.service'
// ... etc for all 29 services
```

---

### 2.3 Add Return Type Annotations

**Files to update (focus on exported functions):**
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/users.handlers.ts` (all exports)
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin.handlers.ts` (all exports)
- [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/expeditions/handlers/*.ts` (all exports)
- [ ] 54+ more files

**Example fix:**
```typescript
// Before:
export async function handleProfileCommand(interaction: any) {

// After:
export async function handleProfileCommand(interaction: ButtonInteraction): Promise<void> {
```

---

## PHASE 3: MAJOR REFACTORING (Est. 3-5 days)

### 3.1 Split Button Handler (1,849 lines)

**File to split:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/button-handler.ts`

**Create new files:**
- [ ] `/src/features/expeditions/handlers/button-handlers.ts` (expedition buttons)
- [ ] `/src/features/projects/handlers/button-handlers.ts` (project buttons)
- [ ] `/src/features/admin/handlers/button-handlers.ts` (admin buttons)
- [ ] `/src/features/users/handlers/button-handlers.ts` (user action buttons)
- [ ] `/src/features/stock/handlers/button-handlers.ts` (stock buttons)
- [ ] `/src/core/handlers/button-handlers.ts` (core system buttons)

**Update:** `/src/utils/button-handler.ts` to import and delegate dynamically:
```typescript
// Changed from: 1,849 line monolith
// To: ~200 line router that imports feature handlers

import { registerExpeditionButtons } from '../features/expeditions'
import { registerProjectButtons } from '../features/projects'
// ... etc

private registerDefaultHandlers() {
  registerExpeditionButtons(this)
  registerProjectButtons(this)
  // ... etc
}
```

---

### 3.2 Split Select Menu Handler (1,187 lines)

**File to split:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/select-menu-handler.ts`

**Similar approach:** Create feature-specific handlers, keep router slim

---

### 3.3 Split Modal Handler (953 lines)

**File to split:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/modal-handler.ts`

**Create new files:**
- [ ] `/src/features/expeditions/handlers/modal-handlers.ts`
- [ ] `/src/features/projects/handlers/modal-handlers.ts`
- [ ] `/src/features/admin/handlers/modal-handlers.ts`
- [ ] `/src/features/stock/handlers/modal-handlers.ts`

---

## PHASE 4: HANDLER CONSOLIDATION (Est. 2-3 days)

### 4.1 Split Mega-Handlers

**Critical files to split:**

1. [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/users.handlers.ts` (1,326 lines)
   - Create: fishing.handlers.ts, cooking.handlers.ts, healing.handlers.ts, etc.

2. [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/projects-admin/project-add.ts` (1,695 lines)
   - Create: project-edit.ts, project-delete.ts, project-display.ts separately

3. [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/new-element-admin.handlers.ts` (1,682 lines)
   - Create: element-skill.handlers.ts, element-resource.handlers.ts, etc. (already partially done)

4. [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/element-object-admin.handlers.ts` (1,522 lines)
   - Extract button/select/modal handlers to separate files

5. [ ] `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/projects.handlers.ts` (1,512 lines)
   - Create: project-create.handlers.ts, project-display.handlers.ts, etc.

---

### 4.2 Verify Build & Testing

After each phase:
- [ ] Run `npm run build` - ensure no compilation errors
- [ ] Run tests if available
- [ ] Verify command deployment still works
- [ ] Check for new console warnings

---

## VALIDATION CHECKLIST

After completing all phases:

- [ ] No hardcoded emojis (run: `grep -r "[🎉✅❌⚠️]" src --include="*.ts" | wc -l` should be 0)
- [ ] Build succeeds: `npm run build` passes with 0 errors
- [ ] No console.log usage: `grep -r "console\." src --include="*.ts" | wc -l` should be 0
- [ ] All `any` types addressed (57 files reviewed and fixed)
- [ ] All barrel exports created and working
- [ ] Handler files split and delegates working correctly
- [ ] Tests pass (if applicable)

---

## ESTIMATED TIMELINE

| Phase | Effort | Timeline |
|-------|--------|----------|
| Phase 1 | 8-10 hours | 1-2 days |
| Phase 2 | 6-8 hours | 1-2 days |
| Phase 3 | 12-16 hours | 3-4 days |
| Phase 4 | 8-12 hours | 2-3 days |
| Testing/Validation | 4-6 hours | 1 day |
| **TOTAL** | **38-52 hours** | **1-2 weeks** |

---

## SUCCESS METRICS

After completion:
- Token usage reduction: 15-20%
- Build time reduction: ~5-10%
- Code maintainability: High (smaller, focused files)
- Type safety: Improved (fewer `any` types)
- Code reusability: Better (shared error handlers, constants)

