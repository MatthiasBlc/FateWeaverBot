# Implementation Plan - Phased Refactoring Roadmap

**Date**: 2025-10-19

---

## Overview

This document provides a detailed, phased approach to refactoring the backend. Each phase is designed to be independent and safe, allowing work to be paused and resumed at any time.

---

## Guiding Principles

1. **Incremental Changes**: Small, testable changes
2. **No Breaking Changes**: Keep existing API contracts
3. **Continuous Verification**: Build and type-check after each change
4. **Documentation First**: Update docs before implementing
5. **Test Coverage**: Add tests for refactored code

---

## Phase Overview

| Phase | Focus | Effort | Risk | Status |
|-------|-------|--------|------|--------|
| 0 | Setup & Tooling | Low | Low | Pending |
| 1 | Extract Query Builders | Medium | Low | Pending |
| 2 | Extract Utilities | Low | Low | Pending |
| 3 | Implement Validation Layer | Medium | Low | Pending |
| 4 | Create Repository Layer | High | Medium | Pending |
| 5 | Refactor Services | High | Medium | Pending |
| 6 | Split Large Files | Medium | Low | Pending |
| 7 | Add Error Handling | Medium | Low | Pending |
| 8 | Implement DI Container | High | Medium | Pending |
| 9 | Add Tests | High | Low | Pending |
| 10 | Final Cleanup | Low | Low | Pending |

---

## Phase 0: Setup & Tooling

**Goal**: Prepare development environment and tools

### Tasks

1. **Install Dependencies**
   ```bash
   cd backend
   npm install zod
   npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
   ```

2. **Configure Jest**
   Create `backend/jest.config.js`:
   ```javascript
   module.exports = {
     preset: "ts-jest",
     testEnvironment: "node",
     roots: ["<rootDir>/src"],
     testMatch: ["**/__tests__/**/*.test.ts"],
     collectCoverageFrom: [
       "src/**/*.ts",
       "!src/**/*.d.ts",
       "!src/**/__tests__/**"
     ]
   };
   ```

3. **Add NPM Scripts**
   Update `backend/package.json`:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "lint": "eslint src --ext .ts",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

4. **Create Directory Structure**
   ```bash
   mkdir -p backend/src/infrastructure/database/query-builders
   mkdir -p backend/src/domain/repositories
   mkdir -p backend/src/api/validators
   mkdir -p backend/src/shared/errors
   mkdir -p backend/src/shared/constants
   ```

### Verification

```bash
npm run typecheck  # Should pass
npm run build      # Should succeed
```

### Duration
**Estimated**: 1 hour

---

## Phase 1: Extract Query Builders

**Goal**: Eliminate duplicated Prisma include patterns

### Tasks

#### 1.1 Create Character Query Builder

**File**: `backend/src/infrastructure/database/query-builders/character.queries.ts`

```typescript
export class CharacterQueries {
  static baseInclude() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        job: true
      }
    };
  }

  static fullInclude() {
    return {
      include: {
        ...this.baseInclude().include,
        characterRoles: { include: { role: true } },
        characterCapabilities: {
          include: { capability: true },
          orderBy: { capability: { name: "asc" as const } }
        },
        characterSkills: { include: { skill: true } },
        expeditionMembers: { include: { expedition: true } },
        inventory: {
          include: {
            slots: { include: { objectType: true } }
          }
        }
      }
    };
  }

  static withCapabilities() {
    return {
      include: {
        ...this.baseInclude().include,
        characterCapabilities: {
          include: { capability: true },
          orderBy: { capability: { name: "asc" as const } }
        }
      }
    };
  }
}
```

#### 1.2 Create Resource Query Builder

**File**: `backend/src/infrastructure/database/query-builders/resource.queries.ts`

```typescript
import { LocationType } from "@prisma/client";

export class ResourceQueries {
  static stockWhere(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string
  ) {
    return {
      locationType_locationId_resourceTypeId: {
        locationType,
        locationId,
        resourceTypeId
      }
    };
  }

  static withResourceType() {
    return {
      include: { resourceType: true }
    };
  }

  static byLocation(locationType: LocationType, locationId: string) {
    return {
      where: { locationType, locationId },
      ...this.withResourceType(),
      orderBy: { resourceType: { name: "asc" as const } }
    };
  }
}
```

#### 1.3 Create Project Query Builder

**File**: `backend/src/infrastructure/database/query-builders/project.queries.ts`

