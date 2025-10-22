# Phase 8: Implement Dependency Injection Container

**Context**: Backend refactoring Phase 8 - Centralize dependency injection
**Documentation**: `docs/backend-refactoring/04-IMPLEMENTATION-PLAN.md` (lines 879-962)

---

## Objective

Create a centralized DI container to manage all dependencies:
1. Create Container class with singleton pattern
2. Initialize all repositories (14 repositories)
3. Initialize all services (18 services)
4. Update controllers to use container (5 instantiations to replace)
5. Update cron jobs to use container (if any)

---

## Task 1: Create DI Container

**File**: `backend/src/infrastructure/container.ts`

### Strategy

1. **Analyze dependencies**: Map out all repositories and services with their dependencies
2. **Singleton pattern**: Single instance shared across the application
3. **Lazy initialization**: Create services on-demand
4. **Proper order**: Repositories first, then services (services depend on repositories)

### Container Structure

```typescript
import { PrismaClient } from "@prisma/client";

// Import all repositories
import { CharacterRepository } from "../domain/repositories/character.repository";
import { ResourceRepository } from "../domain/repositories/resource.repository";
import { ExpeditionRepository } from "../domain/repositories/expedition.repository";
// ... import all 14 repositories

// Import all services
import { CharacterService } from "../services/character/character.service";
import { CharacterCapabilityService } from "../services/character/character-capability.service";
import { ResourceService } from "../services/resource.service";
// ... import all 18 services

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;

  // Repositories (14)
  public characterRepo: CharacterRepository;
  public resourceRepo: ResourceRepository;
  public expeditionRepo: ExpeditionRepository;
  // ... all repositories

  // Services (18)
  public characterService: CharacterService;
  public characterCapabilityService: CharacterCapabilityService;
  public resourceService: ResourceService;
  // ... all services

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient();

    // Initialize all repositories
    this.characterRepo = new CharacterRepository(this.prisma);
    this.resourceRepo = new ResourceRepository(this.prisma);
    // ... initialize all 14 repositories

    // Initialize all services (with proper dependencies)
    this.resourceService = new ResourceService(this.resourceRepo);
    this.characterService = new CharacterService(this.characterRepo, /* other deps */);
    // ... initialize all 18 services
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const container = Container.getInstance();
```

### Discovery Steps

1. **List all repositories**:
   ```bash
   ls backend/src/domain/repositories/*.ts
   ```

2. **List all services**:
   ```bash
   ls backend/src/services/*.ts backend/src/services/*/*.ts
   ```

3. **Analyze service dependencies**: Read each service constructor to understand dependencies
   - Some services need repositories
   - Some services need other services
   - Map out dependency graph

4. **Determine initialization order**: Services that depend on others must be initialized after their dependencies

---

## Task 2: Update Controllers

**Current pattern** (5 occurrences to find and replace):
```typescript
const someService = new SomeService(prisma);
```

**New pattern**:
```typescript
import { container } from "../../infrastructure/container";

// Use container.someService directly
```

### Discovery

```bash
cd backend
grep -rn "new.*Service" src/controllers/ --include="*.ts"
```

### Strategy

1. Find all service instantiations in controllers
2. Replace with container imports
3. Remove manual service instantiation
4. Update all usages to use `container.serviceName`

---

## Task 3: Update Cron Jobs

**Check for cron jobs**:
```bash
ls backend/src/cron/
```

If cron jobs exist:
- Replace service instantiations with container
- Ensure proper initialization/cleanup

---

## Task 4: Handle Singleton Exports

**Some services may have singleton exports** like:
```typescript
// At end of service file
export const someService = new SomeService();
```

**Strategy**:
1. Find all singleton exports in services
2. Remove them (container will manage instances)
3. Update any imports of these singletons to use container

**Discovery**:
```bash
grep -rn "export const.*Service.*= new" src/services/
```

---

## Task 5: Update Service Constructors (if needed)

Some services may need optional parameters for DI:

**Before**:
```typescript
class SomeService {
  private repo: SomeRepository;

  constructor() {
    this.repo = new SomeRepository(prisma);
  }
}
```

**After**:
```typescript
class SomeService {
  private repo: SomeRepository;

  constructor(repo?: SomeRepository) {
    this.repo = repo || new SomeRepository(prisma);
  }
}
```

This allows both container usage and backward compatibility.

---

## Dependency Analysis Requirements

Before creating the container, create a dependency map:

1. **List all 14 repositories** with their names
2. **List all 18 services** with their names
3. **Map service dependencies**:
   ```
   ServiceName → [dependency1, dependency2, ...]
   ```
4. **Identify circular dependencies** (if any)
5. **Determine initialization order**

Example:
```
CharacterService → [CharacterRepository]
ExpeditionService → [ExpeditionRepository, CharacterService]
CapabilityService → [CapabilityRepository, CharacterRepository, ResourceService]
```

---

## Verification Steps

1. **TypeScript compilation**: `npm run typecheck`
2. **Build**: `npm run build`
3. **Manual test**: Start the server and verify dependency injection works
4. **Check for**:
   - No duplicate service instances
   - No manual `new Service()` calls in controllers
   - All services properly initialized
   - No circular dependency issues

---

## Success Criteria

- ✅ Container class created in `infrastructure/container.ts`
- ✅ All 14 repositories registered in container
- ✅ All 18 services registered in container
- ✅ Services properly initialized with dependencies
- ✅ All controller instantiations replaced (5 occurrences)
- ✅ All cron job instantiations replaced (if any)
- ✅ Singleton exports removed from services
- ✅ TypeScript compilation passes
- ✅ Build succeeds
- ✅ No circular dependencies

---

## Output Requirements

Create a comprehensive report: `.supernova/report-phase8-di-container.md`

**Report structure** (first section ≤300 tokens):

1. **Executive Summary** (≤300 tokens)
   - Container created: Yes/No
   - Repositories registered: X/14
   - Services registered: X/18
   - Controller instantiations replaced: X/5
   - Compilation status
   - Time spent

2. **Technical Details**
   - Dependency graph diagram (text format)
   - Initialization order
   - Services with complex dependencies
   - Issues encountered and resolutions

3. **Files Modified/Created**
   - Container file created
   - Controllers updated (list)
   - Services modified (if any)
   - Singleton exports removed (list)

4. **Verification Results**
   - TypeScript errors before/after
   - Build status
   - Circular dependency check results

---

**Execute this plan autonomously. Report back when complete.**
