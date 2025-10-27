# Capacity System - Quick Reference

**Last Updated:** 2025-10-27 (Verified with actual codebase)

---

## File Locations Summary

### Backend Service Implementation
- **Capacity Services:** `/backend/src/services/capability/capabilities/*.capability.ts`
- **Main Service:** `/backend/src/services/capability.service.ts`
- **Controllers:** `/backend/src/controllers/capabilities.ts`
- **Routes:** `/backend/src/routes/capabilities.ts`
- **Database Seed:** `/backend/prisma/seed.ts` (lines 20-131)

### Discord Bot
- **User Handlers:** `/bot/src/features/users/users.handlers.ts`
- **Projects Handler:** `/bot/src/features/projects/projects.handlers.ts`

### Database
- **Schema:** `/backend/prisma/schema.prisma`
- **Models:** Capability, CharacterCapability, Character

---

## Capacity Types & Implementation Details

### HARVEST Capacities (All 6 fully implemented)

**Chasser (Hunting):** `/backend/src/services/capability/capabilities/chasser.capability.ts`
- Weighted pool [2-10 summer, 0-4 winter]
- Output: Vivres (food)
- Cost: 1-2 PA

**Cueillir (Gathering):** `/backend/src/services/capability/capabilities/cueillir.capability.ts`
- Weighted pool [1-3 summer, 0-2 winter]
- Output: Vivres (food)
- Cost: 1-2 PA

**Pêcher (Fishing):** `/backend/src/services/capability/capabilities/pecher.capability.ts`
- Fixed loot tables (FISH_LOOT_1PA, FISH_LOOT_2PA)
- Output: Vivres/Bois/Minerai (or rare GRIGRI)
- Cost: 1 or 2 PA

**Couper du bois (Logging):** `/backend/src/services/capability/capabilities/couper-du-bois.capability.ts`
- Simple roll: 2-3 Bois
- Formula: `Math.floor(Math.random() * 2) + 2`
- Cost: 1-2 PA

**Miner (Mining):** `/backend/src/services/capability/capabilities/miner.capability.ts`
- Simple roll: 2-6 Minerai
- Formula: `Math.floor(Math.random() * 5) + 2`
- Cost: 2 PA

**Cuisiner (Cooking):** `/backend/src/services/capability/capabilities/cuisiner.capability.ts`
- Transform Vivres → Repas
- Input limits: 1 PA = max 2 inputs, 2 PA = max 5 inputs
- Output formula: `Random(Input - 1, Input × 3)`
- Cost: 1-2 PA

---

### CRAFT Capacities (Project-based, not character capabilities)

**IMPORTANT:** Tisser, Forger, and Menuiser are implemented as **Project mechanics** (CraftType enum), not as standalone character capabilities for raw resource transformation.

**Tisser:** Project crafting only
- Input: Bois
- Output: Tissu
- Access: Create Project with CraftType.TISSER

**Forger:** Project crafting only
- Input: Minerai
- Output: Métal
- Access: Create Project with CraftType.FORGER

**Menuiser:** Project crafting only
- Input: Bois
- Output: Planches
- Access: Create Project with CraftType.MENUISER

**Schema Location:** `/backend/prisma/schema.prisma` lines 120-124
```prisma
enum CraftType {
  TISSER
  FORGER
  MENUISER
}
```

---

### SCIENCE Capacities

**Soigner (Healing):** `/backend/src/services/capability/capabilities/soigner.capability.ts`
- Mode 1 (1 PA): Heal target +1 HP (20% chance +2 HP with HEAL_EXTRA bonus)
- Mode 2 (2 PA): Craft cataplasme (limit: 3 per town)
- Limit check: lines 106-113

**Rechercher (Research):** `/backend/src/services/capability/capabilities/rechercher.capability.ts`
- Provides information based on PA spent
- Cost: 1-2 PA

**Cartographier (Cartography):** `/backend/src/services/capability/capabilities/cartographier.capability.ts`
- Map exploration capability
- Cost: 1-2 PA

**Auspice (Divination):** `/backend/src/services/capability/capabilities/auspice.capability.ts`
- Fortune telling capability
- Cost: 1-2 PA

---

### SPECIAL Capacities

**Divertir (Entertainment):** `/backend/src/services/capability/capabilities/divertir.capability.ts`
- 5-use counter mechanic
- On 5th use: Reset counter, grant +1 PM to all town characters (not in DEPARTED expeditions)
- Counter stored in: `Character.divertCounter` (schema.prisma line 89)
- Cost: 1-2 PA

**Implementation Logic:**
```typescript
divertCounter++
if (divertCounter >= 5) {
  divertCounter = 0;
  // Give +1 PM to all town characters (excluding DEPARTED expeditions)
}
```

---

## Cataplasme System - Critical

### Database Storage
- Stored as ResourceStock with ResourceType "Cataplasme"
- Category: "science"

### Logic Flow
```
Create: Use Soigner (2 PA) → Check limit (max 3 per town) → Add 1 cataplasme to stock
Use: POST /characters/:id/use-cataplasme → Remove 1 cataplasme → Heal +1 HP
```

