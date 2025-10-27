# Schema Audit - Detailed Findings

**Analysis Date:** 2025-10-27
**Scope:** All 34 Prisma models + 11 enums
**Method:** Full codebase search (backend/, bot/, shared/)

---

## 🚨 CRITICAL ISSUES

### 1. Unused Enum: CapabilityCategory ❌

**Location:** `backend/prisma/schema.prisma:113-118`

**Definition:**
```prisma
enum CapabilityCategory {
  HARVEST
  SPECIAL
  CRAFT // NEW
  SCIENCE // NEW
}
```

**Problem:**
- Defined in the `Capability` model (line 242)
- **ZERO usages** found in entire codebase
- Comments suggest it was intended for expansion (CRAFT, SCIENCE marked as NEW)

**Impact:** Low - Not breaking anything, but adds confusion and schema bloat

**Recommendation:**
- **Option A (Preferred):** Remove from schema if not planned for use
- **Option B:** Implement categorization logic if it serves a future purpose
- **Decision Required:** Does the capability categorization system add value?

---

## 🏗️ ARCHITECTURAL INCONSISTENCIES

### 2. Character Inventory Access Pattern Mismatch

**Context:** Character has multiple junction tables, but they're accessed differently:

| Junction Table | Access Pattern | Consistency |
|----------------|----------------|-------------|
| CharacterCapability | CharacterRepository | ✅ Correct |
| CharacterSkill | CharacterRepository | ✅ Correct |
| CharacterRole | CharacterRepository | ✅ Correct |
| CharacterInventory | Direct Prisma in ObjectService | ❌ Inconsistent |
| CharacterInventorySlot | Direct Prisma in ObjectService | ❌ Inconsistent |

**Files:**
- `backend/src/domain/repositories/characterRepository.ts` (capabilities, skills, roles)
- `backend/src/services/object.service.ts:105-170` (inventory direct access)

**Problem:**
- Breaks the repository abstraction pattern
- Character data access logic spread across multiple locations
- Harder to maintain and test

**Recommendation:**
Move inventory operations to `CharacterRepository` with methods like:
- `getInventory(characterId)`
- `addInventorySlot(characterId, objectTypeId)`
- `removeInventorySlot(slotId)`
- `getInventoryWithObjects(characterId)`

**Effort:** Medium (~2-3 hours, 1 file refactor, update service calls)

---

### 3. Daily Messaging Models - Mixed Patterns

**Context:** Daily messaging feature uses 4 models with inconsistent patterns:

| Model | Access Pattern | File |
|-------|----------------|------|
| DailyEventLog | Dedicated Service | `daily-event-log.service.ts` ✅ |
| WeatherMessage | Direct Prisma | `daily-message.service.ts` ❌ |
| WeatherMessageUsage | Direct Prisma | `daily-message.service.ts` ❌ |
| DailyMessageOverride | Direct Prisma | `daily-message.service.ts` ❌ |

**Problem:**
- `DailyEventLog` has its own service (good pattern)
- Weather models accessed directly in `DailyMessageService` (inconsistent)
- No centralized data access layer for weather data

**Recommendation (Choose One):**

**Option A - Repository Pattern:**
Create `WeatherRepository` with:
- `getRandomWeatherMessage(type, excludeIds)`
- `recordWeatherUsage(messageId, seasonStart)`
- `getOverride(townId, date)`
- `createOverride(townId, date, message, createdBy)`

**Option B - Service Consolidation:**
Merge `DailyEventLogService` functionality into `DailyMessageService` and keep direct Prisma

**Preferred:** Option A (consistency with repository pattern)
**Effort:** Medium (~3-4 hours)

---

### 4. Cost Models Scattered Across Services

**Context:** Project and Chantier cost tracking uses 4 specialized models:

| Model | Current Location | Usage Count |
|-------|------------------|-------------|
| ProjectResourceCost | ProjectService direct Prisma | ~15 |
| ProjectBlueprintResourceCost | ProjectService direct Prisma | ~8 |
| ProjectCraftType | ProjectService direct Prisma | ~12 |
| ChantierResourceCost | ChantierService direct Prisma | ~10 |

**Files:**
- `backend/src/services/project.service.ts`
- `backend/src/services/chantier.service.ts`

**Problem:**
- These models are only used within their parent services
- No abstraction layer - direct Prisma queries scattered throughout
- Cost calculation logic mixed with business logic

**Recommendation:**
Abstract cost operations into repositories:

**ProjectRepository additions:**
- `addResourceCost(projectId, resourceTypeId, quantity)`
- `contributeResources(projectId, resourceTypeId, quantity)`
- `getCraftTypes(projectId)`
- `addCraftType(projectId, craftType)`
- `getBlueprintCosts(projectId)`
- `contributeBlueprintResources(projectId, resourceTypeId, quantity)`

