# Phase 7: Implement Consistent Error Handling

**Context**: Backend refactoring Phase 7 - Replace 351 error instances with custom error classes
**Documentation**: `docs/backend-refactoring/04-IMPLEMENTATION-PLAN.md` (lines 812-875)

---

## Objective

Implement consistent error handling across the entire backend codebase:
1. Create custom error classes (4 error types)
2. Update error handler middleware
3. Replace **351 error instances** across services, controllers, and repositories

---

## Error Counts by Layer

- **Total**: 351 error instances
- **Services**: 154 instances
- **Controllers**: 172 instances
- **Repositories**: 5 instances
- **Other**: 20 instances

---

## Task 1: Create Custom Error Classes

**Directory**: `backend/src/shared/errors/`

### 1.1 Base Error Class

**File**: `backend/src/shared/errors/app-error.ts`

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 1.2 NotFoundError

**File**: `backend/src/shared/errors/not-found-error.ts`

```typescript
import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;
    super(message, 404);
  }
}
```

### 1.3 ValidationError

**File**: `backend/src/shared/errors/validation-error.ts`

```typescript
import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message, 400);
  }
}
```

### 1.4 UnauthorizedError

**File**: `backend/src/shared/errors/unauthorized-error.ts`

```typescript
import { AppError } from './app-error';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}
```

### 1.5 BadRequestError

**File**: `backend/src/shared/errors/bad-request-error.ts`

```typescript
import { AppError } from './app-error';

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
```

### 1.6 Index Export

**File**: `backend/src/shared/errors/index.ts`

```typescript
export { AppError } from './app-error';
export { NotFoundError } from './not-found-error';
export { ValidationError } from './validation-error';
export { UnauthorizedError } from './unauthorized-error';
export { BadRequestError } from './bad-request-error';
```

---

## Task 2: Update Error Handler Middleware

**File**: `backend/src/api/middleware/error-handler.middleware.ts`

**Current implementation**: Check the file and understand current error handling

**Target implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../shared/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle custom AppError instances
  if (error instanceof AppError) {
    const response: any = {
      error: error.message
    };

    // Add validation errors if present
    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors;
    }

    return res.status(error.statusCode).json(response);
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: 'Internal server error'
  });
}
```

**Strategy**:
1. Read current error-handler.middleware.ts
2. Update to handle AppError instances
3. Preserve any existing logging or error reporting
4. Ensure ValidationError errors object is included in response

---

## Task 3: Replace Error Throwing in Repositories (5 instances)

**Directory**: `backend/src/domain/repositories/`

**Strategy**:
1. Search for all `throw new Error()` in repositories
2. Replace with appropriate custom error:
   - "not found" → `NotFoundError`
   - "invalid" / "cannot" → `BadRequestError`
   - Other → `AppError` or appropriate type

**Example transformation**:
```typescript
// Before
if (!character) {
  throw new Error('Character not found');
}

// After
import { NotFoundError } from '../../shared/errors';

if (!character) {
  throw new NotFoundError('Character', characterId);
}
```

---

## Task 4: Replace Error Throwing in Services (154 instances)

**Directory**: `backend/src/services/`

**Files to update** (analyze each):
- `services/character/*.ts` (multiple files)
- `services/capability.service.ts`
- `services/expedition.service.ts`
- `services/resource.service.ts`
- `services/project.service.ts`
- `services/chantier.service.ts`
- `services/job.service.ts`
- `services/season.service.ts`
- `services/object.service.ts`
- `services/action-point.service.ts`
- `services/daily-event-log.service.ts`
- `services/daily-message.service.ts`
- `services/discord-notification.service.ts`

**Error mapping rules**:
1. "not found" / "does not exist" → `NotFoundError(resource, id)`
2. "invalid" / "must be" / "required" → `BadRequestError(message)`
3. "not authorized" / "permission" → `UnauthorizedError(message)`
4. "validation" / "format" → `ValidationError(message)`
5. Generic errors → `BadRequestError(message)` or appropriate type

**Approach**:
- Process files systematically, largest first
- Use grep to find all error instances per file
- Replace each with appropriate custom error
- Add imports at top of file
- Verify no `throw new Error()` remains

---

## Task 5: Replace Error Throwing in Controllers (172 instances)

**Directory**: `backend/src/controllers/`

**Files to update** (analyze each):
- `controllers/character/*.ts` (4 files)
- `controllers/expeditions.ts`
- `controllers/resources.ts`
- `controllers/projects.ts`
- `controllers/chantiers.ts`
- `controllers/capabilities.ts`
- `controllers/jobs.ts`
- `controllers/seasons.ts`
- `controllers/objects.ts`
- `controllers/guilds.ts`
- `controllers/towns.ts`
- `controllers/users.ts`
- `controllers/roles.ts`
- `controllers/skills.ts`

**Error mapping rules** (same as services):
1. "not found" → `NotFoundError(resource, id)`
2. "invalid" / "required" → `BadRequestError(message)`
3. "not authorized" → `UnauthorizedError(message)`
4. "validation" → `ValidationError(message)`

**Special consideration**:
- Controllers may use `createHttpError()` - replace these too
- Check if `http-errors` package is used and consider removing dependency after migration

---

## Task 6: Replace Errors in Other Files (20 instances)

**Check these directories**:
- `src/api/middleware/` (middleware errors)
- `src/shared/utils/` (utility errors)
- `src/cron/` (scheduled job errors)

Apply same error mapping rules.

---

## Verification Steps

1. **Search verification**: Ensure no old error patterns remain
   ```bash
   cd backend
   grep -r "throw new Error" src/ --include="*.ts" | grep -v "shared/errors"
   grep -r "createHttpError" src/ --include="*.ts"
   ```

2. **TypeScript compilation**: `npm run typecheck`

3. **Build**: `npm run build`

4. **Import check**: Verify all custom error imports are correct

5. **Count verification**:
   - Before: 351 instances
   - After: 0 instances (outside shared/errors/)

---

## Success Criteria

- ✅ 6 error class files created in `shared/errors/`
- ✅ Error handler middleware updated
- ✅ 0/351 old error instances remain (100% replaced)
  - Repositories: 5/5 replaced
  - Services: 154/154 replaced
  - Controllers: 172/172 replaced
  - Other: 20/20 replaced
- ✅ TypeScript compilation passes (0 new errors)
- ✅ Build succeeds
- ✅ All imports correct
- ✅ Consistent error responses across API

---

## Output Requirements

Create a comprehensive report: `.supernova/report-phase7-error-handling.md`

**Report structure** (first section ≤300 tokens):
1. **Executive Summary** (≤300 tokens)
   - Error classes created: 6
   - Total errors replaced: X/351
   - Breakdown by layer (repositories, services, controllers, other)
   - Compilation status
   - Time spent

2. **Technical Details**
   - Error class implementations
   - Middleware updates
   - Error mapping decisions
   - Files modified count
   - Issues encountered and resolutions

3. **Replacement Breakdown**
   - Repositories: X/5 errors replaced
   - Services: X/154 errors replaced (per file counts)
   - Controllers: X/172 errors replaced (per file counts)
   - Other: X/20 errors replaced

4. **Verification Results**
   - TypeScript errors before/after
   - Build status
   - Remaining old error instances (should be 0)
   - Import verification

---

**Execute this plan autonomously. Report back when complete.**