```typescript
export class ProjectQueries {
  static fullInclude() {
    return {
      include: {
        craftTypes: true,
        resourceCosts: { include: { resourceType: true } },
        outputResourceType: true,
        outputObjectType: true,
        town: true
      }
    };
  }

  static withResourceCosts() {
    return {
      include: {
        resourceCosts: { include: { resourceType: true } }
      }
    };
  }
}
```

#### 1.4 Create Expedition Query Builder

**File**: `backend/src/infrastructure/database/query-builders/expedition.queries.ts`

```typescript
export class ExpeditionQueries {
  static fullInclude() {
    return {
      include: {
        town: true,
        members: {
          include: {
            character: {
              include: { user: true }
            }
          }
        },
        emergencyVotes: true
      }
    };
  }

  static withMembers() {
    return {
      include: {
        members: {
          include: {
            character: {
              include: { user: true }
            }
          }
        }
      }
    };
  }
}
```

#### 1.5 Replace Usage in Services

**Strategy**: Search and replace duplicated include patterns

**Files to Update** (in order):
1. `backend/src/services/character.service.ts`
2. `backend/src/controllers/characters.ts`
3. `backend/src/services/expedition.service.ts`
4. `backend/src/controllers/expedition.ts`
5. All other files with duplicated patterns

**Example Replacement**:

Before:
```typescript
const character = await prisma.character.findFirst({
  where: { userId, townId, isActive: true },
  include: {
    user: true,
    town: { include: { guild: true } },
    characterRoles: { include: { role: true } },
    job: true
  }
});
```

After:
```typescript
import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";

const character = await prisma.character.findFirst({
  where: { userId, townId, isActive: true },
  ...CharacterQueries.fullInclude()
});
```

### Verification

```bash
npm run typecheck  # Must pass
npm run build      # Must succeed
```

### Duration
**Estimated**: 4-6 hours

---

## Phase 2: Extract Utilities

**Goal**: Create reusable utility functions

### Tasks

#### 2.1 Resource Utilities

**File**: `backend/src/shared/utils/resource.utils.ts`

```typescript
import { prisma } from "../../infrastructure/database/prisma.client";
import { LocationType } from "@prisma/client";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";

export class ResourceUtils {
  static async getResourceTypeByName(name: string) {
    const resourceType = await prisma.resourceType.findUnique({
      where: { name }
    });

    if (!resourceType) {
      throw new Error(`Resource type '${name}' not found`);
    }

    return resourceType;
  }

  static async getStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string
  ) {
    return prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      ...ResourceQueries.withResourceType()
    });
  }

  static async upsertStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string,
    amount: number
  ) {
    return prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      update: { quantity: { increment: amount } },
      create: { locationType, locationId, resourceTypeId, quantity: amount }
    });
  }
}
```

#### 2.2 Character Utilities

**File**: `backend/src/shared/utils/character.utils.ts`

```typescript
import { prisma } from "../../infrastructure/database/prisma.client";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";

export class CharacterUtils {
  static async getActiveCharacterOrThrow(userId: string, townId: string) {
    const character = await prisma.character.findFirst({
      where: { userId, townId, isActive: true, isDead: false },
      ...CharacterQueries.fullInclude()
    });

    if (!character) {
      throw new Error("No active character found");
    }

    return character;
  }

  static async getUserByDiscordIdOrThrow(discordId: string) {
    const user = await prisma.user.findUnique({
      where: { discordId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
```

#### 2.3 Replace Usage

**Files to Update**:
- All controllers and services using resource queries
- All controllers and services using character lookups

### Verification

```bash
npm run typecheck
npm run build
```

### Duration
**Estimated**: 3-4 hours

---

## Phase 3: Implement Validation Layer

**Goal**: Add Zod schema validation for all API endpoints

### Tasks

#### 3.1 Create Validation Middleware

**File**: `backend/src/api/middleware/validation.middleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import createHttpError from "http-errors";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw createHttpError(400, "Validation failed", {
          errors: error.errors
        });
      }
      next(error);
    }
  };
}
```

#### 3.2 Create Character Schemas

**File**: `backend/src/api/validators/character.schema.ts`