**ChantierRepository additions:**
- `addResourceCost(chantierId, resourceTypeId, quantity)`
- `contributeResources(chantierId, resourceTypeId, quantity)`
- `getResourceCosts(chantierId)`

**Effort:** Medium-High (~4-6 hours, affects multiple service methods)

---

## 📊 MODEL USAGE STATISTICS

### Tier 1 - Critical (100+ usages)
These are core to the application and should NEVER be removed:

- **Character:** 136 usages
  - Backend: 56 (CharacterRepository, services)
  - Bot: 80 (commands, utilities)
  - Status: ✅ Heavily used, has repository

- **Expedition:** 76 usages
  - Backend: 25 (ExpeditionRepository, services)
  - Bot: 51 (expedition commands)
  - Status: ✅ Heavily used, has repository

---

### Tier 2 - Primary (30-50 usages)
Essential features with high integration:

- **Town:** 42 usages
  - Backend: 5 (TownRepository)
  - Bot: 37 (location context, display)
  - Status: ✅ Has repository

- **Capability:** 39 usages
  - Backend: 25 (CapabilityRepository, services)
  - Bot: 14 (capability commands)
  - Status: ✅ Has repository

---

### Tier 3 - Secondary (10-30 usages)
Important features but more localized:

- **Chantier:** 25 usages (6 BE, 19 Bot)
- **Job:** 15 usages (15 BE, 0 Bot) - Backend only
- **Project:** 14 usages (1 BE, 13 Bot) - Mostly Bot
- **Skill:** 12 usages (4 BE, 8 Bot)

All have repositories ✅

---

### Tier 4 - Supporting (5-9 usages)
Specialized functionality:

- **User:** 9 usages (authentication, character ownership)
- **Session:** 7 usages (Express sessions)
- **ObjectType:** 7 usages (inventory system)
- **Guild:** 6 usages (Discord server config)
- **ExpeditionMember:** 6 usages (expedition roster)
- **EmojiConfig:** 6 usages (dynamic emoji system)

---

### Tier 5 - Minimal (1-4 usages)
Highly specialized or underutilized:

- **ResourceStock:** 4 usages (resource inventory - `backend/src/services/resource.service.ts`)
- **Role:** 4 usages (Discord role management)
- **ResourceType:** 3 usages (resource definitions)
- **ProjectResourceCost:** 3 usages (project costs)
- **DailyEventLog:** 3 usages (event history)
- **CharacterInventory:** 2 usages (inventory container)
- **FishingLootEntry:** 1 usage (fishing loot tables - only in CapabilityRepository)

**Note:** Low usage ≠ unused. These are often core data models with focused responsibilities.

---

## 📈 ENUM USAGE ANALYSIS

### Actively Used Enums ✅

| Enum | Usages | Primary Location | Notes |
|------|--------|------------------|-------|
| **ExpeditionStatus** | 32 | Backend only | PLANNING, LOCKED, DEPARTED, RETURNED |
| **LocationType** | 31 | Backend only | CITY, EXPEDITION (for ResourceStock) |
| **Direction** | 24 | Backend + Bot | Cross-layer enum (expedition pathfinding) |
| **SeasonType** | 10 | Backend + Bot | SUMMER, WINTER |
| **ProjectStatus** | 8 | Backend + Bot | ACTIVE, COMPLETED |
| **DailyEventType** | 7 | Backend only | Event log types |
| **CraftType** | 7 | Backend + Bot | TISSER, FORGER, MENUISER |
| **CapacityBonusType** | 5 | Backend only | Object bonuses |
| **ChantierStatus** | 4 | Backend only | PLAN, IN_PROGRESS, COMPLETED |
| **WeatherMessageType** | 2 | Backend only | Daily weather types |

---

### Unused Enums ❌

| Enum | Usages | Defined In | Issue |
|------|--------|------------|-------|
| **CapabilityCategory** | 0 | `Capability` model | Never referenced anywhere |

---

## 🗄️ REPOSITORY COVERAGE

### Models WITH Repositories (14 / 34 = 41%)

**Primary Domain Objects:**
1. **CharacterRepository** - 56 backend usages
2. **ExpeditionRepository** - 25 backend usages
3. **CapabilityRepository** - 25 backend usages
4. **JobRepository** - 15 backend usages
5. **ProjectRepository** - ~10 usages
6. **ChantierRepository** - ~8 usages
7. **TownRepository** - 5 backend usages
8. **SkillRepository** - 4 backend usages
9. **ResourceRepository** - 4 backend usages
10. **ObjectRepository** - ~5 usages
11. **GuildRepository**
12. **UserRepository**
13. **RoleRepository**
14. **SeasonRepository**

**Status:** ✅ Core models properly abstracted

---

### Models WITHOUT Repositories (20 / 34 = 59%)

