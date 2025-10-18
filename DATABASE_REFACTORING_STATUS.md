# Database Refactoring Status Report

## ✅ Completed Tasks

### Phase 1.1: Character.isActive Constraint
- ✅ Removed outdated comments from schema
- ✅ Added partial unique index via raw SQL: `CREATE UNIQUE INDEX one_active_per_user_town ON "Character" (user_id, town_id) WHERE is_active = true`
- ✅ Added performance indexes: `isDead`, `pm`, `jobId`, composite `[userId, townId, isActive, isDead]`

### Phase 1.2: ResourceStock FK Cleanup
- ✅ Removed optional `townId` and `expeditionId` foreign keys from ResourceStock schema
- ✅ Removed `resourceStocks` relation arrays from Town and Expedition models
- ✅ Removed FK-setting logic from `controllers/resources.ts` (addResource, updateResource)
- ✅ Removed FK-setting logic from `controllers/towns.ts` (all townId references)
- ✅ Removed FK-setting logic from `services/project.service.ts` (project output creation)

### Phase 2.1: CharacterRole Redundancy Cleanup
- ✅ Removed `username` and `roleName` fields from CharacterRole schema
- ✅ Removed field usage in `controllers/roles.ts` (updateCharacterRoles)
- ✅ Removed field usage in `controllers/characters.ts` (upsertCharacter)

### Phase 4.1: Performance Indexes
- ✅ Added indexes to Expedition: `[status]`, `[status, pendingEmergencyReturn]`, `[townId, status]`, `[status, returnAt]`
- ✅ Added indexes to Project: `[status]`, `[townId, status]`
- ✅ Added indexes to Chantier: `[status]`, `[townId, status]`
- ✅ Added index to DailyEventLog: `[townId]`

### Phase 1.3: Project Relations
- ✅ Added missing `outputResourceType` relation from Project to ResourceType
- ✅ Added corresponding `projectOutputs` relation in ResourceType

### Migration
- ✅ Prisma migration created and applied
- ✅ Prisma client regenerated

---

## ⚠️ Remaining TypeScript Errors to Fix

### 1. **towns.ts - resourceStocks relation removed (18 errors)**

The `resourceStocks` relation no longer exists in the Prisma schema. Code needs to be refactored to:
- Remove `resourceStocks` from all `include` clauses
- Query `ResourceStock` separately using `locationType` and `locationId`

**Files affected:**
- `/backend/src/controllers/towns.ts` (lines 24, 39, 78, 132, 158, 169, 221, 241, 252, 270, 283, 321, 384, 395, 401)

**Solution:** Replace:
```typescript
const town = await prisma.town.findUnique({
  where: { id },
  include: {
    resourceStocks: { include: { resourceType: true } }
  }
});
const vivresStock = town.resourceStocks.find(stock => stock.resourceType.name === "Vivres");
```

With:
```typescript
const town = await prisma.town.findUnique({
  where: { id }
});
const resourceStocks = await prisma.resourceStock.findMany({
  where: { locationType: "CITY", locationId: id },
  include: { resourceType: true }
});
const vivresStock = resourceStocks.find(stock => stock.resourceType.name === "Vivres");
```

### 2. **capability.service.ts - expedition relation query (1 error)**

Line 941 tries to query ResourceStock with `expedition: { townId }` which no longer exists.

**Solution:** Query by `locationType: "EXPEDITION"` and join separately if needed.

### 3. **character.service.ts - CharacterWithDetails type (2 errors)**

The custom type `CharacterWithDetails` still includes `username` and `roleName` in characterRoles.

**File:** `/backend/src/services/character.service.ts` (lines 59-73)

**Solution:** Update type definition:
```typescript
export type CharacterWithDetails = Character & {
  user: User;
  town: Town & { guild: Guild };
  characterRoles: Array<{
    id: string;
    characterId: string;
    roleId: string;
    assignedAt: Date;
    // REMOVED: username, roleName
    role: {
      id: string;
      discordId: string;
      name: string;
      color: string | null;
    };
  }>;
};
```

---

## 📋 Remaining Tasks (Not Started)

### Phase 1.1: Error Handling
- [ ] Add try/catch for unique constraint violations (P2002 error code)
- [ ] Implement graceful error messages in character.service.ts and characters.ts

### Phase 1.3: Project Output Validation
- [ ] Add validation logic in project.service.ts createProject()
- [ ] Ensure exactly one of `outputResourceTypeId` OR `outputObjectTypeId` is set
- [ ] Update backend controller to accept `outputObjectTypeId`

### Phase 1.3: Object-Output Project Completion
- [ ] Implement TODO in project.service.ts line 399
- [ ] Add object to character inventory when project completes with object output

### Phase 3: FishingLootEntry FK Migration (Deferred)
- [ ] Add `resourceTypeId` and `objectTypeId` FK columns to FishingLootEntry
- [ ] Create data migration to populate FKs from `resourceName` strings
- [ ] Update fishing logic in capability.service.ts to use FKs instead of name lookup
- [ ] Drop `resourceName` column

---

## 🚨 Immediate Next Steps

1. **Fix TypeScript compilation errors** (blocking deployment):
   - Fix `towns.ts` resourceStocks queries (18 errors)
   - Fix `capability.service.ts` expedition query (1 error)
   - Update `CharacterWithDetails` type (2 errors)

2. **Test the application**:
   - Run build: `npm run build`
   - Start services: `docker compose up -d`
   - Test character creation (unique constraint)
   - Test resource operations (polymorphic queries)
   - Test project creation/completion

3. **Implement remaining validation logic** (non-blocking):
   - Project output validation
   - Object-output completion
   - Error handling for unique constraints

---

## 📊 Progress Summary

- **Completed:** 15/22 tasks (68%)
- **TypeScript Errors:** 21 remaining
- **Critical Path:** Fix TypeScript errors → Test → Deploy
- **Deferred:** FishingLootEntry FK migration (Phase 3)

---

**Last Updated:** 2025-10-18
**Migration Applied:** database_refactoring_phase1_indexes_and_cleanup