```typescript
import { z } from "zod";

export const CreateCharacterSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    townId: z.string().uuid(),
    name: z.string().min(1).max(50),
    roleIds: z.array(z.string().uuid()).optional(),
    jobId: z.number().int().positive()
  })
});

export const GetActiveCharacterSchema = z.object({
  params: z.object({
    discordId: z.string(),
    townId: z.string().uuid()
  })
});

export const UpdateCharacterStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    hp: z.number().int().min(0).max(5).optional(),
    pm: z.number().int().min(0).max(5).optional(),
    hungerLevel: z.number().int().min(0).max(4).optional()
  })
});
```

#### 3.3 Apply Validation to Routes

**Update**: `backend/src/routes/characters.ts`

```typescript
import { validate } from "../api/middleware/validation.middleware";
import {
  CreateCharacterSchema,
  GetActiveCharacterSchema
} from "../api/validators/character.schema";

router.get(
  "/:discordId/:townId",
  validate(GetActiveCharacterSchema),
  CharacterController.getActiveCharacterByDiscordId
);

router.post(
  "/",
  validate(CreateCharacterSchema),
  CharacterController.upsertCharacter
);
```

#### 3.4 Create More Schemas

**Files to Create**:
- `backend/src/api/validators/expedition.schema.ts`
- `backend/src/api/validators/resource.schema.ts`
- `backend/src/api/validators/project.schema.ts`
- `backend/src/api/validators/chantier.schema.ts`

### Verification

```bash
npm run typecheck
npm run build
# Manual testing: Try invalid requests, verify 400 errors
```

### Duration
**Estimated**: 6-8 hours

---

## Phase 4: Create Repository Layer

**Goal**: Abstract Prisma data access into repositories

### Tasks

#### 4.1 Create Character Repository

**File**: `backend/src/domain/repositories/character.repository.ts`

```typescript
import { PrismaClient, Character, Prisma } from "@prisma/client";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";

export class CharacterRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.character.findUnique({
      where: { id },
      ...CharacterQueries.fullInclude()
    });
  }

  async findActiveCharacter(userId: string, townId: string) {
    return this.prisma.character.findFirst({
      where: { userId, townId, isActive: true, isDead: false },
      ...CharacterQueries.fullInclude()
    });
  }

  async findUserByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId }
    });
  }

  async create(data: Prisma.CharacterCreateInput) {
    return this.prisma.character.create({
      data,
      ...CharacterQueries.fullInclude()
    });
  }

  async update(id: string, data: Prisma.CharacterUpdateInput) {
    return this.prisma.character.update({
      where: { id },
      data,
      ...CharacterQueries.fullInclude()
    });
  }

  async deactivateOtherCharacters(userId: string, townId: string, exceptId?: string) {
    return this.prisma.character.updateMany({
      where: {
        userId,
        townId,
        isActive: true,
        ...(exceptId && { id: { not: exceptId } })
      },
      data: { isActive: false }
    });
  }

  async addCapability(characterId: string, capabilityId: string) {
    return this.prisma.characterCapability.create({
      data: { characterId, capabilityId }
    });
  }

  async getCapabilities(characterId: string) {
    return this.prisma.characterCapability.findMany({
      where: { characterId },
      include: { capability: true },
      orderBy: { capability: { name: "asc" } }
    });
  }
}
```

#### 4.2 Create Resource Repository

**File**: `backend/src/domain/repositories/resource.repository.ts`

```typescript
import { PrismaClient, LocationType } from "@prisma/client";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";

export class ResourceRepository {
  constructor(private prisma: PrismaClient) {}

  async findResourceTypeByName(name: string) {
    return this.prisma.resourceType.findUnique({
      where: { name }
    });
  }

  async getStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string
  ) {
    return this.prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      ...ResourceQueries.withResourceType()
    });
  }

  async getAllStockForLocation(locationType: LocationType, locationId: string) {
    return this.prisma.resourceStock.findMany({
      ...ResourceQueries.byLocation(locationType, locationId)
    });
  }

  async upsertStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string,
    amount: number
  ) {
    return this.prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      update: { quantity: { increment: amount } },
      create: { locationType, locationId, resourceTypeId, quantity: amount }
    });
  }

  async decrementStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string,
    amount: number
  ) {
    return this.prisma.resourceStock.update({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      data: { quantity: { decrement: amount } }
    });
  }
}
```

#### 4.3 Create More Repositories

**Files to Create**:
- `backend/src/domain/repositories/expedition.repository.ts`
- `backend/src/domain/repositories/project.repository.ts`
- `backend/src/domain/repositories/chantier.repository.ts`
- `backend/src/domain/repositories/capability.repository.ts`

### Verification