### Code Location
- Service: `/backend/src/services/capability/capabilities/soigner.capability.ts` (lines 104-125)
- Limit check: `getCataplasmeCount(townId)` method
- Usage endpoint: `/backend/src/controllers/character/character-stats.controller.ts`

---

## Random/Dice/Luck Systems

### 1. Weighted Pools (Hunt/Gather)
```typescript
// Summer hunt: Equal chance for each value in [2, 3, 4, 5, 6, 7, 8, 9, 10]
// Winter hunt: Equal chance for each value in [0, 1, 1, 1, 2, 2, 3, 3, 4] (weighted toward lower)
const result = pool[Math.floor(Math.random() * pool.length)];
```

### 2. Fixed Loot Tables (Fishing)
```typescript
const lootTable = paSpent === 1 ? FISH_LOOT_1PA : FISH_LOOT_2PA;
const randomIndex = Math.floor(Math.random() * lootTable.length);
const loot = lootTable[randomIndex];
```

### 3. Simple Rolls (Logging/Mining)
```typescript
// Logging: Math.floor(Math.random() * 2) + 2  → 2 or 3
// Mining: Math.floor(Math.random() * 5) + 2  → 2-6
```

### 4. Ranged Output (Cooking)
```typescript
const minOutput = Math.max(0, inputAmount - 1);
const maxOutput = inputAmount * 3;
const output = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
```

---

## Capacity Execution Flow

```
User clicks button
↓
POST /characters/{id}/use-capability
↓
Backend routes to specific capability service
↓
Capability service:
  - Validates PA available
  - Executes capability logic
  - Rolls for output
  - Updates character PA
  - Updates town/expedition stocks
↓
Returns result to client
```

---

## PA (Action Points) Restrictions

### Validation
Characters **CANNOT** use PA if:
- HP ≤ 1 (Agonie or dead)
- PM ≤ 1 (Déprime or Dépression)
- In DEPARTED expedition for city-based actions

### PA Costs
- Most capacities: 1-2 PA (user chooses)
- Mining: 2 PA only
- Divertir: 1-2 PA

### PA Regeneration
- Normal: +2 PA per day (at midnight)
- Affamé (hungerLevel ≤ 1): +1 PA per day
- Maximum: 4 PA (capped)

See `/backend/src/cron/daily-pa.cron.ts` STEP 5 for implementation

---

## Key API Endpoints

### Capacity Management
```
GET  /capabilities                      - List all
POST /capabilities                      - Create new (admin)

GET  /characters/{id}/capabilities      - List character's capacities
POST /characters/{id}/capabilities/{capId}      - Add to character
DELETE /characters/{id}/capabilities/{capId}    - Remove from character
```

### Using Capacities
```
POST /characters/{id}/use-capability    - Generic capability execution
POST /characters/{id}/use-cataplasme    - Use cataplasme healing item
```

Each capability service handles its own execution logic.

---

## Testing Capacity Changes

### Quick Tests:
1. **Weighted Pools:** Check hunting results distribution (summer vs winter)
2. **Cooking:** Test output range for various input amounts (1 vivre → 0-3 repas)
3. **Divertir:** Use capacity 5 times, verify counter and PM boost
4. **Project Crafts:** Verify Tisser/Forger/Menuiser only accessible via projects
5. **PA Validation:** Test with 0/1/2 PA available

### Database Checks:
```sql
-- List all capacities
SELECT id, name, costPA, category FROM capabilities ORDER BY name;

-- Check character's capacities
SELECT c.name FROM character_capabilities cc
JOIN capabilities c ON cc.capabilityId = c.id
WHERE cc.characterId = 'CHARACTER_ID';

-- Check divertir counter
SELECT name, divertCounter FROM characters WHERE divertCounter > 0;

-- Check cataplasme count
SELECT SUM(quantity) FROM resource_stocks rs
JOIN resource_types rt ON rs.resourceTypeId = rt.id
WHERE rt.name = 'Cataplasme' AND rs.locationId IN (
  SELECT id FROM towns WHERE id = 'TOWN_ID'
  UNION
  SELECT id FROM expeditions WHERE townId = 'TOWN_ID'
);
```

---

## Changes from Previous Versions

**V2 Updates (2025-10-27):**
- ✅ Verified all 14 capabilities exist and are implemented
- ✅ Clarified Tisser/Forger/Menuiser are Project mechanics only
- ✅ Added Cuisiner as HARVEST capability (cooking transformation)
- ✅ Updated Soigner with HEAL_EXTRA bonus (20% chance +2 HP)
- ✅ Verified cataplasme 3-limit implementation
- ✅ Corrected capacity file locations (new modular structure)
- ✅ Added actual code line references for all systems

**Deprecated Information:**
- ❌ "Travailler le bois" capability for raw crafting (it's Project-only)
- ❌ Standalone Tisser/Forger capabilities (they're Project-only)
- ❌ Old capability service structure (now modularized)

---

**Version:** 2.0 - Verified Implementation (2025-10-27)
