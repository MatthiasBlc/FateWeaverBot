# Target Architecture - Desired State

**Date**: 2025-10-19

---

## Overview

This document defines the target architecture for the refactored backend, following clean code principles, DRY, and maintainability best practices.

---

## Core Principles

### 1. Single Responsibility Principle (SRP)
- Each class/module has one reason to change
- Files should not exceed 500 LOC
- Clear separation between layers

### 2. DRY (Don't Repeat Yourself)
- Extract common patterns to utilities
- Query builders for repeated Prisma patterns
- Shared validation schemas

### 3. Dependency Inversion
- Depend on abstractions, not concretions
- Service layer abstracts data access
- Repositories abstract Prisma queries

### 4. Type Safety
- Strong typing throughout
- Schema validation with Zod
- No `any` types

---

## Target Directory Structure

```
backend/src/
├── app.ts                          # Express app setup
├── server.ts                       # Server initialization
│
├── api/                            # API layer
│   ├── routes/                     # Route definitions
│   │   ├── index.ts               # Route aggregation
│   │   ├── characters.routes.ts
│   │   ├── expeditions.routes.ts
│   │   └── [other routes]
│   │
│   ├── controllers/                # Request handlers
│   │   ├── character/             # Character-related controllers
│   │   │   ├── character.controller.ts
│   │   │   ├── character-stats.controller.ts
│   │   │   └── character-capabilities.controller.ts
│   │   ├── expedition/
│   │   │   ├── expedition.controller.ts
│   │   │   └── expedition-members.controller.ts
│   │   └── [other controllers]
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error-handler.middleware.ts
│   │   └── request-logger.middleware.ts
│   │
│   └── validators/                 # Zod schemas
│       ├── character.schema.ts
│       ├── expedition.schema.ts
│       └── [other schemas]
│
├── domain/                         # Business logic layer
│   ├── services/                   # Business services
│   │   ├── character/             # Character domain
│   │   │   ├── character.service.ts
│   │   │   ├── character-stats.service.ts
│   │   │   └── character-inventory.service.ts
│   │   ├── expedition/
│   │   │   ├── expedition.service.ts
│   │   │   └── expedition-voting.service.ts
│   │   ├── resource/
│   │   │   └── resource.service.ts
│   │   └── [other services]
│   │
│   ├── repositories/               # Data access layer
│   │   ├── character.repository.ts
│   │   ├── expedition.repository.ts
│   │   ├── resource.repository.ts
│   │   └── [other repositories]
│   │
│   └── models/                     # Domain models & DTOs
│       ├── character.dto.ts
│       ├── expedition.dto.ts
│       └── [other DTOs]
│
├── infrastructure/                 # External dependencies
│   ├── database/
│   │   ├── prisma.client.ts       # Prisma singleton
│   │   ├── query-builders/        # Reusable query builders
│   │   │   ├── character.queries.ts
│   │   │   ├── resource.queries.ts
│   │   │   └── [other builders]
│   │   └── migrations/            # (Prisma manages this)
│   │
│   └── cron/                       # Scheduled jobs
│       ├── daily-pa.cron.ts
│       ├── hunger-increase.cron.ts
│       └── [other crons]
│
├── shared/                         # Shared utilities
│   ├── utils/                      # General utilities
│   │   ├── mappers.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   ├── constants/                  # Constants & enums
│   │   ├── game-rules.ts
│   │   └── error-messages.ts
│   │
│   ├── errors/                     # Custom error classes
│   │   ├── app-error.ts
│   │   ├── validation-error.ts
│   │   └── not-found-error.ts
│   │
│   └── types/                      # Shared types
│       ├── express-session.d.ts
│       └── [other types]
│
└── config/                         # Configuration
    ├── env.config.ts              # Environment validation
    └── app.config.ts              # App configuration
```

---

## Layer Responsibilities

### 1. API Layer (Routes + Controllers)

**Routes**:
- Define HTTP endpoints
- Map to controller methods
- Apply middleware (auth, validation)

**Controllers**:
- Handle HTTP requests
- Validate input (using Zod schemas via middleware)
- Call service layer
- Format responses
- Handle errors

**Size Limit**: Max 200 LOC per controller

