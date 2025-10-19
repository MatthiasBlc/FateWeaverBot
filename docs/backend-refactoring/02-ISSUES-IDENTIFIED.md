# Issues Identified - Code Smells and Problems

**Date**: 2025-10-19

---

## Overview

This document catalogs all issues, code smells, and areas for improvement identified in the backend codebase.

---

## 1. Code Duplication (DRY Violations)

### 1.1 Resource Stock Queries (CRITICAL)

**Occurrences**: 10+ files
**Impact**: High - increases maintenance burden and bug risk

**Duplicated Pattern**:
```typescript
const resourceStock = await prisma.resourceStock.findUnique({
  where: {
    locationType_locationId_resourceTypeId: {
      locationType: "CITY",
      locationId: character.townId,
      resourceTypeId: vivresType.id,
    },
  },
});
```

**Found In**:
- `backend/src/controllers/characters.ts` (multiple locations)
- `backend/src/controllers/towns.ts`
- `backend/src/controllers/resources.ts`
- `backend/src/services/character.service.ts`
- `backend/src/services/resource.service.ts`
- And 5+ more files

**Solution**: Extract to `ResourceService.getStock(locationType, locationId, resourceTypeId)`

---

### 1.2 Character Include Pattern (CRITICAL)

**Occurrences**: 15+ times across services and controllers
**Impact**: Very High - changes require updates in many places

**Duplicated Pattern**:
```typescript
include: {
  user: true,
  town: { include: { guild: true } },
  characterRoles: { include: { role: true } },
  job: { include: { startingAbility: true, optionalAbility: true } }
}
```

**Examples**:
- `backend/src/services/character.service.ts:99-114`
- `backend/src/services/character.service.ts:136-150`
- `backend/src/controllers/characters.ts:220-235`
- `backend/src/controllers/towns.ts:85-100`

**Solution**: Create utility function `getCharacterInclude()` or use query builder pattern

---

### 1.3 Resource Upsert Pattern

**Occurrences**: 5+ files
**Impact**: Medium

**Duplicated Pattern**:
```typescript
await prisma.resourceStock.upsert({
  where: {
    locationType_locationId_resourceTypeId: {
      locationType,
      locationId,
      resourceTypeId
    }
  },
  update: { quantity: { increment: amount } },
  create: { locationType, locationId, resourceTypeId, quantity: amount }
});
```

**Found In**:
- `backend/src/controllers/characters.ts`
- `backend/src/services/character.service.ts`
- `backend/src/services/expedition.service.ts`
- `backend/src/controllers/towns.ts`

**Solution**: Extract to `ResourceService.addStock(locationType, locationId, resourceTypeId, amount)`

---

### 1.4 Character Active Check Pattern

**Occurrences**: 8+ files
**Impact**: Medium

**Duplicated Pattern**:
```typescript
const character = await prisma.character.findFirst({
  where: {
    userId,
    townId,
    isActive: true,
    isDead: false
  }
});

if (!character) {
  throw createHttpError(404, "No active character found");
}
```

**Solution**: Extract to `CharacterService.getActiveCharacterOrThrow(userId, townId)`

---

### 1.5 PA (Action Points) Validation

**Occurrences**: 6+ files
**Impact**: Low-Medium (already partially extracted to character-validators.ts)

**Current State**: Some validation in `util/character-validators.ts:validateCanUsePA()`
**Issue**: Not consistently used across all controllers
**Solution**: Ensure all PA usage goes through validation utility

---

### 1.6 Resource Type Lookup by Name

**Occurrences**: 10+ files
**Impact**: High

**Duplicated Pattern**:
```typescript
const vivresType = await prisma.resourceType.findUnique({
  where: { name: "Vivres" }
});

if (!vivresType) {
  throw new Error("Resource type 'Vivres' not found");
}
```

**Found In**:
- `backend/src/controllers/characters.ts`
- `backend/src/services/capability.service.ts`
- `backend/src/cron/daily-pa.cron.ts`
- And many more

**Solution**: Create `ResourceService.getResourceTypeByName(name)` with caching

---

## 2. Large Files (Maintainability Issues)

### 2.1 character.service.ts (1,157 LOC)

**File**: `backend/src/services/character.service.ts`
**Size**: 1,157 lines
**Complexity**: Very High

**Issues**:
- Too many responsibilities
- Handles character CRUD, capabilities, stats, inventory, fishing, hunger
- Difficult to navigate and test

**Proposed Solution**: Split into multiple services:
- `CharacterService`: Core CRUD operations
- `CharacterStatsService`: HP, PM, PA, hunger management
- `CharacterCapabilityService`: Capability management
- `CharacterInventoryService`: Inventory operations
- `FishingService`: Fishing-specific logic

---

### 2.2 characters.ts Controller (1,023 LOC)

**File**: `backend/src/controllers/characters.ts`
**Size**: 1,023 lines
**Complexity**: Very High

**Issues**:
- Too many endpoints in a single file
- Handles character CRUD, stats, fishing, skills, capabilities
- Hard to find specific endpoints

**Proposed Solution**: Split into multiple controllers:
- `character.controller.ts`: Core CRUD
- `character-stats.controller.ts`: Stats management
- `character-capabilities.controller.ts`: Capability operations
- `fishing.controller.ts`: Fishing endpoints

---

### 2.3 daily-pa.cron.ts (279 LOC)

**File**: `backend/src/cron/daily-pa.cron.ts`
**Size**: 279 lines
**Complexity**: High

**Issues**:
- Complex business logic in cron job
- Direct Prisma usage instead of service layer
- Difficult to test

**Proposed Solution**: Extract logic to service methods, keep cron job as thin wrapper

---

## 3. Architecture Issues

