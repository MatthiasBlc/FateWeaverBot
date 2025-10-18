# Capacity System - Quick Reference

## File Locations Summary

### Backend Service Implementation
- **Main Capacity Service:** `/backend/src/services/capability.service.ts`
- **Character Service:** `/backend/src/services/character.service.ts`
- **Random Generation:** `/backend/src/util/capacityRandom.ts`
- **Controllers:** `/backend/src/controllers/capabilities.ts`
- **Routes:** `/backend/src/routes/capabilities.ts`

### Discord Bot
- **User Handlers:** `/bot/src/features/users/users.handlers.ts`
- **Capability Service:** `/bot/src/services/capability.service.ts`
- **Projects Handler:** `/bot/src/features/projects/projects.handlers.ts`

### Database
- **Schema:** `/backend/prisma/schema.prisma`
- **Models:** Capability, CharacterCapability, Character (divertCounter field)

---

## Capacity Types & Implementation Details

### HARVEST Capacities (Fishing/Hunting/Gathering)
**Files:** `capability.service.ts`, `character.service.ts`, `capacityRandom.ts`

- **Chasser (Hunting):** Weighted pool [2-10 summer, 0-4 winter]
- **Cueillir (Gathering):** Weighted pool [1-3 summer, 0-2 winter]
- **Pêcher (Fishing):** Fixed loot tables (FISH_LOOT_1PA, FISH_LOOT_2PA)

### CRAFT Capacities
**Files:** `capability.service.ts` (executeCraft method)

- **Tisser:** Bois → Tissu
- **Forger:** Minerai → Fer
- **Menuiser** (was "Travailler le bois"): Bois → Planches
- **Cuisiner:** Vivres → Nourriture

**Roll Formula:** `output = random(inputAmount-1 to inputAmount*3)`

### SPECIAL Capacities
**Files:** `capability.service.ts`

- **Bûcheronner:** 2-3 Bois (roll: `random(2) + 2`)
- **Miner:** 2-6 Minerai (roll: `random(5) + 2`)
- **Soigner:** Heal mode (1 PA) or craft cataplasme (2 PA)
- **Divertir:** Entertainment with 5-use counter → +1 PM city-wide

### SCIENCE Capacities
**Files:** `capability.service.ts`

- **Analyser:** 1 PA = 1 info, 2 PA = 3 infos
- **Cartographier:** Same as analyser
- **Auspice:** Same as analyser

---

## Divertir (Entertainment) System - Critical

### Database Field
- `Character.divertCounter: int @default(0)` (in schema.prisma, line 87)

### Logic Flow
```
Use Divertir → divertCounter++
If divertCounter < 5: Show preparation message
If divertCounter >= 5:
  - Reset counter to 0
  - Give +1 PM to all town characters (not in DEPARTED expeditions)
  - Show spectacle success message
```

### Code Location
- **Service:** `capability.service.ts::executeDivertir()` (lines 1091-1174)
- **Alternative:** `character.service.ts::useEntertainmentCapability()` (lines 649-671)

---

## Random/Dice/Luck Systems

### 1. Weighted Pools (Hunt/Gather)
```typescript
// capacityRandom.ts
const huntSummer = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const result = getRandomFromPool(huntSummer);  // Equal probability per element
```

### 2. Fixed Loot Tables (Fishing)
```typescript
// capability.service.ts lines 15-53
const FISH_LOOT_1PA = [{ resource, quantity }, ...];
const randomIndex = Math.floor(Math.random() * lootTable.length);
const loot = lootTable[randomIndex];
```

### 3. Simple Rolls (Logging/Mining)
```typescript
// Logging: Math.floor(Math.random() * 2) + 2  → 2 or 3
// Mining: Math.floor(Math.random() * 5) + 2  → 2-6
```

### 4. Ranged Output (Crafting)
```typescript
// capability.service.ts line 744
const minOutput = Math.max(0, inputAmount - 1);
const maxOutput = inputAmount * 3;
const output = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
```

---

## Capacity Execution Flow - Quick Diagram

```
User clicks button
↓
POST /characters/{id}/capabilities/use
↓
useCharacterCapability() [character.service.ts]
  - Load character + capabilities
  - Verify PA available
  - Route by name (case switch)
↓
Specific handler:
  - useHuntingCapability()
  - useGatheringCapability()
  - useFishingCapability()
  - useLoggingCapability()
  - useEntertainmentCapability()  ← Counter logic
  - useCraftingCapability()
  - etc.
↓
Database transaction:
  - Deduct PA
  - Add resources to town stock OR update counter
  - Return result
↓
Send response to client
```

---

## PA (Action Points) Restrictions

### Validation Function
`validateCanUsePA(character, costPA)` in character-validators.ts

### Restrictions:
- **Agonie (hungerLevel=1):** Cannot use PA at all
- **Dépression (pm=0):** Max 1 PA per day + contagious
- **Déprime (pm=1):** Max 1 PA per day
- **Normal:** Can use PA up to paTotal

---

## "Travailler le bois" → "Menuiser" Renaming

### Places to Update:
1. `/backend/prisma/schema.prisma` - Line 118, CraftType enum
2. `/backend/src/services/capability.service.ts` - Line 693, CRAFT_CONFIGS key
3. `/bot/src/features/projects/projects.handlers.ts` - 2 mappings
4. `/bot/src/features/projects/projects.utils.ts` - Case statement
5. `/bot/src/features/projects/project-creation.ts` - UI label

### Migration:
- Create `npx prisma migrate dev` to update enum

---

## Key API Endpoints

### Capacity Management
```
GET  /capabilities                      - List all
POST /capabilities                      - Create new

GET  /characters/{id}/capabilities      - List character's capacities
POST /characters/{id}/capabilities/{capId}      - Add to character
DELETE /characters/{id}/capabilities/{capId}    - Remove from character
```

### Using Capacities
```
POST /characters/{id}/capabilities/use           - Generic handler
POST /characters/{id}/bucheronner                - Logging
POST /characters/{id}/miner                      - Mining
POST /characters/{id}/pecher                     - Fishing
POST /characters/{id}/harvest                    - Hunt/Gather
POST /characters/{id}/craft                      - Crafting
POST /characters/{id}/soigner                    - Healing
POST /characters/{id}/research                   - Research
POST /characters/{id}/divertir                   - Entertainment
```

---

## Testing Capacity Changes

### Quick Tests:
1. **Weighted Pools:** Check hunting results distribution (summer vs winter)
2. **Crafting:** Test output range for various input amounts
3. **Divertir:** Use capacity 5 times, verify counter and PM boost
4. **Enum Rename:** Verify projects list shows new name
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
```

