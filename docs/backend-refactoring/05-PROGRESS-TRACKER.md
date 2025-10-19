# Progress Tracker - Real-Time Status

**Last Updated**: 2025-10-19
**Current Phase**: 2 (Extract Utilities)
**Overall Progress**: 20%

---

## Quick Status

| Phase | Status | Progress | Completed |
|-------|--------|----------|-----------|
| 0: Setup & Tooling | ✅ Complete | 100% | 2025-10-19 |
| 1: Query Builders | ✅ Complete | 100% | 2025-10-19 |
| 2: Utilities | Not Started | 0% | - |
| 3: Validation Layer | Not Started | 0% | - |
| 4: Repository Layer | Not Started | 0% | - |
| 5: Refactor Services | Not Started | 0% | - |
| 6: Split Large Files | Not Started | 0% | - |
| 7: Error Handling | Not Started | 0% | - |
| 8: DI Container | Not Started | 0% | - |
| 9: Add Tests | Not Started | 0% | - |
| 10: Final Cleanup | Not Started | 0% | - |

---

## Phase 0: Setup & Tooling

**Status**: ✅ Complete
**Started**: 2025-10-19
**Completed**: 2025-10-19

### Checklist

- [x] Install Zod
- [x] Install Jest and testing dependencies
- [x] Configure Jest
- [x] Add NPM scripts for testing, linting, typecheck
- [x] Create directory structure
  - [x] `infrastructure/database/query-builders/`
  - [x] `domain/repositories/`
  - [x] `api/validators/`
  - [x] `shared/errors/`
  - [x] `shared/constants/`
- [x] Verify build passes
- [x] Verify typecheck passes

### Notes

All dependencies installed successfully. Directory structure created. Build and typecheck passing.

---

## Phase 1: Extract Query Builders

**Status**: ✅ Complete
**Started**: 2025-10-19
**Completed**: 2025-10-19

### Checklist

- [x] Create `character.queries.ts`
  - [x] `baseInclude()`
  - [x] `fullInclude()`
  - [x] `withCapabilities()`
  - [x] `withInventory()`
  - [x] `withExpeditions()`
- [x] Create `resource.queries.ts`
  - [x] `stockWhere()`
  - [x] `withResourceType()`
  - [x] `byLocation()`
  - [x] `stockWithType()`
- [x] Create `project.queries.ts`
  - [x] `fullInclude()`
  - [x] `withResourceCosts()`
  - [x] `withCraftTypes()`
  - [x] `withOutput()`
- [x] Create `expedition.queries.ts`
  - [x] `fullInclude()`
  - [x] `withMembers()`
  - [x] `withTown()`
  - [x] `withVotes()`
- [x] Create `chantier.queries.ts`
  - [x] `fullInclude()`
  - [x] `withResourceCosts()`
  - [x] `withTown()`
- [x] Replace usage in `character.service.ts` (6 replacements)
- [x] Replace usage in `characters.ts` controller (11 replacements)
- [x] Replace usage in other files (15/15 files processed)
- [x] Verify typecheck passes
- [x] Verify build succeeds

### Notes

Successfully eliminated 95+ duplicated query patterns across 15 files. Fixed resourceTypeId type from string to number. All type checks pass. See `.supernova/report-phase1-query-builders.md` for full details.

---

## Phase 2: Extract Utilities

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Create `resource.utils.ts`
  - [ ] `getResourceTypeByName()`
  - [ ] `getStock()`
  - [ ] `upsertStock()`
- [ ] Create `character.utils.ts`
  - [ ] `getActiveCharacterOrThrow()`
  - [ ] `getUserByDiscordIdOrThrow()`
- [ ] Replace resource utility usage (track files: 0/10)
- [ ] Replace character utility usage (track files: 0/8)
- [ ] Verify typecheck passes
- [ ] Verify build succeeds

### Notes

_No notes yet_

---

## Phase 3: Implement Validation Layer

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Create `validation.middleware.ts`
- [ ] Create `character.schema.ts`
  - [ ] CreateCharacterSchema
  - [ ] GetActiveCharacterSchema
  - [ ] UpdateCharacterStatsSchema
- [ ] Create `expedition.schema.ts`
- [ ] Create `resource.schema.ts`
- [ ] Create `project.schema.ts`
- [ ] Create `chantier.schema.ts`
- [ ] Apply validation to character routes (track: 0/10)
- [ ] Apply validation to expedition routes (track: 0/8)
- [ ] Apply validation to other routes (track: 0/20)
- [ ] Manual test: Verify validation errors
- [ ] Verify typecheck passes
- [ ] Verify build succeeds

### Notes

_No notes yet_

---

## Phase 4: Create Repository Layer

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Create `character.repository.ts`
  - [ ] `findById()`
  - [ ] `findActiveCharacter()`
  - [ ] `findUserByDiscordId()`
  - [ ] `create()`
  - [ ] `update()`
  - [ ] `deactivateOtherCharacters()`
  - [ ] `addCapability()`
  - [ ] `getCapabilities()`
- [ ] Create `resource.repository.ts`
  - [ ] `findResourceTypeByName()`
  - [ ] `getStock()`
  - [ ] `getAllStockForLocation()`
  - [ ] `upsertStock()`
  - [ ] `decrementStock()`