**Example**:
```typescript
// api/controllers/character/character.controller.ts
export class CharacterController {
  constructor(private characterService: CharacterService) {}

  async getActiveCharacter(req: Request, res: Response, next: NextFunction) {
    try {
      const { discordId, townId } = req.params;
      const character = await this.characterService.getActiveCharacter(
        discordId,
        townId
      );
      res.json(character);
    } catch (error) {
      next(error);
    }
  }
}
```

---

### 2. Domain Layer (Services + Repositories)

**Services**:
- Implement business logic
- Orchestrate between repositories
- Handle transactions
- Enforce business rules

**Repositories**:
- Abstract data access
- Encapsulate Prisma queries
- Provide clean query interface
- Use query builders

**Size Limit**: Max 300 LOC per service, max 400 LOC per repository

**Example**:
```typescript
// domain/services/character/character.service.ts
export class CharacterService {
  constructor(
    private characterRepo: CharacterRepository,
    private capabilityService: CapabilityService
  ) {}

  async getActiveCharacter(discordId: string, townId: string) {
    const user = await this.characterRepo.findUserByDiscordId(discordId);
    if (!user) throw new NotFoundError("User not found");

    const character = await this.characterRepo.findActiveCharacter(
      user.id,
      townId
    );
    if (!character) throw new NotFoundError("No active character");

    return character;
  }
}
```

```typescript
// domain/repositories/character.repository.ts
export class CharacterRepository {
  constructor(private prisma: PrismaClient) {}

  async findActiveCharacter(userId: string, townId: string) {
    return this.prisma.character.findFirst({
      where: {
        userId,
        townId,
        isActive: true,
        isDead: false
      },
      ...CharacterQueries.fullInclude()  // Query builder
    });
  }

  async findUserByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId }
    });
  }
}
```

---

### 3. Infrastructure Layer

**Database**:
- Prisma client singleton
- Query builders for common patterns
- Database utilities

**Cron Jobs**:
- Thin wrappers around service calls
- Scheduled task execution

**Example**:
```typescript
// infrastructure/database/query-builders/character.queries.ts
export class CharacterQueries {
  static fullInclude() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true
          }
        }
      }
    };
  }

  static withCapabilities() {
    return {
      include: {
        ...this.fullInclude().include,
        characterCapabilities: {
          include: { capability: true },
          orderBy: { capability: { name: "asc" as const } }
        }
      }
    };
  }
}
```

```typescript
// infrastructure/cron/daily-pa.cron.ts
export function setupDailyPaJob(characterService: CharacterService) {
  const job = new CronJob("0 0 * * *", async () => {
    await characterService.regenerateDailyPA();
  });
  return job;
}
```

---

### 4. Shared Layer

**Utils**: General utilities (date formatting, string manipulation, etc.)
**Constants**: Game rules, magic numbers, error messages
**Errors**: Custom error classes
**Types**: Shared TypeScript types

---

## Validation Strategy

### Zod Schema Validation

**Pattern**: Define schemas for all API inputs

```typescript
// api/validators/character.schema.ts
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
```

**Usage**: Via validation middleware

```typescript
// api/routes/characters.routes.ts
router.post(
  "/",
  validate(CreateCharacterSchema),
  characterController.createCharacter
);
```

**Validation Middleware**:
```typescript
// api/middleware/validation.middleware.ts
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
        throw new ValidationError(error.errors);
      }
      next(error);
    }
  };
}
```

---

## Error Handling Strategy

### Custom Error Classes

```typescript
// shared/errors/app-error.ts
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

// shared/errors/not-found-error.ts
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

// shared/errors/validation-error.ts
export class ValidationError extends AppError {
  constructor(public errors: ZodIssue[]) {
    super("Validation failed", 400);
  }
}
```

### Error Handler Middleware

```typescript
// api/middleware/error-handler.middleware.ts
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

  // Unexpected errors
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
```

---

## Dependency Injection

### Service Container

