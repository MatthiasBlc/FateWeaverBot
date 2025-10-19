# Current Architecture Analysis

**Date**: 2025-10-19

---

## Architecture Overview

The FateWeaverBot backend follows a **Layered MVC Architecture** with a clear service layer:

```
┌─────────────────────────────────────────────────┐
│              HTTP Requests (REST API)            │
├─────────────────────────────────────────────────┤
│  Routes (14 files) - Define HTTP endpoints     │
│        ↓ (delegate to)                          │
│  Controllers (13 files) - Handle requests      │
│        ↓ (delegate to)                          │
│  Services (13 files) - Business logic          │
│        ↓ (use)                                  │
│  Prisma Client - Database access               │
│        ↓ (connects to)                          │
│  PostgreSQL Database                           │
└─────────────────────────────────────────────────┘

Supporting Layers:
├── Utilities - Validation, mapping, helpers
├── Middleware - Authentication, logging
└── Cron Jobs - Scheduled background tasks
```

---

## Directory Structure

```
backend/src/
├── app.ts                    # Express app setup, middleware, routes
├── server.ts                 # Server initialization
├── controllers/              # HTTP request handlers (13 files)
│   ├── admin/               # Admin-specific endpoints
│   ├── characters.ts        # 1,023 LOC - Character operations
│   ├── expedition.ts
│   ├── capabilities.ts
│   ├── towns.ts
│   ├── resources.ts
│   └── [7 more]
├── services/                # Business logic layer (13 files)
│   ├── character.service.ts # 1,157 LOC - Character business logic
│   ├── capability.service.ts
│   ├── expedition.service.ts
│   ├── resource.service.ts
│   └── [9 more]
├── routes/                  # Route definitions (14 files)
│   ├── admin/
│   ├── characters.ts
│   ├── expeditions.ts
│   └── [11 more]
├── middleware/              # Express middleware
│   └── auth.ts             # 3 auth strategies
├── cron/                    # Scheduled jobs (6 files)
│   ├── daily-pa.cron.ts
│   ├── expedition.cron.ts
│   └── [4 more]
├── util/                    # Utility functions
│   ├── db.ts               # Prisma singleton
│   ├── mappers.ts          # DTO transformations
│   ├── character-validators.ts
│   └── [3 more]
├── interfaces/              # TypeScript interfaces
│   └── character.dto.ts
└── types/                   # Type definitions
    ├── express-session.d.ts
    └── prisma-session-store.d.ts
```

---

## Layer Details

### Routes Layer

**Purpose**: Define HTTP endpoints and map to controllers

**Pattern**:
```typescript
// Example: routes/characters.ts
import { Router } from "express";
import * as CharacterController from "../controllers/characters";

const router = Router();

router.get("/:discordId/:townId", CharacterController.getActiveCharacterByDiscordId);
router.post("/", CharacterController.upsertCharacter);
router.delete("/:id", CharacterController.deleteCharacter);

export default router;
```

**Registered in**: `app.ts` via `app.use("/api/characters", characterRoutes)`

---

### Controllers Layer

**Purpose**: Handle HTTP requests, validate input, delegate to services, format responses

**Pattern**:
```typescript
// Example: controllers/characters.ts
export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, name } = req.body;

    // Validation
    if (!userId || !townId) {
      throw createHttpError(400, "userId and townId required");
    }

    // Delegate to service
    const character = await characterService.createCharacter({...});

    // Format response
    res.status(200).json(toCharacterDto(character));
  } catch (error) {
    next(error);  // Pass to error handler
  }
};
```

**Largest Files**:
- `characters.ts`: 1,023 LOC
- `towns.ts`: ~400 LOC
- `resources.ts`: ~300 LOC

---

### Services Layer

**Purpose**: Implement business logic, use Prisma transactions, enforce business rules

**Pattern**:
```typescript
// Example: services/character.service.ts
export class CharacterService {
  constructor(private capabilityService: CapabilityService) {}

  async createCharacter(data: CreateCharacterData): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      // Business rule: One active character per user per town
      await tx.character.updateMany({
        where: { userId, townId, isActive: true },
        data: { isActive: false }
      });

      // Create character
      const character = await tx.character.create({...});

      // Add default capabilities
      await tx.characterCapability.createMany({...});

      return character;
    });
  }
}
```

**Largest Files**:
- `character.service.ts`: 1,157 LOC
- `capability.service.ts`: ~500 LOC
- `expedition.service.ts`: ~400 LOC

---

### Utilities Layer

**Purpose**: Provide reusable helpers, validators, and mappers

**Files**:
- `db.ts`: Prisma singleton instance
- `mappers.ts`: DTO transformation functions
- `character-validators.ts`: Business validation (PA checks, etc.)
- `capacityRandom.ts`: Random generation for capabilities
- `validateEnv.ts`: Environment variable validation
- `assertIsDefine.ts`: Type guards

---

### Middleware Layer