**Cost/Junction Models (8) - Expected:**
- ProjectResourceCost, ProjectBlueprintResourceCost, ProjectCraftType (via ProjectService)
- ChantierResourceCost (via ChantierService)
- CharacterCapability, CharacterSkill, CharacterRole (via CharacterRepository) ✅
- ExpeditionMember, ExpeditionEmergencyVote (via ExpeditionRepository) ✅

**Inventory Models (2) - INCONSISTENT:**
- CharacterInventory (direct in ObjectService) ❌
- CharacterInventorySlot (direct in ObjectService) ❌

**Daily/Weather Models (4) - MIXED:**
- DailyEventLog (has own service) ✅
- WeatherMessage, WeatherMessageUsage, DailyMessageOverride (direct Prisma) ❌

**Bonus Models (3) - Expected:**
- ObjectSkillBonus, ObjectCapacityBonus, ObjectResourceConversion (domain-specific)

**Specialized Models (3) - Expected:**
- FishingLootEntry (via CapabilityRepository.getFishingLootEntries)
- EmojiConfig (direct in EmojiService - system config)
- Session (direct Prisma - Express middleware)

---

## 🎯 RECOMMENDATIONS

### Priority 1 - Must Fix (Before Next Release)

#### 1.1 Define or Remove CapabilityCategory Enum
- **Issue:** Enum exists but never used
- **Files:** `backend/prisma/schema.prisma:113-118, 242`
- **Effort:** Low (15 min if removing, 2-3 hours if implementing)
- **Decision Required:** Should capabilities be categorized?

---

### Priority 2 - Should Fix (Architecture Debt)

#### 2.1 Migrate CharacterInventory to CharacterRepository
- **Issue:** Breaks repository pattern consistency
- **Files:**
  - Source: `backend/src/services/object.service.ts:105-170`
  - Target: `backend/src/domain/repositories/characterRepository.ts`
- **Effort:** Medium (~2-3 hours)
- **Benefits:** Consistent data access, easier testing, clearer boundaries

#### 2.2 Consolidate Daily Messaging Data Access
- **Issue:** Mixed patterns (service vs direct Prisma)
- **Files:** `backend/src/services/daily-message.service.ts`
- **Effort:** Medium (~3-4 hours)
- **Options:** Create WeatherRepository OR merge into single service pattern

---

### Priority 3 - Could Improve (Refactoring Opportunities)

#### 3.1 Abstract Cost Models to Repositories
- **Issue:** Direct Prisma queries scattered in services
- **Files:** `project.service.ts`, `chantier.service.ts`
- **Effort:** Medium-High (~4-6 hours)
- **Benefits:** Cleaner services, reusable cost logic, easier to extend

#### 3.2 Document Repository Pattern Guidelines
- **Issue:** No formal documentation on when to use repositories vs direct access
- **Effort:** Low (~1 hour)
- **Benefits:** Consistency in future development

---

### Priority 4 - Nice to Have

#### 4.1 Review FishingLootEntry Placement
- **Current:** Only accessible via `CapabilityRepository.getFishingLootEntries()`
- **Only User:** `capabilities/PecherCapability.ts`
- **Consider:** Could be more general as `ResourceLootRepository`
- **Effort:** Low-Medium
- **Decision:** Is fishing loot a special case, or part of a larger loot system?

---

## 📁 KEY FILES TO REVIEW

### Schema Definition
- `backend/prisma/schema.prisma` - Full schema with 34 models and 11 enums

### Repository Pattern Examples
- `backend/src/domain/repositories/characterRepository.ts` - ✅ Good pattern
- `backend/src/domain/repositories/expeditionRepository.ts` - ✅ Good pattern
- `backend/src/domain/repositories/capabilityRepository.ts` - ✅ Good pattern

### Files Needing Refactoring
- `backend/src/services/object.service.ts:105-170` - CharacterInventory direct access
- `backend/src/services/daily-message.service.ts` - Weather models direct access
- `backend/src/services/project.service.ts` - Cost models direct access
- `backend/src/services/chantier.service.ts` - Cost models direct access

---

## 📋 NO DUPLICATES FOUND

**Good News:** After thorough analysis, **no duplicate models or enums** were detected.

Each model serves a distinct purpose:
- No duplicate character/user systems
- No duplicate resource tracking systems
- No overlapping expedition or project models
- Clear separation between ResourceType/ResourceStock/ChantierResourceCost/ProjectResourceCost

The schema is well-organized with clear domain boundaries.

---

## 🔄 NEXT STEPS

1. **Validate Findings:** Review this document with the team
2. **Decide on CapabilityCategory:** Implement or remove (blocks Priority 1)
3. **Create Action Plan:** Prioritize fixes based on timeline and resources (`02-ACTION-PLAN.md`)
4. **Execute Fixes:** Track progress in `03-PROGRESS.md`
5. **Update Documentation:** Document repository pattern guidelines

---

**Last Updated:** 2025-10-27
**Status:** Ready for Validation
**Next Phase:** Planning (requires stakeholder input on CapabilityCategory)
