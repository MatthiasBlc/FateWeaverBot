# FateWeaverBot Capacity System Analysis

## Executive Summary

The capacity system in FateWeaverBot is a comprehensive action system that allows characters to use special abilities to produce resources, entertain, heal, and research. This document details:

1. How capacities are stored and referenced
2. Capacity execution flow (from user input to database)
3. The dice/luck/roll mechanism for outcomes
4. Entertainment (Divertir) system with PA accumulation
5. "Travailler le bois" (Woodworking) implementation - NEEDS RENAMING TO "Menuiser"

---

## 1. CAPACITY STORAGE & DATABASE SCHEMA

### Database Tables

**Capability Table** (`capabilities`)
```
- id: string (cuid)
- name: string @unique (e.g., "Bûcheronner", "Pêcher", "Chasser", "Cueillir", "Divertir", "Miner", "Soigner", "Analyser", "Cartographier", "Auspice")
- emojiTag: string (emoji identifier)
- category: CapabilityCategory enum (HARVEST | CRAFT | SCIENCE | SPECIAL)
- costPA: int (1-4 PA required)
- description: string? (optional description)
```

**CharacterCapability Junction Table** (`character_capabilities`)
```
- characterId: string
- capabilityId: string
- createdAt: DateTime
- updatedAt: DateTime
- @@id([characterId, capabilityId])
```

**Character Table** (relevant fields)
```
- id: string
- divertCounter: int @default(0) @map("divert_counter")  ← For entertainment accumulation
- paTotal: int @default(2)  ← Action Points (0-4)
- paUsedToday: int @default(0) @map("pa_used_today")
- pm: int @default(5)  ← Mental Points (0-5, affects Divertir success)
- hungerLevel: int @default(4)  ← Affects PA availability
- hp: int @default(5)  ← Health Points
```

---

## 2. CAPACITY EXECUTION FLOW

### Complete User Journey

```
User clicks "Use Capacity" Button
    ↓
Discord Bot Handler (users.handlers.ts)
    ↓
POST /characters/{id}/capabilities/use (characters.ts)
    ↓
CharacterController.useCharacterCapability()
    ↓
CharacterService.useCharacterCapability()
    ↓
Specific Capacity Handler (e.g., useLoggingCapability, useEntertainmentCapability)
    ↓
Database Transaction:
    - Deduct PA from character
    - Add resources to town stock OR update divert counter
    - Log event
    ↓
Return result to client
```

### API Routes

Backend routes for capacities:
```
POST /capabilities                          → getAllCapabilities
POST /capabilities                          → createCapability
POST /:characterId/bucheronner              → executeBûcheronner (backend service)
POST /:characterId/miner                    → executeMiner
POST /:characterId/pecher                   → executeFish
POST /:characterId/harvest                  → executeHarvest (Chasser/Cueillir)
POST /:characterId/craft                    → executeCraft
POST /:characterId/soigner                  → executeSoigner
POST /:characterId/research                 → executeResearch
POST /:characterId/divertir                 → executeDivertir
```

---

## 3. CAPACITY IMPLEMENTATIONS

### A. HARVEST CAPACITIES (Hunt, Gather, Fish)

**Hunting (Chasser)**
- Cost: See capability.costPA
- Output: Food (Vivres)
- Roll System: Weighted pool per season
  - Summer: Pool = [2, 3, 4, 5, 6, 7, 8, 9, 10]
  - Winter: Pool = [0, 1, 1, 1, 2, 2, 3, 3, 4]
  - Mechanism: `Math.floor(Math.random() * pool.length)`
- Location: `capacityRandom.ts::getHuntYield(isWinter)`

**Gathering (Cueillir)**
- Cost: See capability.costPA
- Output: Food (Vivres)
- Roll System: Weighted pool per season
  - Summer: Pool = [1, 2, 2, 3]
  - Winter: Pool = [0, 1, 1, 2]
  - Mechanism: `Math.floor(Math.random() * pool.length)`
- Location: `capacityRandom.ts::getGatherYield(isWinter)`

**Fishing (Pêcher)**
- Cost: 1 or 2 PA (selectable)
- Output: Loot table based on PA spent
- Tables: `FISH_LOOT_1PA` and `FISH_LOOT_2PA` in `capability.service.ts`
- Roll Mechanism:
  ```typescript
  const lootTable = paSpent === 1 ? FISH_LOOT_1PA : FISH_LOOT_2PA;
  const randomIndex = Math.floor(Math.random() * lootTable.length);
  const loot = lootTable[randomIndex];
  ```
