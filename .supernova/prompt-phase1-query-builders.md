# Supernova Task: Phase 1 - Replace Duplicated Query Patterns with Query Builders

## Context
We've created query builder classes to eliminate code duplication in Prisma queries. These are located in:
`backend/src/infrastructure/database/query-builders/`

Query builders available:
- `CharacterQueries` - Character include patterns
- `ResourceQueries` - Resource stock queries
- `ProjectQueries` - Project includes
- `ExpeditionQueries` - Expedition includes
- `ChantierQueries` - Chantier includes

## Objective
Replace ALL duplicated Prisma include patterns throughout the backend with query builder methods.

## Files to Process

### Priority 1 (Highest Duplication):
1. `backend/src/services/character.service.ts` (1,157 LOC)
2. `backend/src/controllers/characters.ts` (1,023 LOC)
3. `backend/src/services/capability.service.ts`
4. `backend/src/controllers/towns.ts`
5. `backend/src/services/expedition.service.ts`
6. `backend/src/controllers/expedition.ts`

### Priority 2:
7. `backend/src/services/resource.service.ts`
8. `backend/src/controllers/resources.ts`
9. `backend/src/services/project.service.ts`
10. `backend/src/controllers/projects.ts`
11. `backend/src/services/chantier.service.ts`
12. `backend/src/controllers/chantiers.ts`
13. `backend/src/cron/daily-pa.cron.ts`
14. `backend/src/cron/expedition.cron.ts`

## Replacement Patterns

### Pattern 1: Character Full Include
**Find:**
```typescript
include: {
  user: true,
  town: { include: { guild: true } },
  characterRoles: { include: { role: true } },
  job: {
    include: {
      startingAbility: true,
      optionalAbility: true,
    },
  },
}
```

**Replace with:**
```typescript
...CharacterQueries.fullInclude()
```

**Import to add:**
```typescript
import { CharacterQueries } from "../infrastructure/database/query-builders";
```

### Pattern 2: Character with Capabilities Only
**Find:**
```typescript
include: {
  user: true,
  town: { include: { guild: true } },
  characterRoles: { include: { role: true } },
  job: true,
}
```

**Replace with:**
```typescript
...CharacterQueries.withCapabilities()
```

### Pattern 3: Resource Stock Where Clause
**Find:**
```typescript
where: {
  locationType_locationId_resourceTypeId: {
    locationType: "CITY",  // or "EXPEDITION"
    locationId: someId,
    resourceTypeId: resourceId,
  },
}
```

**Replace with:**
```typescript
where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId)
```

**Import to add:**
```typescript
import { ResourceQueries } from "../infrastructure/database/query-builders";
```

### Pattern 4: Resource Stock with Resource Type
**Find:**
```typescript
where: {
  locationType_locationId_resourceTypeId: {
    locationType,
    locationId,
    resourceTypeId
  }
},
include: { resourceType: true }
```

**Replace with:**
```typescript
where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
...ResourceQueries.withResourceType()
```

### Pattern 5: Project Full Include
**Find:**
```typescript
include: {
  craftTypes: true,
  resourceCosts: { include: { resourceType: true } },
  outputResourceType: true,
  outputObjectType: true,
  town: true
}
```

**Replace with:**
```typescript
...ProjectQueries.fullInclude()
```

### Pattern 6: Expedition with Members
**Find:**
```typescript
include: {
  members: {
    include: {
      character: {
        include: { user: true }
      }
    }
  }
}
```

**Replace with:**
```typescript
...ExpeditionQueries.withMembers()
```

### Pattern 7: Chantier with Resource Costs
**Find:**
```typescript
include: {
  resourceCosts: {
    include: { resourceType: true }
  }
}
```

**Replace with:**
```typescript
...ChantierQueries.withResourceCosts()
```

## Instructions

For each file:

1. **Add imports** at the top (adjust path based on file location):
   ```typescript
   import { CharacterQueries, ResourceQueries, ProjectQueries, ExpeditionQueries, ChantierQueries } from "../infrastructure/database/query-builders";
   ```
   Or individual imports:
   ```typescript
   import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";
   ```

2. **Find and replace** each duplicated pattern with the corresponding query builder method

3. **Use spread operator** (`...`) to apply the query builder result:
   ```typescript
   // Before
   const char = await prisma.character.findFirst({
     where: { id },
     include: { user: true, town: { include: { guild: true } } }
   });

   // After
   const char = await prisma.character.findFirst({
     where: { id },
     ...CharacterQueries.baseInclude()
   });
   ```

4. **Verify compilation** after each file:
   ```bash
   npm run typecheck
   ```

## Success Criteria

- [ ] All duplicated include patterns replaced
- [ ] All duplicated where clauses for resource stocks replaced
- [ ] Imports added correctly to all modified files
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No functionality changes (pure refactoring)

## Report Format

Create: `backend/.supernova/report-phase1-query-builders.md`

### Section 1: Summary (≤300 tokens)
- Total files modified
- Total replacements made
- Any issues encountered
- Verification status (typecheck, build)

### Section 2: Detailed Changes
For each file:
- File path
- Number of replacements
- Patterns replaced
- Any special notes

### Section 3: Before/After Metrics
- Lines of code before/after (should be similar or slightly less)
- Duplicated patterns eliminated
- Import statements added

## Important Notes

1. **Path adjustments**: Adjust import paths based on file location
   - From `services/`: `../infrastructure/database/query-builders`
   - From `controllers/`: `../infrastructure/database/query-builders`
   - From `cron/`: `../infrastructure/database/query-builders`

2. **Preserve logic**: Only replace include/where patterns, don't modify business logic

3. **Test after completion**: Manual verification of critical endpoints recommended

4. **Commit strategy**: Commit after each priority group
   - Commit 1: Priority 1 files (character & capability related)
   - Commit 2: Priority 2 files (other services & controllers)

## Estimated Effort
- Priority 1: 2-3 hours (6 files, ~15-20 replacements each)
- Priority 2: 1-2 hours (8 files, ~5-10 replacements each)
- **Total: 3-5 hours**