```bash
npm run typecheck
npm run build
```

### Duration
**Estimated**: 8-10 hours

---

## Phase 5: Refactor Services

**Goal**: Update services to use repositories instead of direct Prisma

### Tasks

#### 5.1 Refactor CharacterService

**Strategy**: Replace direct Prisma calls with repository methods

**File**: `backend/src/services/character.service.ts`

Before:
```typescript
async getActiveCharacter(userId: string, townId: string) {
  return await prisma.character.findFirst({
    where: { userId, townId, isActive: true },
    ...CharacterQueries.fullInclude()
  });
}
```

After:
```typescript
constructor(
  private characterRepo: CharacterRepository,
  private capabilityService: CapabilityService
) {}

async getActiveCharacter(userId: string, townId: string) {
  return await this.characterRepo.findActiveCharacter(userId, townId);
}
```

#### 5.2 Refactor ResourceService

**File**: `backend/src/services/resource.service.ts`

Update to use ResourceRepository

#### 5.3 Update Other Services

**Files to Refactor**:
- `backend/src/services/expedition.service.ts`
- `backend/src/services/capability.service.ts`
- `backend/src/services/project.service.ts`
- `backend/src/services/chantier.service.ts`

### Verification

```bash
npm run typecheck
npm run build
# Manual testing: Test critical API endpoints
```

### Duration
**Estimated**: 10-12 hours

---

## Phase 6: Split Large Files

**Goal**: Break down files >500 LOC into smaller modules

### Tasks

#### 6.1 Split character.service.ts (1,157 LOC)

**New Structure**:
```
backend/src/services/character/
├── character.service.ts          (Core CRUD - ~300 LOC)
├── character-stats.service.ts    (HP, PM, PA, hunger - ~250 LOC)
├── character-inventory.service.ts (Inventory - ~200 LOC)
└── character-capability.service.ts (Capabilities - ~200 LOC)
```

**Strategy**:
1. Create new directory: `backend/src/services/character/`
2. Extract methods to new services
3. Update imports in controllers
4. Delete old file

#### 6.2 Split characters.ts Controller (1,023 LOC)

**New Structure**:
```
backend/src/controllers/character/
├── character.controller.ts           (CRUD - ~200 LOC)
├── character-stats.controller.ts     (Stats - ~200 LOC)
├── character-capabilities.controller.ts (Capabilities - ~200 LOC)
└── fishing.controller.ts             (Fishing - ~150 LOC)
```

#### 6.3 Update Routes

**File**: `backend/src/routes/characters.ts`

Update imports to point to new controller files

### Verification

```bash
npm run typecheck
npm run build
```

### Duration
**Estimated**: 6-8 hours

---

## Phase 7: Add Error Handling

**Goal**: Consistent error handling with custom error classes

### Tasks

#### 7.1 Create Error Classes

**File**: `backend/src/shared/errors/app-error.ts`

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**File**: `backend/src/shared/errors/not-found-error.ts`
**File**: `backend/src/shared/errors/validation-error.ts`
**File**: `backend/src/shared/errors/unauthorized-error.ts`

#### 7.2 Update Error Handler Middleware

**File**: `backend/src/api/middleware/error-handler.middleware.ts`

```typescript
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error instanceof ValidationError && { errors: error.errors })
    });
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
```

#### 7.3 Replace Error Throwing

**Strategy**: Replace all `throw new Error()` and `createHttpError()` with custom error classes

### Verification

```bash
npm run typecheck
npm run build
# Manual testing: Verify error responses
```

### Duration
**Estimated**: 4-5 hours

---

## Phase 8: Implement DI Container

**Goal**: Centralize dependency injection

### Tasks

#### 8.1 Create Container

**File**: `backend/src/infrastructure/container.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { CharacterRepository } from "../domain/repositories/character.repository";
import { ResourceRepository } from "../domain/repositories/resource.repository";
import { CharacterService } from "../services/character/character.service";
import { ResourceService } from "../services/resource.service";

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;

  // Repositories
  public characterRepo: CharacterRepository;
  public resourceRepo: ResourceRepository;

  // Services
  public characterService: CharacterService;
  public resourceService: ResourceService;

  private constructor() {
    this.prisma = new PrismaClient();

    // Initialize repositories
    this.characterRepo = new CharacterRepository(this.prisma);
    this.resourceRepo = new ResourceRepository(this.prisma);

    // Initialize services
    this.resourceService = new ResourceService(this.resourceRepo);
    this.characterService = new CharacterService(this.characterRepo);
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

export const container = Container.getInstance();
```

