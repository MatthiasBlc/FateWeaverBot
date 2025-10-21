# Supernova Prompt - Phase 5: Refactor Services

**Date**: 2025-10-21
**Estimated Duration**: 10-12 hours
**Priority**: High

---

## 🎯 Objective

Refactor all service files to use the Repository layer (created in Phase 4) instead of making direct Prisma calls. This improves separation of concerns, testability, and maintainability.

---

## 📋 Context

### What We Have (From Previous Phases)

1. **Phase 1**: Query builders for common Prisma queries
2. **Phase 4**: 14 repository files with 106 async methods created:
   - `character.repository.ts` (27 methods)
   - `resource.repository.ts` (9 methods)
   - `expedition.repository.ts` (12 methods)
   - `project.repository.ts` (6 methods)
   - `chantier.repository.ts` (8 methods)
   - `capability.repository.ts` (6 methods)
   - `guild.repository.ts` (6 methods)
   - `role.repository.ts` (6 methods)
   - `object.repository.ts` (6 methods)
   - `town.repository.ts` (6 methods)
   - `user.repository.ts` (4 methods)
   - `season.repository.ts` (4 methods)
   - `job.repository.ts` (3 methods)
   - `skill.repository.ts` (3 methods)

3. **Current State**: Services directly use `prisma.model.method()` calls

### Files to Refactor (13 Services)

| File | LOC | Priority |
|------|-----|----------|
| `capability.service.ts` | 1,293 | High |
| `expedition.service.ts` | 1,227 | High |
| `character.service.ts` | 1,150 | High |
| `project.service.ts` | 419 | Medium |
| `object.service.ts` | 385 | Medium |
| `chantier.service.ts` | 299 | Medium |
| `daily-event-log.service.ts` | 233 | Low |
| `daily-message.service.ts` | 213 | Low |
| `season.service.ts` | 180 | Low |
| `resource.service.ts` | 168 | High |
| `discord-notification.service.ts` | 118 | Low |
| `job.service.ts` | 117 | Low |
| `action-point.service.ts` | 61 | Low |

**Total LOC**: ~5,863 lines across 13 files

---

## 🔧 Technical Requirements

### Pattern to Apply

**Before** (Direct Prisma):
```typescript
export class CharacterService {
  async getActiveCharacter(userId: string, townId: string) {
    return await prisma.character.findFirst({
      where: { userId, townId, isActive: true },
      ...CharacterQueries.fullInclude()
    });
  }
}
```

**After** (Using Repository):
```typescript
export class CharacterService {
  constructor(
    private characterRepo: CharacterRepository,
    private resourceRepo: ResourceRepository,
    // ... other repositories as needed
  ) {}

  async getActiveCharacter(userId: string, townId: string) {
    return await this.characterRepo.findActiveCharacter(userId, townId);
  }
}
```

### Key Changes Required

1. **Add Repository Imports**
   - Import required repositories at the top
   - Example: `import { CharacterRepository } from '../domain/repositories/character.repository';`

2. **Add Constructor with Dependency Injection**
   - Add constructor accepting repository instances
   - Store repositories as private class properties

3. **Replace Prisma Calls**
   - Replace all `prisma.model.method()` with `this.modelRepo.method()`
   - Use existing repository methods when available
   - If a repository method doesn't exist, ADD IT to the repository first

4. **Update Service Factory/Instantiation** (If Exists)
   - Update places where services are instantiated to pass repositories
   - For now, we'll instantiate repositories inline (DI container comes in Phase 8)

---

## 📝 Detailed Tasks

### 5.1 Refactor High-Priority Services (Character, Resource, Expedition, Capability)

**For Each Service File:**

1. Read the service file completely
2. Identify all Prisma calls (`prisma.*`)
3. Check if corresponding repository methods exist:
   - If YES → Replace with repository call
   - If NO → Add method to repository first, then replace
4. Add constructor with repository dependencies
5. Update imports
6. Verify TypeScript compiles

**Files:**
- ✅ `character.service.ts` (1,150 LOC)
- ✅ `resource.service.ts` (168 LOC)
- ✅ `expedition.service.ts` (1,227 LOC)
- ✅ `capability.service.ts` (1,293 LOC)

### 5.2 Refactor Medium-Priority Services

**Files:**
- ✅ `project.service.ts` (419 LOC)
- ✅ `chantier.service.ts` (299 LOC)
- ✅ `object.service.ts` (385 LOC)

### 5.3 Refactor Low-Priority Services

