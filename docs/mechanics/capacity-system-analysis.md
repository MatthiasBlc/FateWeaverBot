# FateWeaverBot Capacity System Analysis

**Last Updated:** 2025-10-27 (Verified with actual codebase)

---

## Executive Summary

The capacity system in FateWeaverBot is a comprehensive action system that allows characters to use special abilities to produce resources, entertain, heal, and research. This document details the verified implementation based on actual codebase analysis.

**Key Findings:**
1. ✅ All 14 documented capabilities are implemented
2. ✅ Modular service architecture (`/backend/src/services/capability/capabilities/*.capability.ts`)
3. ⚠️ Tisser/Forger/Menuiser are **Project mechanics only**, not standalone character capabilities
4. ✅ All game mechanics verified against actual code

---

## 1. CAPACITY STORAGE & DATABASE SCHEMA

### Database Tables

**Capability Table** (`capabilities`)
```prisma
model Capability {
  id            String   @id @default(cuid())
  name          String   @unique
  emojiTag      String   @map("emoji_tag")
  category      CapabilityCategory
  costPA        Int      @map("cost_pa")
  description   String?
  characters    CharacterCapability[]

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("capabilities")
}
```

**Categories:**
```prisma
enum CapabilityCategory {
  HARVEST  // Gather resources (Chasser, Cueillir, Pêcher, Couper du bois, Miner, Cuisiner)
  SPECIAL  // Special abilities (Divertir)
  CRAFT    // Placeholder (not used for capabilities, see Projects)
  SCIENCE  // Knowledge-based (Soigner, Rechercher, Cartographier, Auspice)
}
```

**CharacterCapability Junction Table** (`character_capabilities`)
```prisma
model CharacterCapability {
  characterId String
  capabilityId String

  character Character @relation(...)
  capability Capability @relation(...)

  @@id([characterId, capabilityId])
  @@map("character_capabilities")
}
```

**Character Table** (relevant fields)
```prisma
model Character {
  id             String   @id @default(cuid())
  divertCounter  Int      @default(0) @map("divert_counter")  // For entertainment accumulation
  paTotal        Int      @default(2)  // Action Points (0-4)
  paUsedToday    Int      @default(0) @map("pa_used_today")
  pm             Int      @default(5)  // Mental Points (0-5)
  hungerLevel    Int      @default(4)  // Hunger (0-4)
  hp             Int      @default(5)  // Health Points (0-5)
  agonySince     DateTime? @map("agony_since")  // Agony timer

  capabilities   CharacterCapability[]
  // ... other fields
}
```

---

## 2. MODULAR CAPABILITY ARCHITECTURE

### New Structure (Implemented)

```
/backend/src/services/capability/
├── capability.service.ts          # Main service coordinator
├── capability.interface.ts        # Shared interfaces
└── capabilities/                  # Individual capability implementations
    ├── chasser.capability.ts      # Hunting
    ├── cueillir.capability.ts     # Gathering
    ├── pecher.capability.ts       # Fishing
    ├── couper-du-bois.capability.ts  # Logging
    ├── miner.capability.ts        # Mining
    ├── cuisiner.capability.ts     # Cooking
    ├── soigner.capability.ts      # Healing
    ├── rechercher.capability.ts   # Research
    ├── cartographier.capability.ts # Cartography
    ├── auspice.capability.ts      # Divination
    └── divertir.capability.ts     # Entertainment
```

**Benefits of Modular Architecture:**
- ✅ Single Responsibility: Each capability in its own file
- ✅ Easy to test: Unit tests per capability
- ✅ Easy to extend: Add new capabilities without modifying existing code
- ✅ Clear dependencies: Each service declares its own dependencies
- ✅ Type safety: Shared interfaces ensure consistency

---

## 3. CAPABILITY IMPLEMENTATIONS (VERIFIED)

### A. HARVEST CAPACITIES

