# Phase 6: Split Large Files

**Context**: Backend refactoring Phase 6 - Split files >500 LOC into smaller modules
**Documentation**: `docs/backend-refactoring/04-IMPLEMENTATION-PLAN.md` (lines 760-808)

---

## Objective

Split 2 large files into smaller, focused modules:
1. `character.service.ts` (839 LOC) → 4 service files
2. `characters.ts` controller (1,099 LOC) → 4 controller files

---

## Task 1: Split character.service.ts

**Current file**: `backend/src/services/character.service.ts` (839 LOC)

**Target structure**:
```
backend/src/services/character/
├── character.service.ts          (Core CRUD - ~300 LOC)
├── character-stats.service.ts    (HP, PM, PA, hunger - ~250 LOC)
├── character-inventory.service.ts (Inventory - ~200 LOC)
└── character-capability.service.ts (Capabilities - ~200 LOC)
```

**Method categorization** (analyze the file to categorize all methods):

**Core CRUD** (character.service.ts):
- `getActiveCharacter()`
- `getRerollableCharacters()`
- `createCharacter()`
- `createRerollCharacter()`
- `killCharacter()`
- `grantRerollPermission()`
- `switchActiveCharacter()`
- `getTownCharacters()`
- `needsCharacterCreation()`
- `changeCharacterJob()`

**Stats Management** (character-stats.service.ts):
- HP, PM, PA related methods
- Hunger management methods
- All methods containing: `hp`, `pm`, `pa`, `hunger`, `health`, `mana`, `action`

**Inventory Management** (character-inventory.service.ts):
- All inventory-related methods
- Methods containing: `inventory`, `item`, `object`, `equipment`

**Capabilities Management** (character-capability.service.ts):
- `getCharacterCapabilities()`
- `addCharacterCapability()`
- `removeCharacterCapability()`
- `getAvailableCapabilities()`
- `useCharacterCapability()`
- All private capability methods:
  - `useHuntingCapability()`
  - `useGatheringCapability()`
  - `useLoggingCapability()`
  - `useFishingCapability()`
  - `useEntertainmentCapability()`
  - `useCookingCapability()`
  - `useCartographyCapability()`
  - `useResearchingCapability()`
  - `useAuspiceCapability()`

**Strategy**:
1. Read the full file and categorize ALL methods
2. Create 4 new service files in `backend/src/services/character/`
3. Each service should:
   - Import shared dependencies (CharacterRepository, PrismaClient, etc.)
   - Have a constructor with dependency injection
   - Export a singleton instance for backward compatibility
4. Handle cross-service dependencies (e.g., capability service may need stats service)
5. Keep the same class-based pattern with dependency injection
6. Preserve all business logic exactly as-is
7. Delete the old `character.service.ts` file

---

## Task 2: Split characters.ts Controller

**Current file**: `backend/src/controllers/characters.ts` (1,099 LOC)

**Target structure**:
```
backend/src/controllers/character/
├── character.controller.ts           (CRUD - ~200 LOC)
├── character-stats.controller.ts     (Stats - ~200 LOC)
├── character-capabilities.controller.ts (Capabilities - ~200 LOC)
└── fishing.controller.ts             (Fishing - ~150 LOC)
```

**Endpoint categorization** (analyze the file to categorize all endpoints):

**Core CRUD** (character.controller.ts):
- GET `/` (list characters)
- GET `/:id` (get character)
- POST `/` (create character)
- PATCH `/:id` (update character)
- DELETE `/:id` (delete character)
- POST `/switch` (switch active character)
- etc.

**Stats Management** (character-stats.controller.ts):
- All HP/PM/PA/hunger endpoints
- Endpoints containing: `/hp`, `/pm`, `/pa`, `/hunger`, `/health`, `/mana`, `/action`

**Capabilities Management** (character-capabilities.controller.ts):
- GET `/:id/capabilities`
- POST `/:id/capabilities`
- DELETE `/:id/capabilities/:capabilityId`
- POST `/:id/capabilities/:capabilityId/use`
- All capability-related endpoints

**Fishing** (fishing.controller.ts):
- All fishing-related endpoints
- Endpoints containing: `/fish`, `/fishing`

**Strategy**:
1. Read the full file and categorize ALL endpoints
2. Create 4 new controller files in `backend/src/controllers/character/`
3. Each controller should:
   - Import the corresponding service(s)
   - Follow the same RequestHandler pattern
   - Use validation middleware
   - Handle errors consistently
4. Preserve all business logic, validation, and error handling
5. Delete the old `characters.ts` file

---

## Task 3: Update Route Imports

**File**: `backend/src/routes/characters.ts`

**Strategy**:
1. Update all imports to point to new controller files:
   ```typescript
   import * as characterController from "../controllers/character/character.controller";
   import * as statsController from "../controllers/character/character-stats.controller";
   import * as capabilitiesController from "../controllers/character/character-capabilities.controller";
   import * as fishingController from "../controllers/character/fishing.controller";
   ```
2. Update all route handlers to use the correct controller
3. Ensure all routes still work

**Also check**: Search for any other imports of the old files across the codebase:
```bash
grep -r "from.*character.service" backend/src/
grep -r "from.*characters.ts" backend/src/
```

---

## Verification Steps

1. **TypeCheck**: `cd /home/bouloc/Repo/FateWeaverBot/backend && npm run typecheck`
2. **Build**: `npm run build`
3. **Git Status**: Verify all old files deleted, all new files created
4. **Manual Check**: Review each new file for completeness

---

## Success Criteria

- ✅ `character.service.ts` split into 4 services
- ✅ `characters.ts` controller split into 4 controllers
- ✅ All routes updated to use new controllers
- ✅ All imports updated across codebase
- ✅ Old files deleted
- ✅ TypeScript compilation passes (0 new errors)
- ✅ Build succeeds

---

## Output Requirements

Create a comprehensive report: `.supernova/report-phase6-split-large-files.md`

**Report structure** (first section ≤300 tokens):
1. **Executive Summary** (≤300 tokens)
   - Files split: 2
   - New files created: 8
   - Total LOC refactored
   - Compilation status
   - Time spent

2. **Technical Details**
   - character.service.ts split breakdown (method counts per new file)
   - characters.ts controller split breakdown (endpoint counts per new file)
   - Dependency management approach
   - Issues encountered and resolutions

3. **Files Modified/Created**
   - List all new files with LOC
   - List all deleted files
   - List all files with updated imports

4. **Verification Results**
   - TypeScript errors before/after
   - Build status
   - Any warnings or notes

---

**Execute this plan autonomously. Report back when complete.**
