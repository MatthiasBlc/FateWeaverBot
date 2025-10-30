# OPTIMIZATION AUDIT - QUICK REFERENCE

## KEY STATISTICS

| Metric | Count | Status |
|--------|-------|--------|
| Total TypeScript Files | 158 | |
| Files with hardcoded emojis | 54 | CRITICAL |
| Files using `any` types | 57 | HIGH |
| Mega-files (>300 lines) | 11 | HIGH |
| Try-catch blocks | 623 | Should consolidate |
| API call patterns | 22 files | Duplicated |
| Missing barrel exports | 8 directories | MEDIUM |
| Type assertions bypassing safety | 68 | HIGH |
| Console.log instead of logger | 19 files | LOW |
| Technical debt markers (TODO/FIXME) | 1 | Good |

---

## CRITICAL FILES TO SPLIT

### 1. BUTTON HANDLER (1,849 lines)
**Path:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/button-handler.ts`  
**Impact:** ~200 tokens per session  
**Solution:** Distribute to feature directories:
- `expeditions/handlers/button.ts`
- `projects/handlers/button.ts`
- `admin/handlers/button.ts`

### 2. SELECT MENU HANDLER (1,187 lines)
**Path:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/select-menu-handler.ts`  
**Impact:** ~120 tokens per session  
**Solution:** Similar distribution by feature

### 3. MODAL HANDLER (953 lines)
**Path:** `/home/bouloc/Repo/FateWeaverBot/bot/src/utils/modal-handler.ts`  
**Impact:** ~100 tokens per session  

---

## TOP 5 FILES BY LINE COUNT

| File | Lines | Splitting Needed |
|------|-------|------------------|
| button-handler.ts | 1,849 | YES - Critical |
| project-add.ts | 1,695 | YES - Form logic |
| new-element-admin.handlers.ts | 1,682 | YES - UI logic |
| element-object-admin.handlers.ts | 1,522 | YES - Admin UI |
| projects.handlers.ts | 1,512 | YES - Multiple handlers |

---

## HARDCODED EMOJI EXAMPLES

### Current (54 files):
```typescript
const msg = "❌ Error occurred"
const success = "✅ Complete"
logger.warn("⚠️  Deployment forced")
```

### Should be (using centralized constants):
```typescript
import { STATUS, SYSTEM } from "@shared/constants/emojis"
const msg = `${STATUS.ERROR} Error occurred`
const success = `${STATUS.SUCCESS} Complete`
logger.warn(`${SYSTEM.WARNING} Deployment forced`)
```

**Files affected:**
- `/home/bouloc/Repo/FateWeaverBot/bot/src/constants/messages.ts` (50+ hardcoded emojis)
- `/home/bouloc/Repo/FateWeaverBot/bot/src/deploy-commands-force.ts`
- 52 more feature/handler files

---

## MISSING BARREL EXPORTS

### Should Create:

1. **`/src/services/index.ts`** (currently missing)
   - Exports: apiService, capability, characters, chantiers, etc.

2. **`/src/features/admin/index.ts`** (currently missing)
   - Exports: character-admin, expedition-admin, etc.

3. **`/src/features/admin/stock-admin/index.ts`** (currently missing)
   - Contains: stock-add.ts, stock-remove.ts, stock-display.ts

4. **`/src/features/admin/projects-admin/index.ts`** (currently missing)
   - Contains: project-add.ts, project-edit.ts, project-delete.ts

5. **`/src/features/admin/character-admin/index.ts`** (currently missing)
   - Contains: character-objects.ts, character-skills.ts, etc.

6. **`/src/features/expeditions/handlers/index.ts`** (currently missing)
   - Contains: expedition-create.ts, expedition-display.ts, etc.

7. **`/src/commands/index.ts`** (currently missing)

---

## TYPE SAFETY ISSUES

### `any` Types - Top Offenders:

1. **`/src/services/api/base-api.service.ts`**
   - Line 1: `/* eslint-disable @typescript-eslint/no-explicit-any */` (should fix instead)
   - Line 19: `params?: Record<string, any>`
   - Line 32: `catch (error: any)`

2. **`/src/features/users/users.handlers.ts`**
   - Line 40: `export async function handleProfileCommand(interaction: any)`
   - Should be: `handleProfileCommand(interaction: ButtonInteraction): Promise<void>`

3. **57 more files** using `any` types

### Type Assertion Bypasses (68 total):
- Excessive `as any` / `as unknown` usage
- Should create proper interfaces instead

---

## ERROR HANDLING CONSOLIDATION OPPORTUNITY

### Current Pattern (repeated 623 times):
```typescript
try {
  const data = await apiService.get(url)
  // process data
} catch (error) {
  logger.error("Generic error", { error })
  await interaction.reply({ content: "An error occurred" })
}
```

### Should Create: `/src/utils/error-handlers.ts`
```typescript
export async function handleApiError(error: unknown, interaction: Interaction, context: string) {
  logger.error(`API error in ${context}`, { error })
  await interaction.reply({ 
    content: `${STATUS.ERROR} Une erreur est survenue.` 
  })
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (1-2 days)
- Fix hardcoded emojis (54 files)
- Add barrel exports (8 files)
- Fix `any` in base-api.service.ts
- Replace console.log (19 files)

### Phase 2: Architecture (2-3 days)
- Create error-handler utility
- Create service index.ts
- Add return type annotations

### Phase 3: Major Refactoring (3-5 days)
- Split button-handler.ts
- Split select-menu-handler.ts
- Split modal-handler.ts
- Update all imports

### Phase 4: Handler Consolidation (2-3 days)
- Reorganize mega-handlers
- Distribute to feature directories
- Final testing and validation

---

## TOKEN SAVINGS BREAKDOWN

| Initiative | Tokens Saved | Effort |
|-----------|-------------|--------|
| Remove emoji duplication | 200-250 | Medium |
| Split handlers | 300-400 | High |
| Barrel exports | 50-75 | Low |
| Type safety | 100-150 | Medium |
| Error consolidation | 50-100 | Low |
| **TOTAL** | **700-975** | **Medium** |

**Estimated % reduction: 15-20% context usage**

---

## NEXT STEPS

1. Read full report: `.supernova/report-audit.md`
2. Start with Phase 1 (quick wins)
3. Run `npm run build` after each phase
4. Re-run audit in 2 weeks to track improvements