#### 8.2 Update Controllers

**Strategy**: Import services from container instead of creating instances

Before:
```typescript
const characterService = new CharacterService(prisma);
```

After:
```typescript
import { container } from "../../infrastructure/container";

export const getActiveCharacter: RequestHandler = async (req, res, next) => {
  const character = await container.characterService.getActiveCharacter(...);
};
```

### Verification

```bash
npm run typecheck
npm run build
```

### Duration
**Estimated**: 4-5 hours

---

## Phase 9: Add Tests

**Goal**: Achieve >70% test coverage

### Tasks

#### 9.1 Unit Tests for Services

**Example**: `backend/src/services/character/__tests__/character.service.test.ts`

```typescript
import { CharacterService } from "../character.service";
import { CharacterRepository } from "../../../domain/repositories/character.repository";
import { NotFoundError } from "../../../shared/errors/not-found-error";

jest.mock("../../../domain/repositories/character.repository");

describe("CharacterService", () => {
  let service: CharacterService;
  let mockRepo: jest.Mocked<CharacterRepository>;

  beforeEach(() => {
    mockRepo = new CharacterRepository(null as any) as jest.Mocked<CharacterRepository>;
    service = new CharacterService(mockRepo);
  });

  describe("getActiveCharacter", () => {
    it("should return character when found", async () => {
      const mockCharacter = { id: "1", name: "Hero" };
      mockRepo.findActiveCharacter.mockResolvedValue(mockCharacter as any);

      const result = await service.getActiveCharacter("user-1", "town-1");

      expect(result).toEqual(mockCharacter);
    });

    it("should throw NotFoundError when not found", async () => {
      mockRepo.findActiveCharacter.mockResolvedValue(null);

      await expect(
        service.getActiveCharacter("user-1", "town-1")
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

#### 9.2 Integration Tests for API

**Example**: `backend/src/api/controllers/__tests__/character.controller.test.ts`

```typescript
import request from "supertest";
import app from "../../../app";

describe("Character API", () => {
  describe("GET /api/characters/:discordId/:townId", () => {
    it("should return active character", async () => {
      const response = await request(app)
        .get("/api/characters/123456789/town-1")
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
    });

    it("should return 404 when character not found", async () => {
      const response = await request(app)
        .get("/api/characters/nonexistent/town-1")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });
});
```

#### 9.3 Test Coverage Goals

- Services: 80%+
- Repositories: 70%+
- Controllers: 60%+
- Utilities: 90%+

### Verification

```bash
npm run test
npm run test:coverage
```

### Duration
**Estimated**: 12-15 hours

---

## Phase 10: Final Cleanup

**Goal**: Polish and finalize refactoring

### Tasks

1. **Remove Unused Code**: Delete dead code and unused imports
2. **Consistent Naming**: Ensure naming conventions are followed
3. **Update Documentation**: Finalize all documentation
4. **Performance Review**: Check for N+1 queries, missing indexes
5. **Security Audit**: Review authentication, input validation
6. **Final Type Check**: Ensure strict TypeScript passes

### Verification

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

### Duration
**Estimated**: 4-6 hours

---

## Total Effort Estimate

| Phase | Hours |
|-------|-------|
| 0 | 1 |
| 1 | 5 |
| 2 | 3.5 |
| 3 | 7 |
| 4 | 9 |
| 5 | 11 |
| 6 | 7 |
| 7 | 4.5 |
| 8 | 4.5 |
| 9 | 13.5 |
| 10 | 5 |
| **Total** | **70-80 hours** |

---

## Rollback Strategy

### Per-Phase Rollback

Each phase should be committed separately to Git:

```bash
git add .
git commit -m "Phase X: [description]"
```

If a phase fails:
```bash
git reset --hard HEAD~1  # Rollback last commit
```

### Backup Before Starting

```bash
git checkout -b refactoring-backup
git checkout -b refactoring-work
```

---

## Success Metrics

- [ ] TypeScript strict mode passes
- [ ] No files >500 LOC
- [ ] Test coverage >70%
- [ ] All duplicated patterns extracted
- [ ] All API endpoints validated with Zod
- [ ] Repository pattern implemented
- [ ] DI container in use
- [ ] Custom error classes throughout

---

Next: See `05-PROGRESS-TRACKER.md` for real-time tracking
