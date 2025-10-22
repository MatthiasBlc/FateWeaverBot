# Phase 7: Error Handling - Part 2 (Complete Remaining Work)

**Context**: Phase 7 continuation - 101/351 errors replaced (29% complete)
**Previous work**: Error classes created ✅, 3 major services completed ✅
**Remaining**: 53 service errors + 172 controller errors = 225 errors

---

## Current Status

**Completed** ✅:
- Error classes (6 files in `shared/errors/`)
- Error handler middleware updated
- Repositories (5/5 errors)
- Services (3/12 files):
  - capability.service.ts (45 errors) ✅
  - expedition.service.ts (40 errors) ✅
  - project.service.ts (16 errors) ✅

**Remaining**:
- Services (9 files, 53 errors)
- Controllers (all files, 172 errors)
- Other files (20 errors)

---

## Task 1: Complete Remaining Services (53 errors)

### Priority Order (largest first):

1. **character-capability.service.ts** (16 errors)
   - Lines: 63, 69, 84, 114, 119, 130, 147, 151, 218, 223, 360, 550, 555, 576, 579, 591

2. **chantier.service.ts** (13 errors)

3. **object.service.ts** (7 errors)

4. **resource.service.ts** (5 errors)

5. **job.service.ts** (4 errors)

6. **action-point.service.ts** (4 errors)

7. **daily-message.service.ts** (2 errors)

8. **character.service.ts** (1 error)

9. **season.service.ts** (1 error)

### Error Replacement Strategy

Import at top of each file:
```typescript
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';
```

**Mapping rules**:
- "non trouvée" / "not found" → `NotFoundError(resource, id)`
- "possède déjà" / "already has" → `BadRequestError(message)`
- "non implémentée" / "not implemented" → `BadRequestError(message)`
- "doit utiliser" / "must use" → `BadRequestError(message)`
- "erreur lors de" / "error during" → `BadRequestError(message)`
- Validation rules → `ValidationError(message)`

### Approach
For each file:
1. Read the entire file
2. Identify all `throw new Error()` instances
3. Replace each with appropriate custom error
4. Add imports if not present
5. Verify no old errors remain in file

---

## Task 2: Replace All Controller Errors (172 errors)

### Controller Files (check each for error count):

**Character controllers**:
- `character/character.controller.ts`
- `character/character-stats.controller.ts`
- `character/character-capabilities.controller.ts`
- `character/fishing.controller.ts`

**Other controllers**:
- `expeditions.ts`
- `resources.ts`
- `projects.ts`
- `chantiers.ts`
- `capabilities.ts`
- `jobs.ts`
- `seasons.ts`
- `objects.ts`
- `guilds.ts`
- `towns.ts`
- `users.ts`
- `roles.ts`
- `skills.ts`
- `action-points.ts` (if exists)

### Controller Error Strategy

Controllers may also use `createHttpError()` - replace both patterns.

Import at top:
```typescript
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';
```

**Common controller patterns**:
- Missing required params → `BadRequestError("Missing required parameter: X")`
- Resource not found → `NotFoundError(resource, id)`
- Invalid operation → `BadRequestError(message)`
- Auth issues → `UnauthorizedError(message)`

**Approach**:
1. Count errors per controller file first
2. Process largest files first
3. For each file:
   - Find all `throw new Error()` and `createHttpError()`
   - Replace with custom errors
   - Add imports
   - Verify replacements

---

## Task 3: Replace Errors in Other Files (20 errors)

**Check these locations**:
```bash
grep -r "throw new Error" src/api/middleware/ --include="*.ts"
grep -r "throw new Error" src/shared/utils/ --include="*.ts"
grep -r "throw new Error" src/cron/ --include="*.ts"
```

Apply same error mapping rules.

---

## Verification Steps

### 1. Count Verification
```bash
cd backend

# Should be 0 (except in shared/errors/)
grep -r "throw new Error" src/services/ --include="*.ts" | wc -l

# Should be 0
grep -r "throw new Error" src/controllers/ --include="*.ts" | wc -l

# Should be 0
grep -r "createHttpError" src/ --include="*.ts" | wc -l
```

### 2. TypeScript Compilation
```bash
npm run typecheck
```

### 3. Build Verification
```bash
npm run build
```

### 4. Import Check
All custom error imports should follow pattern:
```typescript
import { NotFoundError, BadRequestError, ... } from '../../shared/errors';
```

---

## Success Criteria

- ✅ 53/53 remaining service errors replaced (100%)
- ✅ 172/172 controller errors replaced (100%)
- ✅ 20/20 other errors replaced (100%)
- ✅ Total: 351/351 errors replaced (100%)
- ✅ 0 `throw new Error()` instances remain (outside shared/errors/)
- ✅ 0 `createHttpError()` instances remain
- ✅ TypeScript compilation passes
- ✅ Build succeeds
- ✅ All imports correct

---

## Output Requirements

Update the existing report: `.supernova/report-phase7-error-handling.md`

**Add a "Part 2 Completion" section** with:

1. **Part 2 Summary** (≤200 tokens)
   - Services completed: X/9 files, 53 errors
   - Controllers completed: X/Y files, 172 errors
   - Other files: X files, 20 errors
   - Total: 351/351 (100% complete)
   - Compilation status
   - Time spent on Part 2

2. **Detailed Breakdown**
   - Service files completed (per file error counts)
   - Controller files completed (per file error counts)
   - Other files modified
   - Error type distribution

3. **Final Verification**
   - Grep verification: 0 old errors remain
   - TypeScript: 0 new errors
   - Build: Success
   - Import verification: All correct

---

**Execute this plan autonomously. Complete all remaining error replacements. Report back when 100% complete.**