### 3.1 Inconsistent Prisma Client Usage

**Issue**: Some files use singleton, others create new instances

**Singleton Pattern** (correct):
```typescript
// util/db.ts
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
export { prisma };

// controllers/characters.ts
import { prisma } from "../util/db";
```

**Direct Instantiation** (inconsistent):
```typescript
// cron/daily-pa.cron.ts
const prisma = new PrismaClient();
```

**Impact**: Multiple client instances can cause connection pool issues

**Solution**: All code should use singleton from `util/db.ts`

---

### 3.2 Cron Jobs Bypassing Service Layer

**Issue**: Cron jobs directly use Prisma instead of services

**Current Pattern**:
```typescript
// cron/daily-pa.cron.ts
const characters = await prisma.character.findMany({...});
await prisma.character.update({...});
```

**Problem**: Business logic duplicated between controllers/services and cron jobs

**Solution**: Cron jobs should call service methods

---

### 3.3 No Repository Pattern

**Issue**: Services directly use Prisma throughout

**Impact**:
- Hard to test (requires database)
- Difficult to switch ORMs if needed
- No abstraction for common queries

**Solution**: Consider repository pattern for common entities

---

## 4. Validation Issues

### 4.1 No Schema Validation Library

**Current State**: Manual validation in every controller

**Example**:
```typescript
if (!userId || !townId) {
  throw createHttpError(400, "userId and townId required");
}
```

**Issues**:
- Scattered validation logic
- Inconsistent error messages
- No type inference from validation
- Easy to forget edge cases

**Solution**: Implement Zod schemas for request validation

---

### 4.2 Inconsistent Validation

**Examples**:
- Some endpoints validate thoroughly
- Others skip validation
- Error messages vary in format

**Solution**: Centralized validation middleware with Zod

---

## 5. Error Handling Issues

### 5.1 Mixed Error Types

**Issue**: Services throw different types of errors

**Examples**:
```typescript
// http-errors
throw createHttpError(404, "Not found");

// Plain Error
throw new Error("Something went wrong");

// String
throw "Error message";
```

**Impact**: Inconsistent error responses

**Solution**: Standardize on custom error classes or http-errors throughout

---

### 5.2 Generic Error Messages

**Examples**:
```typescript
throw new Error("Error");
throw createHttpError(500, "Internal Server Error");
```

**Impact**: Difficult to debug issues

**Solution**: Provide descriptive, actionable error messages

---

## 6. Type Safety Issues

### 6.1 Loose Service Dependencies

**Issue**: Services sometimes inject dependencies, sometimes don't

**Example**:
```typescript
// CharacterService - uses injection (good)
export class CharacterService {
  constructor(private capabilityService: CapabilityService) {}
}

// ResourceService - no injection (inconsistent)
export class ResourceService {
  async getResources() {
    // Uses global prisma
  }
}
```

**Solution**: Consistent dependency injection pattern

---

### 6.2 Missing Type Definitions

**Issue**: Some DTOs and interfaces incomplete

**Examples**:
- Request/response types not always defined
- Prisma types used directly in controllers (coupling)

**Solution**: Define explicit DTO types for all API endpoints

---

## 7. Query Performance Issues

### 7.1 N+1 Queries Potential

**Issue**: Some endpoints may trigger N+1 queries

**Example**:
```typescript
// Gets characters, then loops to fetch related data
const characters = await prisma.character.findMany({...});
for (const char of characters) {
  const capabilities = await prisma.characterCapability.findMany({
    where: { characterId: char.id }
  });
}
```

**Solution**: Use Prisma's `include` or `select` to fetch related data upfront

---

### 7.2 Missing Indexes

**Issue**: Complex queries without supporting indexes

**Review Needed**: Analyze slow query logs and add indexes where beneficial

---

## 8. Testing Gaps

### 8.1 No Unit Tests

**Issue**: No test files found in repository

**Impact**:
- Refactoring is risky
- No regression detection
- Difficult to verify behavior

**Solution**: Add unit tests for services and utilities

---

### 8.2 No Integration Tests

**Issue**: No tests for API endpoints

**Solution**: Add integration tests for critical flows

---

## 9. Documentation Gaps

### 9.1 Missing API Documentation

**Issue**: No OpenAPI/Swagger documentation

**Impact**: Frontend developers must read code to understand API

**Solution**: Generate API docs from code or add Swagger

---

### 9.2 Incomplete Code Comments

**Issue**: Complex business logic not always explained

**Examples**:
- Why is PA limited to 4?
- What is "agony" state?
- How does hunger affect PA regeneration?

**Solution**: Add JSDoc comments for complex functions

---

## 10. Security Concerns

### 10.1 Session Configuration

**Current**: 1-hour session timeout
**Review Needed**: Is this appropriate for the use case?

---

### 10.2 Input Sanitization

**Review Needed**: Ensure user input is sanitized to prevent injection attacks

---

## Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Resource Stock Duplication | High | Low | **P0** |
| Character Include Duplication | Very High | Low | **P0** |
| Large Files (split) | High | Medium | **P1** |
| Schema Validation (Zod) | High | Medium | **P1** |
| Inconsistent Prisma Usage | Medium | Low | **P1** |
| Cron Jobs Service Layer | Medium | Medium | **P2** |
| Error Handling Standardization | Medium | Low | **P2** |
| Unit Tests | High | High | **P2** |
| Repository Pattern | Low | High | **P3** |
| API Documentation | Low | Medium | **P3** |

---

## Summary

**Total Issues Identified**: 32
**Critical (P0)**: 2
**High (P1)**: 5
**Medium (P2)**: 4
**Low (P3)**: 2

**Next**: See 03-TARGET-ARCHITECTURE.md for proposed solutions
