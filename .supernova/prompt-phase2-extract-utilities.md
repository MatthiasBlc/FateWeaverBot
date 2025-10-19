# Supernova Task: Phase 2 - Replace Duplicated Logic with Utility Classes

## Context
We've created utility classes to eliminate duplicated business logic:
- `ResourceUtils` - Resource and stock operations
- `CharacterUtils` - Character lookups and validations

Located in: `backend/src/shared/utils/`

## Objective
Replace ALL duplicated resource and character utility patterns with centralized utility methods.

## Files to Process

### Priority 1:
1. `backend/src/services/capability.service.ts`
2. `backend/src/services/character.service.ts`
3. `backend/src/controllers/characters.ts`
4. `backend/src/controllers/towns.ts`

### Priority 2:
5. `backend/src/services/expedition.service.ts`
6. `backend/src/services/resource.service.ts`
7. `backend/src/controllers/resources.ts`
8. `backend/src/cron/daily-pa.cron.ts`
9. All other files with resource or character lookups

## Replacement Patterns

### Pattern 1: Get Resource Type by Name (CRITICAL - 10+ occurrences)

**Find:**
```typescript
const vivresType = await prisma.resourceType.findUnique({
  where: { name: "Vivres" }
});

if (!vivresType) {
  throw new Error("Resource type 'Vivres' not found");
}
```

**Replace with:**
```typescript
const vivresType = await ResourceUtils.getResourceTypeByName("Vivres");
```

**Import to add:**
```typescript
import { ResourceUtils } from "../shared/utils";
```

### Pattern 2: Get Active Character (8+ occurrences)

**Find:**
```typescript
const character = await prisma.character.findFirst({
  where: { userId, townId, isActive: true, isDead: false },
  ...CharacterQueries.fullInclude()
});

if (!character) {
  throw new Error("No active character found");
}
```

**Replace with:**
```typescript
const character = await CharacterUtils.getActiveCharacterOrThrow(userId, townId);
```

**Import to add:**
```typescript
import { CharacterUtils } from "../shared/utils";
```

### Pattern 3: Get User by Discord ID (6+ occurrences)

**Find:**
```typescript
const user = await prisma.user.findUnique({
  where: { discordId }
});

if (!user) {
  throw new Error("User not found");
}
```

**Replace with:**
```typescript
const user = await CharacterUtils.getUserByDiscordIdOrThrow(discordId);
```

### Pattern 4: Validate PA Usage (6+ occurrences)

**Find:**
```typescript
if (character.hp <= 1) {
  throw new Error("Personnage en agonie");
}

if (character.pm <= 1 && character.paUsedToday + paRequired > 1) {
  throw new Error("Déprime");
}

if (character.paTotal < paRequired) {
  throw new Error("Pas assez de PA");
}
```

**Replace with:**
```typescript
await CharacterUtils.validateCanUsePA(character, paRequired);
```

**Note:** This method already exists in `util/character-validators.ts` as `validateCanUsePA`. We're consolidating it into CharacterUtils for consistency.

### Pattern 5: Resource Stock Upsert (5+ occurrences)

**Find:**
```typescript
await prisma.resourceStock.upsert({
  where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
  update: { quantity: { increment: amount } },
  create: { locationType, locationId, resourceTypeId, quantity: amount }
});
```

**Replace with:**
```typescript
await ResourceUtils.upsertStock(locationType, locationId, resourceTypeId, amount);
```

### Pattern 6: Get Resource Stock (multiple occurrences)

**Find:**
```typescript
const stock = await prisma.resourceStock.findUnique({
  where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
  ...ResourceQueries.withResourceType()
});
```

**Replace with:**
```typescript
const stock = await ResourceUtils.getStock(locationType, locationId, resourceTypeId);
```

### Pattern 7: Decrement Resource Stock

**Find:**
```typescript
await prisma.resourceStock.update({
  where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
  data: { quantity: { decrement: amount } }
});
```

**Replace with:**
```typescript
await ResourceUtils.decrementStock(locationType, locationId, resourceTypeId, amount);
```

### Pattern 8: Get All Resources for Location

**Find:**
```typescript
await prisma.resourceStock.findMany({
  ...ResourceQueries.byLocation(locationType, locationId)
});
```

**Replace with:**
```typescript
await ResourceUtils.getAllStockForLocation(locationType, locationId);
```

## Instructions

For each file:

1. **Add imports** at the top:
   ```typescript
   import { ResourceUtils, CharacterUtils } from "../shared/utils";
   ```
   Or adjust path based on file location:
   - From `services/`: `../shared/utils`
   - From `controllers/`: `../shared/utils`
   - From `cron/`: `../shared/utils`

2. **Find and replace** each duplicated pattern systematically

3. **Remove old imports** if no longer needed:
   - Remove `prisma` import if only used for replaced patterns
   - Keep `prisma` if still used for transactions or other queries

4. **Verify compilation** after each file:
   ```bash
   npm run typecheck
   ```

## Special Cases

### Case 1: Transaction Context
If the pattern is inside a Prisma transaction (`tx`), we CANNOT use utils (they use global prisma).

**Keep as-is:**
```typescript
await prisma.$transaction(async (tx) => {
  // Must use tx.resourceStock, NOT ResourceUtils
  await tx.resourceStock.upsert({ ... });
});
```

### Case 2: Optional Resource Types
For patterns that check if resource exists but don't throw:

**Find:**
```typescript
const type = await prisma.resourceType.findUnique({ where: { name } });
if (type) {
  // do something
}
```

**Replace with:**
```typescript
const type = await ResourceUtils.getResourceTypeByNameOrNull(name);
if (type) {
  // do something
}
```

### Case 3: PA Validation from character-validators.ts
The existing `validateCanUsePA` in `util/character-validators.ts` should be deprecated in favor of `CharacterUtils.validateCanUsePA`.

Update imports from:
```typescript
import { validateCanUsePA } from "../util/character-validators";
```

To:
```typescript
import { CharacterUtils } from "../shared/utils";
// Then use: await CharacterUtils.validateCanUsePA(character, paRequired);
```

## Success Criteria

- [ ] All resource type lookups use `ResourceUtils.getResourceTypeByName()`
- [ ] All active character lookups use `CharacterUtils.getActiveCharacterOrThrow()`
- [ ] All user lookups use `CharacterUtils.getUserByDiscordIdOrThrow()`
- [ ] All PA validations use `CharacterUtils.validateCanUsePA()`
- [ ] All resource stock operations use `ResourceUtils` methods
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No functionality changes (pure refactoring)

## Report Format

Create: `.supernova/report-phase2-extract-utilities.md`

### Section 1: Summary (≤300 tokens)
- Total files modified
- Total replacements made by pattern type
- Any issues encountered
- Verification status

### Section 2: Detailed Changes
For each file:
- File path
- Patterns replaced (with counts)
- Special notes

### Section 3: Metrics
- Duplicated logic eliminated
- Import statements changed
- Transaction contexts preserved (not modified)

## Estimated Effort
- Priority 1: 1-2 hours (4 files, ~30 replacements)
- Priority 2: 1-2 hours (5+ files, ~20 replacements)
- **Total: 2-4 hours**