```typescript
// infrastructure/container.ts
import { PrismaClient } from "@prisma/client";

export class Container {
  private prisma: PrismaClient;

  // Repositories
  private characterRepo: CharacterRepository;
  private resourceRepo: ResourceRepository;

  // Services
  private characterService: CharacterService;
  private resourceService: ResourceService;

  constructor() {
    this.prisma = new PrismaClient();

    // Initialize repositories
    this.characterRepo = new CharacterRepository(this.prisma);
    this.resourceRepo = new ResourceRepository(this.prisma);

    // Initialize services
    this.resourceService = new ResourceService(this.resourceRepo);
    this.characterService = new CharacterService(
      this.characterRepo,
      this.resourceService
    );
  }

  getCharacterService() {
    return this.characterService;
  }

  getResourceService() {
    return this.resourceService;
  }
}

export const container = new Container();
```

---

## Query Builder Pattern

### Resource Queries

```typescript
// infrastructure/database/query-builders/resource.queries.ts
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
}
```

### Usage in Repository

```typescript
// domain/repositories/resource.repository.ts
export class ResourceRepository {
  async getStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string
  ) {
    return this.prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(
        locationType,
        locationId,
        resourceTypeId
      ),
      ...ResourceQueries.withResourceType()
    });
  }

  async upsertStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: string,
    amount: number
  ) {
    return this.prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(
        locationType,
        locationId,
        resourceTypeId
      ),
      update: { quantity: { increment: amount } },
      create: { locationType, locationId, resourceTypeId, quantity: amount }
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

**Tools**: Jest + ts-jest
**Target**: Services and utilities
**Coverage Goal**: 80%+

**Example**:
```typescript
// domain/services/character/__tests__/character.service.test.ts
describe("CharacterService", () => {
  let service: CharacterService;
  let mockCharacterRepo: jest.Mocked<CharacterRepository>;

  beforeEach(() => {
    mockCharacterRepo = {
      findActiveCharacter: jest.fn(),
      findUserByDiscordId: jest.fn()
    } as any;

    service = new CharacterService(mockCharacterRepo, mockCapabilityService);
  });

  describe("getActiveCharacter", () => {
    it("should return active character when found", async () => {
      const mockUser = { id: "user-1", discordId: "123" };
      const mockCharacter = { id: "char-1", name: "Hero" };

      mockCharacterRepo.findUserByDiscordId.mockResolvedValue(mockUser);
      mockCharacterRepo.findActiveCharacter.mockResolvedValue(mockCharacter);

      const result = await service.getActiveCharacter("123", "town-1");

      expect(result).toEqual(mockCharacter);
      expect(mockCharacterRepo.findActiveCharacter).toHaveBeenCalledWith(
        "user-1",
        "town-1"
      );
    });

    it("should throw NotFoundError when user not found", async () => {
      mockCharacterRepo.findUserByDiscordId.mockResolvedValue(null);

      await expect(
        service.getActiveCharacter("123", "town-1")
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Tests

**Tools**: Supertest + test database
**Target**: API endpoints
**Coverage**: Critical flows

---

## Configuration Management

### Environment Validation

```typescript
// config/env.config.ts
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive(),
  SESSION_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
  DISCORD_TOKEN: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
```

---

## Migration Path

### From Current to Target

**Phase 1**: Extract utilities (query builders, validators)
**Phase 2**: Implement repository layer
**Phase 3**: Refactor services to use repositories
**Phase 4**: Add Zod validation
**Phase 5**: Split large files
**Phase 6**: Add tests

See `04-IMPLEMENTATION-PLAN.md` for detailed roadmap.

---

## Benefits of Target Architecture

1. **Maintainability**: Smaller, focused files
2. **Testability**: Dependency injection enables mocking
3. **Type Safety**: Zod validation + TypeScript
4. **DRY**: Query builders eliminate duplication
5. **Scalability**: Clear layer separation
6. **Developer Experience**: Easy to navigate and understand

---

## Comparison: Before vs After

| Aspect | Current | Target |
|--------|---------|--------|
| Largest file | 1,157 LOC | <500 LOC |
| Validation | Manual, scattered | Zod schemas, centralized |
| Duplication | Resource queries 10x | Query builders, 1x definition |
| Data access | Direct Prisma in services | Repository pattern |
| Error handling | Mixed types | Custom error classes |
| Testing | None | Unit + integration tests |
| Dependencies | Implicit | Explicit injection |

---

Next: See `04-IMPLEMENTATION-PLAN.md` for execution strategy