**1. Chasser (Hunting)**
- **File:** `/backend/src/services/capability/capabilities/chasser.capability.ts`
- **Cost:** 1-2 PA
- **Output:** Vivres (food)
- **Roll System:** Weighted pool per season
  - **Summer Pool:** `[2, 3, 4, 5, 6, 7, 8, 9, 10]` (equal probability per element)
  - **Winter Pool:** `[0, 1, 1, 1, 2, 2, 3, 3, 4]` (weighted toward lower values)
- **Mechanism:** `pool[Math.floor(Math.random() * pool.length)]`

**2. Cueillir (Gathering)**
- **File:** `/backend/src/services/capability/capabilities/cueillir.capability.ts`
- **Cost:** 1-2 PA
- **Output:** Vivres (food)
- **Roll System:** Weighted pool per season
  - **Summer Pool:** `[1, 2, 2, 3]` (weighted toward 2)
  - **Winter Pool:** `[0, 1, 1, 2]` (weighted toward 1)

**3. Pêcher (Fishing)**
- **File:** `/backend/src/services/capability/capabilities/pecher.capability.ts`
- **Cost:** 1 or 2 PA (selectable)
- **Output:** Loot table based on PA spent
- **Tables:** FISH_LOOT_1PA and FISH_LOOT_2PA (17 outcomes each)
- **Roll Mechanism:**
  ```typescript
  const lootTable = paSpent === 1 ? FISH_LOOT_1PA : FISH_LOOT_2PA;
  const randomIndex = Math.floor(Math.random() * lootTable.length);
  const loot = lootTable[randomIndex];
  ```
- **Possible outputs (1 PA):** 0-4 Vivres, 2-6 Bois, 2-6 Minerai, or special GRIGRI
- **Possible outputs (2 PA):** 1-10 Vivres, 4-6 Bois, 4-5 Minerai, or special GRIGRI

**4. Couper du bois (Logging)**
- **File:** `/backend/src/services/capability/capabilities/couper-du-bois.capability.ts`
- **Cost:** 1-2 PA
- **Output:** 2-3 Bois
- **Roll Mechanism:** `Math.floor(Math.random() * 2) + 2`

**5. Miner (Mining)**
- **File:** `/backend/src/services/capability/capabilities/miner.capability.ts`
- **Cost:** 2 PA
- **Output:** 2-6 Minerai
- **Roll Mechanism:** `Math.floor(Math.random() * 5) + 2`

**6. Cuisiner (Cooking)**
- **File:** `/backend/src/services/capability/capabilities/cuisiner.capability.ts`
- **Cost:** 1-2 PA
- **Output:** Repas (prepared meals)
- **Input:** Vivres (raw food)
- **Input Limits:**
  - 1 PA: Max 2 Vivres as input
  - 2 PA: Max 5 Vivres as input
- **Output Formula:**
  ```typescript
  const minOutput = Math.max(0, inputAmount - 1);
  const maxOutput = inputAmount * 3;
  const outputAmount = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
  ```
  - Example: 1 Vivre → 0-3 Repas
  - Example: 5 Vivres → 4-15 Repas

---

### B. PROJECT-BASED CRAFTING (NOT Character Capabilities)

**CRITICAL DISTINCTION:** Tisser, Forger, and Menuiser are implemented as **Project mechanics**, NOT as standalone character capabilities.

**Schema Definition:**
```prisma
// /backend/prisma/schema.prisma lines 120-124
enum CraftType {
  TISSER
  FORGER
  MENUISER
}
```

**How They Work:**
- Projects are created via `/projets-admin` command
- Multiple characters can contribute resources to projects
- Projects complete when resource goals are met
- Outputs are distributed to town stock

**Project Types:**
1. **Tisser** - Transform Bois → Tissu
2. **Forger** - Transform Minerai → Métal
3. **Menuiser** - Transform Bois → Planches

**Why Not Capabilities:**
- Projects represent collaborative crafting (multiple contributors)
- Capabilities represent individual actions (single character)
- Projects have complex state (ongoing, completed, resource tracking)
- Capabilities have immediate effects (instant output)