- Possible outputs (1 PA): 0-4 Vivres, 2-6 Bois, 2-6 Minerai, or special GRIGRI
- Possible outputs (2 PA): 1-10 Vivres, 4-6 Bois, 4-5 Minerai, or special GRIGRI

### B. LOGGING CAPACITY (Bûcheronner)

**Current Implementation**
- Name: "Bûcheronner"
- Cost: See capability.costPA
- Output: 2-3 Bois
- Roll Mechanism: `Math.floor(Math.random() * 2) + 2` (simple 1d2+2)
- Method: `executeBûcheronner()` in `capability.service.ts`

### C. MINING CAPACITY (Miner)

**Implementation**
- Name: "Miner"
- Cost: See capability.costPA
- Output: 2-6 Minerai
- Roll Mechanism: `Math.floor(Math.random() * 5) + 2` (simple 1d5+2)
- Method: `executeMiner()` in `capability.service.ts`

### D. CRAFTING CAPACITIES (Craft, Tisser, Forger, Menuiser)

**Craft Types Available**
```typescript
CRAFT_CONFIGS = {
  tisser: {
    input: "Bois",
    output: "Tissu",
    verb: "tissé"
  },
  forger: {
    input: "Minerai",
    output: "Fer",
    verb: "forgé"
  },
  travailler_le_bois: {  // ← NEEDS RENAMING TO "menuiser"
    input: "Bois",
    output: "Planches",
    verb: "travaillé"
  },
  cuisiner: {
    input: "Vivres",
    output: "Nourriture",
    verb: "cuisiné"
  }
}
```

**Output Formula for Crafting**
```typescript
const minOutput = Math.max(0, inputAmount - 1);
const maxOutput = inputAmount * 3;
const outputAmount = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
```

**PA Restriction**
- 1 PA: Can craft max 1 resource in input
- 2 PA: Can craft 1-5 resources in input

### E. HEALING CAPACITY (Soigner)

Two modes:
1. **Heal Mode** (1 PA)
   - Target another character
   - Restores +1 HP
   - Max 5 HP
   
2. **Craft Mode** (2 PA)
   - Creates "Cataplasme" item
   - Max 3 cataplasmes per town (including expeditions)
   - Cataplasmes can be used independently to restore +1 HP

### F. RESEARCH CAPACITIES (Analyser, Cartographier, Auspice)

- Cost: 1 or 2 PA
- Output: Information count
  - 1 PA: 1 information
  - 2 PA: 3 informations
- Mechanism: Returns info count, actual data handled elsewhere

### G. ENTERTAINMENT CAPACITY (Divertir) - CRITICAL SYSTEM

**PA Accumulation Mechanism**

Each use of "Divertir" capacity:
1. Increments `character.divertCounter` by 1
2. Consumes PA (See `capability.costPA`)
3. Checks if counter >= 5

**Counter Logic:**
```typescript
const newCounter = character.divertCounter + 1;

if (newCounter < 5) {
  // Not ready for spectacle yet
  await tx.character.update({
    where: { id: characterId },
    data: {
      divertCounter: newCounter,
      paTotal: { decrement: capability.costPA },
      paUsedToday: { increment: capability.costPA }
    }
  });
  return { message: `Vous préparez un spectacle (${newCounter}/5)` };

} else {
  // Spectacle ready! Reset counter and give +1 PM to all city characters
  await tx.character.update({
    where: { id: characterId },
    data: {
      divertCounter: 0,  ← Reset to 0
      paTotal: { decrement: capability.costPA },
      paUsedToday: { increment: capability.costPA }
    }
  });

  // +1 PM to all characters in same city (not in DEPARTED expeditions)
  const cityCharacters = await tx.character.findMany({
    where: {
      townId: character.townId,
      isDead: false,
      expeditionMembers: {
        none: { expedition: { status: "DEPARTED" } }
      }
    }
  });

  for (const char of cityCharacters) {
    if (char.pm < 5) {
      await tx.character.update({
        where: { id: char.id },
        data: { pm: Math.min(5, char.pm + 1) }
      });
    }
  }
  
  return { message: "Votre spectacle remonte le moral de la ville !" };
}
```

**Key Behaviors:**
- Counter is PER CHARACTER (not shared)
- On 5th use: All town characters (excluding DEPARTED expeditions) gain +1 PM
- Counter resets to 0 after triggering spectacle
- PA cost is STILL consumed on every use (including the 5th)
- Success creates a "concert" for the town (morale boost)

---

## 4. DICE/ROLL/LUCK SYSTEM

### Random Generation Methods