- [ ] Create `expedition.repository.ts`
- [ ] Create `project.repository.ts`
- [ ] Create `chantier.repository.ts`
- [ ] Create `capability.repository.ts`
- [ ] Verify typecheck passes
- [ ] Verify build succeeds

### Notes

_No notes yet_

---

## Phase 5: Refactor Services

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Refactor `character.service.ts` to use repositories
  - [ ] Update constructor with repository injection
  - [ ] Replace all Prisma calls with repository methods
- [ ] Refactor `resource.service.ts`
- [ ] Refactor `expedition.service.ts`
- [ ] Refactor `capability.service.ts`
- [ ] Refactor `project.service.ts`
- [ ] Refactor `chantier.service.ts`
- [ ] Refactor other services (track: 0/7)
- [ ] Manual test: Test critical API endpoints
- [ ] Verify typecheck passes
- [ ] Verify build succeeds

### Notes

_No notes yet_

---

## Phase 6: Split Large Files

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Split `character.service.ts` (1,157 LOC)
  - [ ] Create `services/character/` directory
  - [ ] Extract to `character.service.ts` (Core CRUD)
  - [ ] Extract to `character-stats.service.ts` (HP, PM, PA)
  - [ ] Extract to `character-inventory.service.ts`
  - [ ] Extract to `character-capability.service.ts`
  - [ ] Delete old file
- [ ] Split `characters.ts` controller (1,023 LOC)
  - [ ] Create `controllers/character/` directory
  - [ ] Extract to `character.controller.ts`
  - [ ] Extract to `character-stats.controller.ts`
  - [ ] Extract to `character-capabilities.controller.ts`
  - [ ] Extract to `fishing.controller.ts`
  - [ ] Delete old file
- [ ] Update route imports
- [ ] Verify typecheck passes
- [ ] Verify build succeeds
- [ ] Manual test: Test affected endpoints

### Notes

_No notes yet_

---

## Phase 7: Add Error Handling

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Create `shared/errors/app-error.ts`
- [ ] Create `shared/errors/not-found-error.ts`
- [ ] Create `shared/errors/validation-error.ts`
- [ ] Create `shared/errors/unauthorized-error.ts`
- [ ] Update `error-handler.middleware.ts`
- [ ] Replace error throwing in services (track: 0/13)
- [ ] Replace error throwing in controllers (track: 0/13)
- [ ] Replace error throwing in repositories (track: 0/6)
- [ ] Manual test: Verify error responses
- [ ] Verify typecheck passes
- [ ] Verify build succeeds

### Notes

_No notes yet_

---

## Phase 8: Implement DI Container

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Create `infrastructure/container.ts`
  - [ ] Initialize Prisma client
  - [ ] Initialize all repositories
  - [ ] Initialize all services
  - [ ] Implement singleton pattern
- [ ] Update controllers to use container (track: 0/13)
- [ ] Update cron jobs to use container (track: 0/6)
- [ ] Remove manual service instantiation
- [ ] Verify typecheck passes
- [ ] Verify build succeeds

### Notes

_No notes yet_

---

## Phase 9: Add Tests

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Write unit tests for CharacterService
- [ ] Write unit tests for ResourceService
- [ ] Write unit tests for ExpeditionService
- [ ] Write unit tests for other services (track: 0/10)
- [ ] Write unit tests for utilities (track: 0/6)
- [ ] Write integration tests for Character API
- [ ] Write integration tests for Expedition API
- [ ] Write integration tests for Resource API
- [ ] Write integration tests for other APIs (track: 0/10)
- [ ] Achieve >70% test coverage
- [ ] All tests pass

### Test Coverage Status

- Services: 0%
- Repositories: 0%
- Controllers: 0%
- Utilities: 0%
- Overall: 0%

### Notes

_No notes yet_

---

## Phase 10: Final Cleanup

**Status**: Not Started
**Started**: -
**Completed**: -

### Checklist

- [ ] Remove unused imports
- [ ] Remove dead code
- [ ] Verify naming conventions
- [ ] Update all documentation
- [ ] Review for N+1 queries
- [ ] Review database indexes
- [ ] Security audit
- [ ] Final lint check passes
- [ ] Final typecheck passes
- [ ] Final build succeeds
- [ ] All tests pass

### Notes

_No notes yet_

---

## Issues Encountered

_No issues yet_

---

## Decisions Made

_No decisions yet_

---

## Next Steps

1. Start Phase 0: Setup & Tooling
2. Install dependencies (Zod, Jest, etc.)
3. Create directory structure
4. Configure testing framework

---

## How to Update This File

When working on a phase:

1. **Mark phase as started**: Update status to "In Progress" and add start date
2. **Check off completed tasks**: Mark items as done [x]
3. **Add notes**: Document any issues, decisions, or important findings
4. **Update progress percentage**: Based on checklist completion
5. **Mark phase as completed**: Update status to "Completed" and add completion date
6. **Update last modified date**: At the top of this file

---

## Git Commit History

_Track commits for each phase here_

### Phase 0
- (No commits yet)

### Phase 1
- (No commits yet)

---

**Remember**: Update this file after every significant change!