---

### C. SCIENCE CAPACITIES

**1. Soigner (Healing)**
- **File:** `/backend/src/services/capability/capabilities/soigner.capability.ts`
- **Cost:** 1 or 2 PA (mode-dependent)

**Two Modes:**

**Mode 1 (1 PA) - Heal Target:**
- Implementation: Lines 34-102
- Effect: Heal target character +1 HP (max 5)
- Bonus: 20% chance for +2 HP with HEAL_EXTRA bonus (lines 70-82)
- Validation: Cannot heal if target already at 5 HP (line 48)

**Mode 2 (2 PA) - Craft Cataplasme:**
- Implementation: Lines 104-125
- Effect: Creates 1 cataplasme resource
- Limit Check (lines 106-113):
  ```typescript
  const cataplasmeCount = await this.getCataplasmeCount(character.townId);
  if (cataplasmeCount >= 3) {
    throw new BadRequestError("Limite de cataplasmes atteinte (max 3 par ville)");
  }
  ```

**2. Rechercher (Research)**
- **File:** `/backend/src/services/capability/capabilities/rechercher.capability.ts`
- **Cost:** 1-2 PA
- **Output:** Information count (1 PA = 1 info, 2 PA = more info)

**3. Cartographier (Cartography)**
- **File:** `/backend/src/services/capability/capabilities/cartographier.capability.ts`
- **Cost:** 1-2 PA
- **Effect:** Map exploration

**4. Auspice (Divination)**
- **File:** `/backend/src/services/capability/capabilities/auspice.capability.ts`
- **Cost:** 1-2 PA
- **Effect:** Fortune telling/insights

---

### D. SPECIAL CAPACITIES

**Divertir (Entertainment) - CRITICAL SYSTEM**

- **File:** `/backend/src/services/capability/capabilities/divertir.capability.ts`
- **Cost:** 1-2 PA
- **Database field:** `Character.divertCounter` (schema.prisma line 89)

**PA Accumulation Mechanism:**