**Purpose**: Authentication, authorization, logging, CORS

**Auth Strategies** (middleware/auth.ts):
1. `requireAuth`: Session-based authentication
2. `requireInternal`: Internal service calls (Docker network)
3. `requireAuthOrInternal`: Hybrid authentication

---

### Cron Jobs

**Purpose**: Scheduled background tasks

**Jobs**:
- `daily-pa.cron.ts`: Regenerate action points, handle hunger penalties
- `hunger-increase.cron.ts`: Daily hunger increase
- `expedition.cron.ts`: Manage expedition returns
- `daily-pm.cron.ts`: Daily morale updates
- `daily-message.cron.ts`: Broadcast daily messages
- `season-change.cron.ts`: Season transitions

**Pattern**: Each creates its own PrismaClient (inconsistency with service layer)

---

## Data Flow Example

### Character Creation Flow

```
POST /api/characters
    ↓
routes/characters.ts (router.post("/", ...))
    ↓
controllers/characters.ts (upsertCharacter)
    - Validate request body
    - Extract userId, townId, name
    ↓
services/character.service.ts (createCharacter)
    - Start transaction
    - Deactivate other characters
    - Create new character
    - Add default capabilities
    - Commit transaction
    ↓
controllers/characters.ts
    - Transform to DTO (toCharacterDto)
    - Return JSON response
```

---

## Database Access Patterns

### Prisma Singleton

**File**: `util/db.ts`
```typescript
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
export { prisma };
```

**Usage**: Imported in controllers and services

### Transactions

**Common Pattern**:
```typescript
await prisma.$transaction(async (tx) => {
  // Multiple database operations
  // All succeed or all fail
});
```

**Used For**:
- Character creation/updates
- Resource transfers
- Project/Chantier completion
- Capability assignments

### Include Patterns

**Repeated Pattern** (found 15+ times):
```typescript
include: {
  user: true,
  town: { include: { guild: true } },
  characterRoles: { include: { role: true } },
  job: true
}
```

---

## Configuration

### Environment Variables

**Validated in**: `util/validateEnv.ts`

**Required**:
- `DATABASE_URL`: PostgreSQL connection
- `PORT`: Express server port
- `SESSION_SECRET`: Session encryption
- `CORS_ORIGIN`: CORS allowed origins
- `DISCORD_TOKEN`: Discord bot token (optional)

### TypeScript Config

**tsconfig.json**:
- Target: ES2018
- Module: CommonJS
- Strict mode enabled
- Path aliases: `@/*`, `@shared/*`

### Dependencies

**Key Libraries**:
- Express: Web framework
- Prisma: ORM
- express-session: Session management
- http-errors: Error handling
- bcrypt: Password hashing
- winston: Logging
- cron: Scheduled jobs

---

## Error Handling

### Pattern

**Controllers**:
```typescript
try {
  // ... operations
} catch (error) {
  next(error);  // Pass to global handler
}
```

**Global Handler** (app.ts):
```typescript
app.use((error: unknown, req, res, next) => {
  let statusCode = 500;
  let errorMessage = "Unknown error";

  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }

  res.status(statusCode).json({ error: errorMessage });
});
```

---

## Authentication Flow

### Session-Based Auth

**Setup** (app.ts):
```typescript
app.use(session({
  secret: env.SESSION_SECRET,
  store: new PrismaSessionStore(prisma, {...}),
  cookie: { maxAge: 60 * 60 * 1000 }  // 1 hour
}));
```

**Middleware** (middleware/auth.ts):
```typescript
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  next(createHttpError(401, "Not authenticated"));
};
```

---

## Key Strengths

1. **Clear Layer Separation**: Controllers don't know about Prisma internals
2. **Transaction Usage**: Business rules enforced atomically
3. **Centralized Error Handling**: Consistent error responses
4. **DTO Pattern**: Prevents internal model leakage
5. **Service Classes**: Dependency injection via constructors

---

## Key Weaknesses

1. **Code Duplication**: Resource queries, include patterns repeated extensively
2. **Large Files**: Some controllers/services exceed 1,000 LOC
3. **No Schema Validation**: Manual validation scattered everywhere
4. **Inconsistent Prisma Usage**: Cron jobs create own clients vs singleton
5. **Missing Abstractions**: No query builders, repository pattern

---

## File Size Distribution

| File | LOC | Complexity |
|------|-----|-----------|
| character.service.ts | 1,157 | Very High |
| characters.ts (controller) | 1,023 | Very High |
| daily-pa.cron.ts | 279 | High |
| capability.service.ts | ~500 | Medium |
| expedition.service.ts | ~400 | Medium |
| towns.ts (controller) | ~400 | Medium |

---

## Next Steps

See:
- **02-ISSUES-IDENTIFIED.md**: Detailed list of code smells and problems
- **03-TARGET-ARCHITECTURE.md**: Proposed improvements
- **04-IMPLEMENTATION-PLAN.md**: Refactoring roadmap