#### A. Weighted Pools (Hunt, Gather)
```typescript
export function getRandomFromPool(pool: number[]): number {
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
```
- Predefined arrays with weighted values
- Equal probability for each array element
- Seasonal variation affects pool contents, not probabilities

#### B. Uniform Distribution (Fishing, Logging, Mining)
```typescript
// Fishing base
Math.floor(Math.random() * (maxFood + 1))  // 0 to maxFood inclusive

// Logging
Math.floor(Math.random() * 2) + 2  // 2 or 3

// Mining
Math.floor(Math.random() * 5) + 2  // 2-6
```

#### C. Fixed Loot Tables (Advanced Fishing)
```typescript
const FISH_LOOT_1PA = [
  { resource: "Vivres", quantity: 0 },
  { resource: "Vivres", quantity: 1 },
  // ... more entries
  { resource: "GRIGRI", quantity: 1 }  // Special rare item
];
```
- Random index selection: `Math.floor(Math.random() * table.length)`
- Each entry has equal probability

#### D. Ranged Output (Crafting)
```typescript
const minOutput = Math.max(0, inputAmount - 1);
const maxOutput = inputAmount * 3;
const outputAmount = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
```
- Uniform distribution across range
- Input of 1: Output 0-3 (equal probability)
- Input of 2: Output 1-6 (equal probability)
- Input of 5: Output 4-15 (equal probability)

### Bonus/Modifier System

**PA Bonuses / Restrictions:**
```typescript
validateCanUsePA(character, costPA):
  - If hungerLevel === 1 (Agonie): Cannot use PA (throw error)
  - If pm === 0 (Dépression): Can use 1 PA max per day
  - If pm === 1 (Déprime): Can use 1 PA per day
  - Otherwise: Use PA normally
```

**Character Restrictions for Capacities:**
```typescript
// Cannot use capacity if:
- Character is DEPARTED in expedition (for most capacities)
- Character is dead
- Character is in agony (hungerLevel === 1)
- Character has depression (pm === 0)
- Character has only 1 PA available and depression/depressed
```

---

## 5. "TRAVAILLER_LE_BOIS" - WOODWORKING CAPACITY

### Current State

**Database References:**
```prisma
enum CraftType {
  TISSER
  FORGER
  TRAVAILLER_LE_BOIS  ← Should be MENUISER
}
```

**Code References:**
1. **Backend Service** (`capability.service.ts:693`)
   ```typescript
   travailler_le_bois: {
     inputResource: "Bois",
     outputResource: "Planches",
     verb: "travaillé"
   }
   ```

2. **Discord Bot** (`projects.handlers.ts`)
   ```typescript
   "Travailler le bois": "TRAVAILLER_LE_BOIS"
   ```

3. **Discord Bot UI** (`project-creation.ts`)
   ```typescript
   { label: "Travailler le bois", value: "TRAVAILLER_LE_BOIS", emoji: "🪚" }
   ```

### Renaming to "Menuiser"

**Files Requiring Changes:**

1. **`backend/prisma/schema.prisma`** (Line 118)
   ```diff
   enum CraftType {
     TISSER
     FORGER
   -  TRAVAILLER_LE_BOIS
   +  MENUISER
   }
   ```

2. **`backend/src/services/capability.service.ts`** (Line 693)
   ```diff
   CRAFT_CONFIGS: Record<string, { inputResource: string; outputResource: string; verb: string }> = {
   -  travailler_le_bois: {
   +  menuiser: {
        inputResource: "Bois",
        outputResource: "Planches",
        verb: "travaillé"
      }
   }
   ```

3. **`bot/src/features/projects/projects.handlers.ts`** (2 locations)
   ```diff
   -  "Travailler le bois": "TRAVAILLER_LE_BOIS"
   +  "Menuiser": "MENUISER"
   ```

4. **`bot/src/features/projects/projects.utils.ts`**
   ```diff
   -  case 'TRAVAILLER_LE_BOIS':
   +  case 'MENUISER':
   ```

5. **`bot/src/features/projects/project-creation.ts`**
   ```diff
   -  { label: "Travailler le bois", value: "TRAVAILLER_LE_BOIS", emoji: "🪚" }
   +  { label: "Menuiser", value: "MENUISER", emoji: "🪚" }
   ```

6. **Database Migration**
   - Create Prisma migration to rename enum value
   - Update existing records if any reference the old name

---

## 6. CAPACITY USAGE WORKFLOW - Detailed

### Step 1: User Interface (Discord)
Bot displays capacities on user profile with:
- Name
- Cost in PA
- Emoji tag
- Description (optional)
- Button disabled if insufficient PA