**Files:**
- ✅ `season.service.ts` (180 LOC)
- ✅ `job.service.ts` (117 LOC)
- ✅ `daily-event-log.service.ts` (233 LOC)
- ✅ `daily-message.service.ts` (213 LOC)
- ✅ `discord-notification.service.ts` (118 LOC)
- ✅ `action-point.service.ts` (61 LOC)

### 5.4 Update Service Instantiation

**Places where services are created:**
- Controllers
- Cron jobs
- Other services that depend on these services

**Pattern:**
```typescript
// Before
const characterService = new CharacterService();

// After
const characterRepo = new CharacterRepository(prisma);
const resourceRepo = new ResourceRepository(prisma);
const characterService = new CharacterService(characterRepo, resourceRepo);
```

### 5.5 Verification

1. **TypeCheck**: `npm run typecheck` must pass
2. **Build**: `npm run build` must succeed
3. **Manual Testing**: Test critical endpoints:
   - GET `/api/characters/:userId/active`
   - GET `/api/expeditions/:id`
   - POST `/api/resources/stock`
   - GET `/api/capabilities`

---

## 🚨 Critical Rules

1. **DO NOT Change API Contracts**: No changes to controller signatures or response formats
2. **DO NOT Remove Prisma Import Yet**: Keep `import { prisma } from '../lib/prisma'` for now (will be removed in Phase 8)
3. **ADD Missing Repository Methods**: If a service needs a method that doesn't exist in the repository, ADD IT to the repository first
4. **Keep Business Logic in Services**: Only move data access logic to repositories
5. **Maintain Error Handling**: Keep existing try/catch and error throwing patterns
6. **Preserve Transactions**: If a service method uses `prisma.$transaction`, keep using it but with repository methods inside

---

## 📊 Success Criteria

- ✅ All 13 service files refactored
- ✅ Zero direct `prisma.*` calls in service files (except for transactions)
- ✅ All services have constructors with repository dependencies
- ✅ `npm run typecheck` passes
- ✅ `npm run build` succeeds
- ✅ Critical API endpoints tested and working
- ✅ No breaking changes to existing functionality

---

## 🎁 Deliverables

1. **Refactored Service Files**: 13 services updated
2. **Updated Repository Files**: Any new methods added as needed
3. **Supernova Report**: `.supernova/report-phase5-refactor-services.md`
4. **Updated Progress Tracker**: `docs/backend-refactoring/05-PROGRESS-TRACKER.md`
5. **Git Commits**: Structured commits (e.g., one per service or group of related services)

---

## 📂 File Locations

**Services**: `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/`
**Repositories**: `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/domain/repositories/`
**Controllers**: `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/controllers/`

---

## 🔄 Recommended Execution Strategy

### Option A: Sequential (Safer)
Refactor one service at a time, verify after each:
1. Refactor Character → Test → Commit
2. Refactor Resource → Test → Commit
3. Continue...

### Option B: Parallel (Faster)
Use multiple agents in parallel for independent services:
- Agent 1: Character + Resource
- Agent 2: Expedition + Capability
- Agent 3: Project + Chantier + Object
- Agent 4: All low-priority services

**Recommendation**: Use Option B with agents, but verify together at the end.

---

## 💡 Tips

1. **Search for Prisma Calls**: Use `grep -n "prisma\." <file>` to find all Prisma calls
2. **Check Repository Methods**: Before replacing, verify the repository method exists
3. **Transaction Handling**: For `prisma.$transaction`, you can still use it:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // Use repository methods that accept tx parameter
     await this.characterRepo.update(id, data, tx);
   });
   ```
4. **Test Incrementally**: After refactoring 3-4 services, run typecheck
5. **Document Blockers**: If you find a blocker, document it and move to next file

---

## 📝 Report Format

At the end, create `.supernova/report-phase5-refactor-services.md` with:

### Executive Summary (≤300 tokens)
- Services refactored count
- Repository methods added count
- Issues encountered
- Time spent

### Detailed Breakdown
- List of all services refactored
- List of new repository methods added
- Changes to service instantiation
- Test results

### Metrics
- LOC modified
- Prisma calls replaced
- New repository methods added

---

**END OF PROMPT**

---

## 🚀 Mini Prompt (≤50 tokens)

```
Lis `.supernova/prompt-phase5-refactor-services.md` et exécute. Refactor 13 services pour utiliser repositories au lieu de Prisma direct. Crée rapport : `.supernova/report-phase5-refactor-services.md` avec résumé ≤300 tokens en première section.
```
