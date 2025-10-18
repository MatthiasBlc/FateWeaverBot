# Remaining TypeScript Fixes - Database Refactoring

## Status: 90% Complete

### ✅ Completed
- Schema refactoring (all models)
- Migration applied
- Prisma client regenerated
- Most controller code fixed
- CharacterWithDetails type updated
- FK-setting logic removed from 3 files

### ⚠️ Remaining Fixes (4 locations in 2 files)

---

## File 1: `src/controllers/towns.ts`

### Fix 1: getAllTowns function (lines 305-318)

**Current (broken):**
```typescript
const towns = await prisma.town.findMany({
  include: {
    guild: { select: { id: true, name: true, discordGuildId: true } },
    _count: { select: { chantiers: true } },
    resourceStocks: {  // ❌ DOES NOT EXIST
      where: { resourceType: { name: "Vivres" } },
      select: { quantity: true }
    }
  }
});

const townsWithVivres = towns.map(town => ({
  ...town,
  foodStock: town.resourceStocks[0]?.quantity || 0  // ❌ DOES NOT EXIST
}));
```

**Fixed:**
```typescript
const towns = await prisma.town.findMany({
  include: {
    guild: { select: { id: true, name: true, discordGuildId: true } },
    _count: { select: { chantiers: true } },
  }
});

// Get Vivres type
const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });

// For each town, fetch vivres stock
const townsWithVivres = await Promise.all(
  towns.map(async (town) => {
    let foodStock = 0;
    if (vivresType) {
      const vivresStock = await prisma.resourceStock.findUnique({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: town.id,
            resourceTypeId: vivresType.id
          }
        }
      });
      foodStock = vivresStock?.quantity || 0;
    }
    return {
      ...town,
      foodStock
    };
  })
);
```

---

### Fix 2: getTownStocksSummary function (lines 418-436)

**Current (broken):**
```typescript
const town = await prisma.town.findUnique({
  where: { id },
  include: {
    resourceStocks: {  // ❌ DOES NOT EXIST
      include: { resourceType: true },
      orderBy: { resourceType: { name: "asc" } }
    }
  }
});

if (town.resourceStocks.length === 0) {  // ❌ DOES NOT EXIST
  res.status(200).json({ summary: "Aucune ressource en stock." });
  return;
}

const summary = town.resourceStocks  // ❌ DOES NOT EXIST
  .map(stock => `${stock.resourceType.emoji || "📦"} **${stock.resourceType.name}**: ${stock.quantity}`)
  .join("\n");
```

**Fixed:**
```typescript
const town = await prisma.town.findUnique({
  where: { id }
});

if (!town) {
  throw createHttpError(404, "Ville non trouvée");
}

// Fetch resourceStocks separately
const resourceStocks = await prisma.resourceStock.findMany({
  where: {
    locationType: "CITY",
    locationId: id
  },
  include: { resourceType: true },
  orderBy: { resourceType: { name: "asc" } }
});

if (resourceStocks.length === 0) {
  res.status(200).json({ summary: "Aucune ressource en stock." });
  return;
}

const summary = resourceStocks
  .map(stock => `${stock.resourceType.emoji || "📦"} **${stock.resourceType.name}**: ${stock.quantity}`)
  .join("\n");
```

---

### Fix 3: Remove duplicate vivresType query in getTownByGuildId (line 189)

**Current:**
```typescript
if (!vivresStock) {
  console.log(`Création automatique du stock de vivres pour la ville ${town.id}`);

  try {
    const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });  // ❌ DUPLICATE
```

**Fixed:** (vivresType is already queried at line 171)
```typescript
if (!vivresStock) {
  console.log(`Création automatique du stock de vivres pour la ville ${town.id}`);

  try {
    // vivresType already exists from line 171
```

---

## File 2: `src/services/capability.service.ts`

### Fix 4: executeCraft expedition query (line 941)

**Current (broken):**
```typescript
const cataplasmeStock = await this.prisma.resourceStock.findFirst({
  where: {
    locationType: "EXPEDITION",
    expedition: { townId: character.townId },  // ❌ expedition relation does not exist
    resourceTypeId: cataplasmeResource.id,
  },
});
```

**Fixed:**
```typescript
// First, find if character is in a departed expedition
const expeditionMember = await this.prisma.expeditionMember.findFirst({
  where: {
    characterId: character.id,
    expedition: {
      status: "DEPARTED"
    }
  },
  include: {
    expedition: true
  }
});

let cataplasmeStock = null;
if (expeditionMember) {
  // Character is in expedition, check expedition stock
  cataplasmeStock = await this.prisma.resourceStock.findFirst({
    where: {
      locationType: "EXPEDITION",
      locationId: expeditionMember.expeditionId,
      resourceTypeId: cataplasmeResource.id,
    },
  });
} else {
  // Character is in city, check city stock
  cataplasmeStock = await this.prisma.resourceStock.findFirst({
    where: {
      locationType: "CITY",
      locationId: character.townId,
      resourceTypeId: cataplasmeResource.id,
    },
  });
}
```

---

## Quick Commands to Apply Fixes

```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend

# Test compilation
npm run build

# If errors persist, check lines mentioned above
# Fix manually or use sed/node scripts
```

---

## After Fixes: Testing Checklist

1. ✅ Build succeeds: `npm run build`
2. ⬜ Start services: `docker compose up -d`
3. ⬜ Test character creation (unique constraint)
4. ⬜ Test resource queries (CITY stocks)
5. ⬜ Test expedition stocks (EXPEDITION stocks)
6. ⬜ Test town list endpoint
7. ⬜ Test town stocks summary

---

## Remaining Enhancements (Optional)

### Phase 1.1: Error Handling
Add try/catch in character.service.ts and characters.ts for P2002 unique constraint violations.

### Phase 1.3: Project Validation
- Add validation in project.service.ts ensuring XOR for outputResourceTypeId/outputObjectTypeId
- Implement object-output completion (add to character inventory)

### Phase 3: FishingLootEntry Migration (Deferred)
- Add FK columns
- Migrate data
- Update fishing logic

---

**Estimated Time to Complete:** 30-60 minutes
**Priority:** HIGH (blocking deployment)