### Step 2: User Clicks "Use Capability" Button
```typescript
// users.handlers.ts - handleProfileButtonInteraction()
const customId = `use_capability:${cap.id}:${characterId}:${userId}`;

// Parse: capabilityId, characterId, userId
// Verify: user ownership, enough PA, character alive
```

### Step 3: Backend POST Request
```
POST /characters/{characterId}/capabilities/use
Body: {
  capabilityId: string,
  capabilityName: string,
  isSummer: boolean
}
```

### Step 4: Character Service Processing
```typescript
// character.service.ts::useCharacterCapability()
1. Load character with capabilities
2. Find capability by ID or name
3. Verify PA (paTotal >= capability.costPA)
4. Route to specific handler based on name:
   - "chasser" → useHuntingCapability()
   - "cueillir" → useGatheringCapability()
   - "pêcher" → useFishingCapability()
   - "divertir" → useEntertainmentCapability()
   - "bûcheronner" → useLoggingCapability()
5. Execute handler (roll dice, determine loot)
6. Update character PA
7. Add resources to town stock (if applicable)
8. Return result
```

### Step 5: Backend Service (CapabilityService)
Alternative route for newer implementations:
```
CapabilityService.executeHarvestCapacity()
CapabilityService.executeBûcheronner()
CapabilityService.executeMiner()
CapabilityService.executeFish()
CapabilityService.executeCraft()
CapabilityService.executeSoigner()
CapabilityService.executeResearch()
CapabilityService.executeDivertir()
```

### Step 6: Return Result
```typescript
{
  success: boolean,
  message: string,        // Private message to user
  publicMessage: string,  // Message posted to log channel
  loot: {
    foodSupplies?: number,
    wood?: number,
    [resource]: number
  },
  divertCounter?: number  // For Divertir
}
```

---

## 7. KEY SYSTEMS & INTERACTIONS

### PA (Action Points) System
- **Range:** 0-4
- **Regeneration:** Daily reset (midnight)
- **Costs:** 1-4 per capacity use
- **Modifiers:** 
  - Agonie (hungerLevel=1): 0 PA usable
  - Déprime (pm=1): 1 PA usable per day
  - Dépression (pm=0): 1 PA usable per day + contagious

### Divertir (Entertainment) Counter System
- **Storage:** `character.divertCounter`
- **Increment:** +1 on each use
- **Trigger:** When counter reaches 5
- **Effect:** +1 PM to all town characters
- **Reset:** Counter → 0 after trigger
- **Cost:** Still consumes PA on every use

### Resource Stock System
- **Location:** `ResourceStock` table
- **Locations:** CITY or EXPEDITION
- **Tracked Resources:** Vivres, Bois, Minerai, Tissu, Fer, Planches, Nourriture, Cataplasme
- **Updates:** Via capacity execution or crafting

---

## SUMMARY: Capacity System Architecture

```
Capacity System
├── Database Layer
│   ├── Capability (name, costPA, category, emojiTag)
│   ├── CharacterCapability (junction table)
│   └── Character (divertCounter, paTotal, paUsedToday, pm, hungerLevel)
│
├── Service Layer (Backend)
│   ├── CapabilityService
│   │   ├── executeHarvestCapacity() → Hunting/Gathering/Fishing
│   │   ├── executeBûcheronner() → Logging
│   │   ├── executeMiner() → Mining
│   │   ├── executeCraft() → Crafting
│   │   ├── executeSoigner() → Healing
│   │   ├── executeResearch() → Research
│   │   ├── executeDivertir() → Entertainment with counter
│   │   └── useCataplasme() → Healing item
│   │
│   └── CharacterService
│       ├── useCharacterCapability() → Router
│       ├── useHuntingCapability() → Weighted pool
│       ├── useGatheringCapability() → Weighted pool
│       ├── useFishingCapability() → Fixed table
│       ├── useLoggingCapability() → Simple roll
│       ├── useEntertainmentCapability() → Counter logic
│       └── [Handlers for others]
│
├── Random Generation
│   ├── Weighted Pools (Hunt, Gather)
│   ├── Uniform Distribution (Fish, Log, Mine, Craft)
│   ├── Fixed Loot Tables (Advanced Fish)
│   └── Ranged Output (Crafting)
│
└── API Endpoints
    ├── POST /capabilities → CRUD
    ├── POST /:characterId/harvest → Hunt/Gather/Fish
    ├── POST /:characterId/craft → Crafting
    ├── POST /:characterId/divertir → Entertainment
    ├── POST /:characterId/soigner → Healing
    ├── POST /:characterId/research → Research
    └── [Others per capacity]
```