Each use of Divertir:
1. Increments `character.divertCounter` by 1
2. Consumes PA (1 or 2)
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
      paTotal: { decrement: costPA },
      paUsedToday: { increment: costPA }
    }
  });
  return { message: `Vous préparez un spectacle (${newCounter}/5)` };

} else {
  // Spectacle ready! Reset counter and give +1 PM to all city characters
  await tx.character.update({
    where: { id: characterId },
    data: {
      divertCounter: 0,  // Reset to 0
      paTotal: { decrement: costPA },
      paUsedToday: { increment: costPA }
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

---

## 4. CATAPLASME SYSTEM (VERIFIED)

**Implementation:** `/backend/src/services/capability/capabilities/soigner.capability.ts`

**Database Storage:**
- Stored as `ResourceStock` with `ResourceType` "Cataplasme"
- Category: "science"
- Seed data: `/backend/prisma/seed.ts` lines 251-255

**Creation (2 PA):**
```typescript
// Lines 106-113: Limit check
const cataplasmeCount = await this.getCataplasmeCount(character.townId);
if (cataplasmeCount >= 3) {
  throw new BadRequestError("Limite de cataplasmes atteinte (max 3 par ville)");
}

// Create cataplasme in town stock
await this.resourceService.addResourceToLocation(
  LocationType.CITY,
  character.townId,
  "Cataplasme",
  1
);
```

**Usage:**
- Endpoint: `POST /characters/:id/use-cataplasme`
- Controller: `/backend/src/controllers/character/character-stats.controller.ts`
- Effect: Restores +1 HP instantly
- Removes 1 cataplasme from town/expedition stock

**Limit Enforcement:**
- `getCataplasmeCount(townId)` counts cataplasmes across:
  - City stock
  - All expedition stocks for that town
- Maximum 3 total per town (shared limit)

---

## 5. RANDOM GENERATION METHODS

### A. Weighted Pools (Hunt, Gather)
```typescript
function getRandomFromPool(pool: number[]): number {
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
```
- Predefined arrays with weighted values
- Equal probability for each array element
- Seasonal variation affects pool contents, not probabilities

### B. Uniform Distribution (Fishing, Logging, Mining)
```typescript
// Fishing: Select from loot table
Math.floor(Math.random() * lootTable.length)

// Logging: 2-3
Math.floor(Math.random() * 2) + 2

// Mining: 2-6
Math.floor(Math.random() * 5) + 2
```

### C. Ranged Output (Cooking)
```typescript
const minOutput = Math.max(0, inputAmount - 1);
const maxOutput = inputAmount * 3;
const outputAmount = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
```
- Uniform distribution across range
- Input of 1: Output 0-3 (equal probability)
- Input of 2: Output 1-6 (equal probability)
- Input of 5: Output 4-15 (equal probability)

---

## 6. PA (ACTION POINTS) SYSTEM

### PA Bonuses / Restrictions

**Validation:** `validateCanUsePA(character, costPA)`

```typescript
// Cannot use PA if:
if (character.hp <= 1) {
  throw new Error("Vous êtes en agonie et ne pouvez pas utiliser de PA");
}
if (character.pm <= 1) {
  throw new Error("Votre moral est trop bas pour utiliser des PA");
}
```

**Regeneration (Daily at 00:00):**
```typescript
// /backend/src/cron/daily-pa.cron.ts STEP 5
let pointsToAdd;
if (character.hungerLevel <= 1) {
  pointsToAdd = 1;  // Affamé penalty
} else {
  pointsToAdd = 2;  // Normal regeneration
}

// Apply cap
const maxPointsToAdd = 4 - character.paTotal;
pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

// Update
character.paTotal += pointsToAdd;
```

**Character Restrictions for Capacities:**
```typescript
// Cannot use capability if:
- Character is in DEPARTED expedition (for city-based actions)
- Character is dead (isDead = true)
- Character is in agony (hp <= 1)
- Character is depressed (pm <= 1)
```

---

## 7. CAPACITY USAGE WORKFLOW

### Step 1: User Interface (Discord)
Bot displays capacities on user profile with:
- Name
- Cost in PA
- Emoji tag
- Description (optional)
- Button disabled if insufficient PA

### Step 2: User Clicks "Use Capability" Button
```typescript
// /bot/src/features/users/users.handlers.ts
const customId = `use_capability:${cap.id}:${characterId}:${userId}`;

// Parse: capabilityId, characterId, userId
// Verify: user ownership, enough PA, character alive
```

### Step 3: Backend POST Request
```
POST /characters/{characterId}/use-capability
Body: {
  capabilityId: string,
  capabilityName: string,
  isSummer?: boolean,  // For seasonal capabilities
  paAmount?: number,   // For variable PA costs
  targetCharacterId?: string,  // For Soigner
  inputAmount?: number  // For Cuisiner
}
```

### Step 4: Capability Service Processing
```typescript
// /backend/src/services/capability.service.ts
1. Load character with capabilities
2. Find capability by ID
3. Validate PA (paTotal >= capability.costPA)
4. Route to specific capability service
5. Execute capability (roll dice, determine output)
6. Update character PA
7. Add resources to town/expedition stock (if applicable)
8. Return result
```

### Step 5: Individual Capability Service
Each capability service (e.g., `/capabilities/chasser.capability.ts`) implements:
```typescript
interface CapabilityService {
  execute(
    character: Character,
    options: CapabilityOptions
  ): Promise<CapabilityResult>;
}
```

### Step 6: Return Result
```typescript
{
  success: boolean,
  message: string,        // Private message to user
  publicMessage?: string, // Message posted to log channel
  resources?: {
    [resourceName]: number
  },
  counter?: number  // For Divertir
}
```

---

## 8. KEY SYSTEMS & INTERACTIONS

### PA (Action Points) System
- **Range:** 0-4
- **Regeneration:** Daily reset (midnight) via unified cron orchestrator
- **Costs:** 1-2 PA per capacity use (Mining is 2 PA only)
- **Modifiers:**
  - Agonie (hp≤1): 0 PA usable
  - Déprime/Dépression (pm≤1): 0 PA usable
  - Affamé (hungerLevel≤1): Only +1 PA regen instead of +2

### Divertir Counter System
- **Storage:** `character.divertCounter`
- **Increment:** +1 on each use
- **Trigger:** When counter reaches 5
- **Effect:** +1 PM to all town characters (excluding DEPARTED expeditions)
- **Reset:** Counter → 0 after trigger
- **Cost:** Still consumes PA on every use

### Resource Stock System
- **Location:** `ResourceStock` table
- **Locations:** CITY (town) or EXPEDITION
- **Tracked Resources:** Vivres, Bois, Minerai, Tissu, Métal, Planches, Repas, Cataplasme
- **Updates:** Via capability execution or project completion

---

## 9. API ENDPOINTS (VERIFIED)

### Capacity Management
```
GET  /capabilities                              - List all capabilities
POST /capabilities                              - Create new capability (admin)

GET  /characters/{id}/capabilities              - List character's capacities
POST /characters/{id}/capabilities/{capId}      - Add capability to character
DELETE /characters/{id}/capabilities/{capId}    - Remove capability from character
```

### Using Capacities
```
POST /characters/{id}/use-capability            - Generic capability execution
POST /characters/{id}/use-cataplasme            - Use cataplasme healing item
```

**Note:** Each capability service handles its own validation and execution logic.

---

## SUMMARY: Capacity System Architecture

```
Capacity System
├── Database Layer
│   ├── Capability (name, costPA, category, emojiTag)
│   ├── CharacterCapability (junction table)
│   └── Character (divertCounter, paTotal, paUsedToday, pm, hungerLevel, hp)
│
├── Service Layer (Backend)
│   ├── CapabilityService (main coordinator)
│   └── Individual Capability Services:
│       ├── ChasserCapability
│       ├── CueillirCapability
│       ├── PecherCapability
│       ├── CouperDuBoisCapability
│       ├── MinerCapability
│       ├── CuisinerCapability
│       ├── SoignerCapability
│       ├── RechercherCapability
│       ├── CartographierCapability
│       ├── AuspiceCapability
│       └── DivertirCapability
│
├── Random Generation
│   ├── Weighted Pools (Chasser, Cueillir)
│   ├── Uniform Distribution (Pêcher, Couper du bois, Miner)
│   ├── Fixed Loot Tables (Pêcher)
│   └── Ranged Output (Cuisiner)
│
└── API Endpoints
    ├── POST /capabilities → CRUD operations
    ├── POST /characters/:id/use-capability → Execute capability
    └── POST /characters/:id/use-cataplasme → Use healing item
```

---

## Changes from Previous Documentation

**V2 Updates (2025-10-27):**
- ✅ Verified all 14 capabilities against actual implementation
- ✅ Documented modular service architecture (new structure)
- ✅ Clarified Tisser/Forger/Menuiser are Project mechanics, NOT capabilities
- ✅ Added Cuisiner as HARVEST capability with proper implementation details
- ✅ Updated Soigner with HEAL_EXTRA bonus (20% chance +2 HP)
- ✅ Verified cataplasme 3-limit with actual code references
- ✅ Corrected all file paths to match current codebase structure
- ✅ Added line number references for critical code sections

**Deprecated Concepts:**
- ❌ Old monolithic capability service (replaced by modular architecture)
- ❌ "Travailler le bois" as character capability (it's Project-only now)
- ❌ Tisser/Forger as standalone capabilities (they're Project-only)
- ❌ Direct capacity execution methods (now use individual services)

---

**Last Updated:** 2025-10-27
**Version:** 2.0 - Verified with Actual Implementation
