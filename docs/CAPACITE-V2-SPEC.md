# 🎯 Spécification Complète - Système de Capacités V2

**Date:** 2025-10-09
**Status:** Ready for Implementation
**Implementation:** Supernova / Claude Code
**Estimated Complexity:** LARGE (Multi-phase, ~30+ files)

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [État actuel du système](#état-actuel-du-système)
3. [Objectifs V2](#objectifs-v2)
4. [Architecture & Dépendances](#architecture--dépendances)
5. [Phase 1: Database & Migrations](#phase-1-database--migrations)
6. [Phase 2: Capacités HARVEST](#phase-2-capacités-harvest)
7. [Phase 3: Capacités CRAFT](#phase-3-capacités-craft)
8. [Phase 4: Capacités SCIENCE](#phase-4-capacités-science)
9. [Phase 5: Capacités SOCIAL](#phase-5-capacités-social)
10. [Phase 6: UI Updates](#phase-6-ui-updates)
11. [Phase 7: Tests & Validation](#phase-7-tests--validation)
12. [Checklist d'implémentation](#checklist-dimplémentation)

---

## 📊 Vue d'ensemble

### Mission
Mettre à jour le système de capacités du jeu pour passer en Version 2, avec intégration des nouvelles mécaniques CRAFT, SCIENCE et ajustements sur les capacités existantes.

### Scope
- **Nouvelles catégories:** CRAFT, SCIENCE (en plus de HARVEST, SPECIAL)
- **Nouvelles ressources:** Cataplasme (avec limite max de 3 par ville)
- **Nouvelles capacités:** 8+ nouvelles capacités
- **UI Updates:** /stock remplace /foodstock, affichage de toutes les ressources
- **Mechanics:** Crafting avec formules aléatoires, système de cataplasmes

---

## 🔍 État actuel du système

### Database Schema (Prisma)

**Table `capability`:**
```prisma
model Capability {
  id          String                @id @default(cuid())
  name        String                @unique
  category    CapabilityCategory    // HARVEST, SPECIAL
  costPA      Int                   // Coût en PA
  description String?
  characters  CharacterCapability[]
}

enum CapabilityCategory {
  HARVEST
  SPECIAL
}
```

**Table `resourceType`:**
```prisma
model ResourceType {
  id          Int                    @id @default(autoincrement())
  name        String                 @unique
  emoji       String
  category    String                 // 'base', 'transformé'
  description String?
  stocks      ResourceStock[]
}
```

**Ressources existantes (seed.ts):**
- Vivres (🍞)
- Bois (🌲)
- Minerai (⛏️)
- Tissu (🧵)
- Fer (⚒️)
- Planches (🪵)
- Nourriture (🍖)

### Capacités existantes

**HARVEST:**
- Chasser (🦌) - 1 PA
- Cueillir (🌿) - 1 PA
- Pêcher (🎣) - 1 ou 2 PA

**SPECIAL:**
- Divertir (🎭) - Compteur système

### Services existants

**`/backend/src/services/capability.service.ts`:**
- `executeHarvestCapacity()` - Gère chasse, cueillette
- Utilise `getHuntYield()`, `getGatherYield()` de `/backend/src/util/capacityRandom.ts`

---

## 🎯 Objectifs V2

### Nouvelles catégories
1. **CRAFT** - Artisanat (transformation de ressources)
2. **SCIENCE** - Médecine, recherche, analyse

### Nouvelles mécaniques
1. **Crafting System:**
   - Input → Output avec formule aléatoire
   - Choix de quantité (1 PA vs 2 PA)
   - Validation de stock avant craft

2. **Cataplasme System:**
   - Ressource spéciale avec limite max = 3 par ville
   - Transportable en expédition
   - Bouton "Utiliser cataplasme" dans UI

3. **Pêche V2:**
   - Tables de loot fixes (suppression dépendance saison)
   - Support "grigri" (item spécial, log only)

---

## 🏗️ Architecture & Dépendances

### Files to Modify

**Backend:**
```
/backend/prisma/schema.prisma              # Add CRAFT, SCIENCE enums
/backend/prisma/seed.ts                    # Add Cataplasme resource
/backend/src/services/capability.service.ts # Add craft/science logic
/backend/src/util/capacityRandom.ts        # Add craft formulas
/backend/src/controllers/characters.ts     # Add cataplasme usage endpoint
```

**Bot:**
```
/bot/src/features/users/users.handlers.ts  # Update profile UI
/bot/src/commands/stock.ts                 # Update /stock display
/bot/src/features/expeditions/...          # Add cataplasme button
```

**Documentation:**
```
/docs/GAME-MECHANICS.md                    # Update capabilities section
/docs/CAPACITE.md                          # Complete V2 documentation
```

### Dependencies
- Prisma migrations for schema changes
- Seed data for new resources
- Character creation must grant base capabilities

---

## 📝 Phase 1: Database & Migrations

### 1.1 Update Prisma Schema

**File:** `/backend/prisma/schema.prisma`

**Changes:**
```prisma
enum CapabilityCategory {
  HARVEST
  SPECIAL
  CRAFT      // NEW
  SCIENCE    // NEW
}
```

### 1.2 Add Cataplasme Resource

**File:** `/backend/prisma/seed.ts`

**Add to resourceTypes array:**
```typescript
{
  name: "Cataplasme",
  emoji: "🩹",
  category: "science",
  description: "Soin médical (max 3 par ville)"
}
```

### 1.3 Create Migration

```bash
npx prisma migrate dev --name add_craft_science_categories
```

### 1.4 Seed New Capabilities

**File:** `/backend/prisma/seed.ts` or create `/backend/prisma/seed-capabilities-v2.ts`

```typescript
const newCapabilities = [
  // HARVEST
  { name: "bûcheronner", category: "HARVEST", costPA: 1, description: "Récolte 2-3 bois" },
  { name: "miner", category: "HARVEST", costPA: 2, description: "Récolte 2-6 minerai" },

  // CRAFT
  { name: "tisser", category: "CRAFT", costPA: 1, description: "Bois → Tissu (formule aléatoire)" },
  { name: "forger", category: "CRAFT", costPA: 1, description: "Minerai → Fer (formule aléatoire)" },
  { name: "travailler_le_bois", category: "CRAFT", costPA: 1, description: "Bois → Planches (formule aléatoire)" },
  { name: "cuisiner", category: "CRAFT", costPA: 1, description: "Vivres → Nourriture (formule aléatoire)" },

  // SCIENCE
  { name: "soigner", category: "SCIENCE", costPA: 1, description: "1 PA = +1 PV cible, 2 PA = 1 cataplasme" },
  { name: "analyser", category: "SCIENCE", costPA: 1, description: "Recherche (admin)" },
  { name: "cartographier", category: "SCIENCE", costPA: 1, description: "Exploration (admin)" },
  { name: "auspice", category: "SCIENCE", costPA: 1, description: "Divination (admin)" },
];

for (const cap of newCapabilities) {
  await prisma.capability.upsert({
    where: { name: cap.name },
    update: {},
    create: cap
  });
}
```

### 1.5 Grant Base Capabilities

**Update character creation to grant:**
- bûcheronner (everyone)
- travailler_le_bois (everyone)

**File:** `/backend/src/services/character.service.ts` - `createCharacter()`

---

## ⛏️ Phase 2: Capacités HARVEST

### 2.1 Update Pêcher (Fish)

**File:** `/backend/src/services/capability.service.ts`

**Current:** Uses season-dependent yield
**New:** Fixed loot tables

```typescript
const FISH_LOOT_1PA = [
  { resource: "Vivres", quantity: 0 },
  { resource: "Vivres", quantity: 1 },
  { resource: "Vivres", quantity: 1 },
  { resource: "Vivres", quantity: 1 },
  { resource: "Vivres", quantity: 1 },
  { resource: "Bois", quantity: 2 },
  { resource: "Bois", quantity: 2 },
  { resource: "Minerai", quantity: 2 },
  { resource: "Minerai", quantity: 2 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Vivres", quantity: 4 },
  { resource: "Vivres", quantity: 4 },
];

const FISH_LOOT_2PA = [
  { resource: "Vivres", quantity: 1 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Vivres", quantity: 2 },
  { resource: "Bois", quantity: 4 },
  { resource: "Minerai", quantity: 4 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Vivres", quantity: 3 },
  { resource: "Bois", quantity: 6 },
  { resource: "Minerai", quantity: 5 },
  { resource: "Vivres", quantity: 5 },
  { resource: "Vivres", quantity: 5 },
  { resource: "Vivres", quantity: 10 },
  { resource: "GRIGRI", quantity: 1 }, // Special case - log only
];

async executeFish(characterId: string, paSpent: 1 | 2): Promise<CapabilityResult> {
  const lootTable = paSpent === 1 ? FISH_LOOT_1PA : FISH_LOOT_2PA;
  const randomIndex = Math.floor(Math.random() * lootTable.length);
  const loot = lootTable[randomIndex];

  if (loot.resource === "GRIGRI") {
    // Special case: log only, no resource added
    return {
      success: true,
      message: `${character.name} a trouvé un grigri !`,
      publicMessage: `${character.name} a trouvé un grigri !`,
    };
  }

  // Add resource to town stock
  // ... (standard resource addition logic)

  return {
    success: true,
    message: `Vous avez pêché ${loot.quantity} ${loot.resource}`,
    publicMessage: `${character.name} a pêché ${loot.quantity} ${loot.resource}`,
    loot: { [loot.resource.toLowerCase()]: loot.quantity }
  };
}
```

### 2.2 Add Bûcheronner (Woodcutting)

**Random yield:** 2-3 Bois

```typescript
async executeBûcheronner(characterId: string): Promise<CapabilityResult> {
  const character = await this.getCharacter(characterId);
  const yield = Math.floor(Math.random() * 2) + 2; // 2 or 3

  // Add wood to town stock
  await this.addResourceToTown(character.townId, "Bois", yield);

  return {
    success: true,
    message: `Vous avez récolté ${yield} bois`,
    publicMessage: `${character.name} a récolté ${yield} bois`,
    loot: { bois: yield }
  };
}
```

### 2.3 Add Miner (Mining)

**Cost:** 2 PA
**Random yield:** 2-6 Minerai

```typescript
async executeMiner(characterId: string): Promise<CapabilityResult> {
  const character = await this.getCharacter(characterId);
  const yield = Math.floor(Math.random() * 5) + 2; // 2-6

  // Add ore to town stock
  await this.addResourceToTown(character.townId, "Minerai", yield);

  return {
    success: true,
    message: `Vous avez miné ${yield} minerai`,
    publicMessage: `${character.name} a miné ${yield} minerai`,
    loot: { minerai: yield }
  };
}
```

---

## 🔨 Phase 3: Capacités CRAFT

### 3.1 Craft System Formula

**Universal formula for all crafts:**
```
Output = random(Input - 1, Input × 3)
```

**Examples:**
- Input 1 Bois → Output: 0-3 Tissu
- Input 5 Bois → Output: 4-15 Tissu

### 3.2 Craft Validation Rules

**ALL CRAFTS:**
- ❌ Cannot craft in DEPARTED expedition
- ✅ Can only craft in city
- ✅ Must have enough input resource in city stock
- ✅ PA cost depends on input amount chosen

**PA Cost:**
- 1 PA → Max 1 input resource
- 2 PA → Choice of 1-5 input resources

### 3.3 Implementation Pattern

**File:** `/backend/src/services/capability.service.ts`

```typescript
interface CraftConfig {
  inputResource: string;
  outputResource: string;
  name: string;
  verb: string; // "tissé", "forgé", "travaillé", "cuisiné"
}

const CRAFT_CONFIGS: Record<string, CraftConfig> = {
  tisser: {
    inputResource: "Bois",
    outputResource: "Tissu",
    name: "tisser",
    verb: "tissé"
  },
  forger: {
    inputResource: "Minerai",
    outputResource: "Fer",
    name: "forger",
    verb: "forgé"
  },
  travailler_le_bois: {
    inputResource: "Bois",
    outputResource: "Planches",
    name: "travailler le bois",
    verb: "travaillé"
  },
  cuisiner: {
    inputResource: "Vivres",
    outputResource: "Nourriture",
    name: "cuisiner",
    verb: "cuisiné"
  }
};

async executeCraft(
  characterId: string,
  craftType: string,
  inputAmount: number,
  paSpent: 1 | 2
): Promise<CapabilityResult> {

  const config = CRAFT_CONFIGS[craftType];
  const character = await this.getCharacterWithLocation(characterId);

  // Validation 1: Must be in city
  if (character.isInDepartedExpedition) {
    throw new Error("Impossible de crafted en expédition DEPARTED");
  }

  // Validation 2: PA vs Input amount
  if (paSpent === 1 && inputAmount > 1) {
    throw new Error("1 PA permet max 1 ressource en entrée");
  }
  if (paSpent === 2 && (inputAmount < 1 || inputAmount > 5)) {
    throw new Error("2 PA permet 1-5 ressources en entrée");
  }

  // Validation 3: Check stock
  const inputStock = await this.getTownResourceStock(
    character.townId,
    config.inputResource
  );

  if (inputStock < inputAmount) {
    throw new Error(`Stock insuffisant: ${inputStock}/${inputAmount} ${config.inputResource}`);
  }

  // Calculate output
  const minOutput = Math.max(0, inputAmount - 1);
  const maxOutput = inputAmount * 3;
  const outputAmount = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;

  // Execute craft
  await this.prisma.$transaction(async (tx) => {
    // Remove input
    await this.removeResourceFromTown(character.townId, config.inputResource, inputAmount, tx);

    // Add output
    await this.addResourceToTown(character.townId, config.outputResource, outputAmount, tx);

    // Deduct PA
    await this.deductPA(characterId, paSpent, tx);
  });

  const logMessage = `${character.name} a ${config.verb} ${inputAmount} ${config.inputResource} et obtenu ${outputAmount} ${config.outputResource}.`;

  return {
    success: true,
    message: `Vous avez obtenu ${outputAmount} ${config.outputResource}`,
    publicMessage: logMessage,
    loot: {
      [config.outputResource.toLowerCase()]: outputAmount
    }
  };
}
```

---

## 🔬 Phase 4: Capacités SCIENCE

### 4.1 Soigner (Heal)

**Two modes:**
- **1 PA:** Heal target +1 HP
- **2 PA:** Create 1 Cataplasme

```typescript
async executeSoigner(
  characterId: string,
  mode: 'heal' | 'craft',
  targetCharacterId?: string
): Promise<CapabilityResult> {

  const character = await this.getCharacter(characterId);

  if (mode === 'heal') {
    // Mode 1: Heal target
    if (!targetCharacterId) {
      throw new Error("Cible requise pour soigner");
    }

    const target = await this.getCharacter(targetCharacterId);

    if (target.hp >= 5) {
      throw new Error("La cible a déjà tous ses PV");
    }

    await this.prisma.character.update({
      where: { id: targetCharacterId },
      data: { hp: Math.min(5, target.hp + 1) }
    });

    return {
      success: true,
      message: `Vous avez soigné ${target.name} (+1 PV)`,
      publicMessage: `${character.name} soigne ${target.name} (+1 PV).`
    };

  } else {
    // Mode 2: Craft cataplasme

    // Check cataplasme limit (max 3 per town including expeditions)
    const cataplasmeCount = await this.getCataplasmeCount(character.townId);

    if (cataplasmeCount >= 3) {
      throw new Error("Limite de cataplasmes atteinte (max 3 par ville)");
    }

    await this.addResourceToTown(character.townId, "Cataplasme", 1);

    return {
      success: true,
      message: "Vous avez préparé un cataplasme",
      publicMessage: `${character.name} prépare un cataplasme.`
    };
  }
}

async getCataplasmeCount(townId: string): Promise<number> {
  // Count cataplasmes in city
  const cityStock = await this.prisma.resourceStock.findUnique({
    where: {
      locationType_locationId_resourceTypeId: {
        locationType: "CITY",
        locationId: townId,
        resourceTypeId: (await this.getResourceType("Cataplasme")).id
      }
    }
  });

  // Count cataplasmes in all town expeditions
  const expeditionStocks = await this.prisma.resourceStock.findMany({
    where: {
      locationType: "EXPEDITION",
      expedition: {
        townId: townId
      },
      resourceTypeId: (await this.getResourceType("Cataplasme")).id
    }
  });

  const cityCount = cityStock?.quantity || 0;
  const expeditionCount = expeditionStocks.reduce((sum, stock) => sum + stock.quantity, 0);

  return cityCount + expeditionCount;
}
```

### 4.2 Cataplasme Usage System

**New Endpoint:** `POST /characters/:id/use-cataplasme`

**File:** `/backend/src/controllers/characters.ts`

```typescript
export const useCataplasme: RequestHandler = async (req, res, next) => {
  try {
    const { id: characterId } = req.params;

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        expeditionMembers: {
          include: { expedition: true }
        }
      }
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    if (character.isDead) {
      throw createHttpError(400, "Personnage mort");
    }

    if (character.hp >= 5) {
      throw createHttpError(400, "PV déjà au maximum");
    }

    // Determine location (city or DEPARTED expedition)
    const departedExpedition = character.expeditionMembers.find(
      em => em.expedition.status === "DEPARTED"
    );

    const locationType = departedExpedition ? "EXPEDITION" : "CITY";
    const locationId = departedExpedition ? departedExpedition.expeditionId : character.townId;

    // Check cataplasme availability
    const cataplasmeType = await prisma.resourceType.findFirst({
      where: { name: "Cataplasme" }
    });

    const stock = await prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: cataplasmeType!.id
        }
      }
    });

    if (!stock || stock.quantity < 1) {
      throw createHttpError(400, "Aucun cataplasme disponible");
    }

    // Use cataplasme
    await prisma.$transaction(async (tx) => {
      // Remove 1 cataplasme
      await tx.resourceStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: 1 } }
      });

      // Heal +1 HP
      await tx.character.update({
        where: { id: characterId },
        data: { hp: Math.min(5, character.hp + 1) }
      });
    });

    res.json({
      success: true,
      message: `${character.name} utilise un cataplasme et retrouve des forces (+1 PV).`
    });

  } catch (error) {
    next(error);
  }
};
```

### 4.3 Research Capabilities (Analyser, Cartographier, Auspice)

**These are admin-resolved, but auto-log:**

```typescript
async executeResearch(
  characterId: string,
  researchType: 'analyser' | 'cartographier' | 'auspice',
  paSpent: 1 | 2,
  subject: string
): Promise<CapabilityResult> {

  const character = await this.getCharacter(characterId);

  const actionVerbs = {
    analyser: paSpent === 1 ? "étudie" : "analyse en profondeur",
    cartographier: paSpent === 1 ? "explore" : "cartographie en détail",
    auspice: paSpent === 1 ? "consulte les signes" : "pratique une divination approfondie"
  };

  const infoCount = paSpent === 1 ? 1 : 3;

  const logMessage = `${character.name} ${actionVerbs[researchType]} ${subject}. [${infoCount} info(s) - Résolution admin requise]`;

  return {
    success: true,
    message: `Recherche lancée (${infoCount} information(s))`,
    publicMessage: logMessage
  };
}
```

---

## 🎭 Phase 5: Capacités SOCIAL

### 5.1 Update Divertir (Entertain)

**Current system:** Counter increments, at 5 → spectacle
**Update:** Add PM bonus to all city characters

```typescript
async executeDivertir(characterId: string): Promise<CapabilityResult> {
  const character = await this.prisma.character.findUnique({
    where: { id: characterId }
  });

  const newCounter = character!.divertCounter + 1;

  if (newCounter < 5) {
    // Not ready for spectacle yet
    await this.prisma.character.update({
      where: { id: characterId },
      data: { divertCounter: newCounter }
    });

    return {
      success: true,
      message: `Vous préparez un spectacle (${newCounter}/5)`,
      publicMessage: `${character!.name} prépare un spectacle.`
    };

  } else {
    // Spectacle ready! +1 PM to all city characters

    await this.prisma.$transaction(async (tx) => {
      // Reset counter
      await tx.character.update({
        where: { id: characterId },
        data: { divertCounter: 0 }
      });

      // +1 PM to all characters in the same city (not in DEPARTED expeditions)
      const cityCharacters = await tx.character.findMany({
        where: {
          townId: character!.townId,
          isDead: false,
          expeditionMembers: {
            none: {
              expedition: { status: "DEPARTED" }
            }
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
    });

    return {
      success: true,
      message: "Votre spectacle remonte le moral de la ville !",
      publicMessage: `${character!.name} fait son spectacle. Toute la ville gagne +1 PM !`
    };
  }
}
```

---

## 🎨 Phase 6: UI Updates

### 6.1 /stock Command - Replace /foodstock

**File:** `/bot/src/commands/stock.ts` or create if missing

**Display all resources:**
- Group by category (base, transformé, science)
- Show emojis + quantities
- Add "Utiliser cataplasme" button if conditions met

```typescript
// Pseudo-code for /stock display

const resources = await getResourceStocks(townId, locationType, locationId);

const baseResources = resources.filter(r => r.category === 'base');
const transformedResources = resources.filter(r => r.category === 'transformé');
const scienceResources = resources.filter(r => r.category === 'science');

const embed = new EmbedBuilder()
  .setTitle(`📦 Stock de ${locationName}`)
  .addFields(
    {
      name: "🏗️ Ressources de base",
      value: baseResources.map(r => `${r.emoji} ${r.name}: ${r.quantity}`).join('\n')
    },
    {
      name: "🔨 Ressources transformées",
      value: transformedResources.map(r => `${r.emoji} ${r.name}: ${r.quantity}`).join('\n')
    },
    {
      name: "🔬 Ressources médicales",
      value: scienceResources.map(r => `${r.emoji} ${r.name}: ${r.quantity}`).join('\n')
    }
  );

// Add cataplasme button if conditions met
const buttons = [];

if (shouldShowCataplasmeButton(character, resources)) {
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`use_cataplasme:${character.id}`)
      .setLabel("🩹 Utiliser un cataplasme")
      .setStyle(ButtonStyle.Success)
  );
}
```

**Cataplasme button conditions:**
```typescript
function shouldShowCataplasmeButton(character, resources): boolean {
  // Character must be alive
  if (character.isDead) return false;

  // Character must have missing HP
  if (character.hp >= 5) return false;

  // Must have cataplasme in stock
  const cataplasme = resources.find(r => r.name === "Cataplasme");
  if (!cataplasme || cataplasme.quantity < 1) return false;

  return true;
}
```

### 6.2 Expedition Display Update

**File:** `/bot/src/features/expeditions/handlers/expedition-display.ts`

**Add same resource display + cataplasme button for DEPARTED expeditions**

### 6.3 Capability Selection UI

**File:** `/bot/src/features/users/users.handlers.ts` - Profile capability buttons

**Update for multi-PA capabilities:**
- Pêcher: Show "1 PA" and "2 PA" buttons
- Craft capabilities: Show "1 PA (max 1)" and "2 PA (choix 1-5)" buttons
- Soigner: Show "Soigner cible (1 PA)" and "Créer cataplasme (2 PA)" buttons

---

## ✅ Phase 7: Tests & Validation

### 7.1 Unit Tests (if creating)

**Test each capability:**
```typescript
describe('Capability V2 - CRAFT', () => {
  it('should craft with correct formula', async () => {
    // Test craft output = random(input-1, input*3)
  });

  it('should validate PA vs input amount', async () => {
    // 1 PA = max 1 input
    // 2 PA = 1-5 inputs
  });

  it('should block crafting in DEPARTED expedition', async () => {
    // Must be in city
  });
});

describe('Cataplasme System', () => {
  it('should enforce max 3 cataplasmes per town', async () => {
    // Count city + all expeditions
  });

  it('should heal +1 HP when used', async () => {
    // Consumes 1 cataplasme, heals 1 HP
  });
});
```

### 7.2 Manual Testing Checklist

**HARVEST:**
- [ ] Pêcher 1 PA - Correct loot table
- [ ] Pêcher 2 PA - Correct loot table + grigri handling
- [ ] Bûcheronner - Yields 2-3 bois
- [ ] Miner - Yields 2-6 minerai

**CRAFT:**
- [ ] Tisser 1 PA - Max 1 bois input
- [ ] Tisser 2 PA - Choice 1-5 bois input
- [ ] All craft formulas: Output = random(input-1, input*3)
- [ ] Cannot craft in DEPARTED expedition
- [ ] Stock validation works

**SCIENCE:**
- [ ] Soigner 1 PA - Heals target +1 HP
- [ ] Soigner 2 PA - Creates 1 cataplasme
- [ ] Cataplasme limit enforced (max 3 per town)
- [ ] "Utiliser cataplasme" button appears when conditions met
- [ ] Using cataplasme heals +1 HP and consumes stock

**SOCIAL:**
- [ ] Divertir counter increments (1-4)
- [ ] Divertir at 5 → spectacle + all city characters gain +1 PM
- [ ] Counter resets to 0 after spectacle

**UI:**
- [ ] /stock shows all resources grouped by category
- [ ] Cataplasme button only shows when valid
- [ ] Expedition stocks show cataplasme
- [ ] Multi-PA capability buttons work

---

## 📋 Checklist d'implémentation

### Database & Setup
- [ ] Update Prisma schema (add CRAFT, SCIENCE enums)
- [ ] Create migration
- [ ] Add Cataplasme to seed.ts
- [ ] Seed new capabilities
- [ ] Update character creation (grant base capabilities)

### Backend - Capability Service
- [ ] Update executeFish() - New loot tables
- [ ] Add executeBûcheronner()
- [ ] Add executeMiner()
- [ ] Add executeCraft() - Generic craft system
- [ ] Add executeSoigner() - Two modes
- [ ] Add getCataplasmeCount() helper
- [ ] Add executeResearch() - Admin capabilities
- [ ] Update executeDivertir() - PM bonus

### Backend - API Endpoints
- [ ] POST /characters/:id/use-cataplasme
- [ ] Update capability execution endpoints for multi-PA

### Bot - UI Updates
- [ ] Create/update /stock command (replace /foodstock)
- [ ] Add cataplasme button to stock display
- [ ] Add cataplasme button to expedition display
- [ ] Update profile capability buttons (multi-PA support)

### Documentation
- [ ] Update GAME-MECHANICS.md - Capabilities section
- [ ] Update CAPACITE.md - Complete V2 docs
- [ ] Create migration guide (if needed)

### Testing
- [ ] Test all HARVEST capabilities
- [ ] Test all CRAFT capabilities
- [ ] Test all SCIENCE capabilities
- [ ] Test SOCIAL capability (Divertir)
- [ ] Test UI displays
- [ ] Test cataplasme system end-to-end

---

## 🎯 Implementation Order (Recommended)

**Order for Supernova/Claude Code:**

1. **Phase 1:** Database (schema, migrations, seeds) - Foundational
2. **Phase 2:** HARVEST capabilities - Simplest logic
3. **Phase 3:** CRAFT capabilities - Core mechanic
4. **Phase 4:** SCIENCE capabilities - Complex (cataplasme system)
5. **Phase 5:** SOCIAL capability update - Single capability
6. **Phase 6:** UI updates - Requires backend complete
7. **Phase 7:** Testing & validation - Final phase

**Estimated time per phase:**
- Phase 1: 30 min (schema + seed)
- Phase 2: 45 min (3 capabilities)
- Phase 3: 90 min (generic craft system + 4 capabilities)
- Phase 4: 120 min (soigner + cataplasme system + API + 3 research caps)
- Phase 5: 20 min (divertir update)
- Phase 6: 60 min (UI updates, buttons)
- Phase 7: 60 min (testing)

**Total:** ~7-8 hours of implementation

---

## 📝 Notes for Continuation

**If session expires mid-implementation:**

1. Check which phases are completed (refer to checklist above)
2. Run `npm run build` in both backend and bot to check for errors
3. Check database with `npx prisma studio` to see which migrations/seeds ran
4. Resume from next incomplete phase

**Key files to check for progress:**
- `/backend/prisma/schema.prisma` - Enums updated?
- `/backend/prisma/seed.ts` - Cataplasme added?
- `/backend/src/services/capability.service.ts` - New methods?
- `/bot/src/commands/stock.ts` - Exists and updated?

---

**END OF SPECIFICATION**

**Ready for Supernova implementation** ✅
