# FateWeaverBot Database Schema Analysis

## Executive Summary

The current database schema provides a solid foundation for implementing inventory and item systems. The codebase uses **Prisma ORM** with **PostgreSQL** and follows well-established patterns for resource management, relationships, and admin command handling.

**Key Insight**: The `ResourceType` + `ResourceStock` pattern is the primary way to handle plural, stackable items in the system. New models like `ObjectType`, `CharacterInventory`, and `ObjectSkillBonus` should follow this same architectural approach.

---

## 1. Current Database Structure

### 1.1 Core Models Relevant to Your Features

#### **Character Model** (Lines 69-100)
```
- id: String (PK)
- name: String
- userId: String (FK to User)
- townId: String (FK to Town)
- paTotal: Int (0-4, Action Points)
- hp: Int (0-5)
- pm: Int (0-5)
- hungerLevel: Int
- isDead: Boolean
- capabilities: CharacterCapability[] (many-to-many)
- expeditionMembers: ExpeditionMember[] (many-to-many)
```

**No inventory field exists yet** - you'll need to add a relationship to a new `CharacterInventory` model.

#### **ResourceType Model** (Lines 360-374)
```
- id: Int (PK, autoincrement)
- name: String (unique)
- emoji: String
- category: String ('base', 'transformé', 'science')
- description: String (optional)
- stocks: ResourceStock[] (one-to-many)
- chantierCosts: ChantierResourceCost[]
- projectCosts: ProjectResourceCost[]
```

**Pattern Note**: ResourceType has an `id: Int` with autoincrement, not a UUID. This is important for consistency.

#### **ResourceStock Model** (Lines 376-394)
```
- id: Int (PK, autoincrement)
- locationType: LocationType enum (CITY | EXPEDITION)
- locationId: String (polymorphic foreign key)
- resourceTypeId: Int (FK to ResourceType)
- quantity: Int
- town: Town? (optional relation)
- expedition: Expedition? (optional relation)
- resourceType: ResourceType

Unique Constraint: [locationType, locationId, resourceTypeId]
```

**Key Pattern**: Uses a **polymorphic pattern** where `locationType` + `locationId` identifies the owner (either a Town or Expedition). This is how to handle storage in different locations.

#### **Capability Model** (Lines 218-230)
```
- id: String (cuid)
- name: String (unique)
- emojiTag: String
- category: CapabilityCategory (HARVEST | CRAFT | SCIENCE | SPECIAL)
- costPA: Int
- description: String (optional)
- characters: CharacterCapability[] (many-to-many)
```

#### **CharacterCapability Model** (Lines 232-242)
```
Composite Key: [characterId, capabilityId]
Pure junction table - no extra fields
```

**Pattern Note**: For M2M relationships, Prisma uses explicit junction tables. You'll likely use this pattern for `ObjectSkillBonus` relationships.

#### **Location Models**
- **Town**: Represents a city/settlement. Has `resourceStocks`, `expeditions`, `characters`
- **Expedition**: Mobile location with members, status, resources. Also has `resourceStocks`

### 1.2 Key Enums

```typescript
// ResourceType categories
enum ResourceTypeCategory {
  BASE        // "base"
  TRANSFORMED // "transformé"
  SCIENCE     // "science"
}

// Capability categories
enum CapabilityCategory {
  HARVEST
  SPECIAL
  CRAFT
  SCIENCE
}

// Location types (for polymorphic storage)
enum LocationType {
  CITY
  EXPEDITION
}

// Expedition status affects character availability
enum ExpeditionStatus {
  PLANNING
  LOCKED
  DEPARTED
  RETURNED
}
```

---

## 2. Patterns & Best Practices to Follow

### 2.1 ResourceType Pattern (What You Should Emulate)

The system uses **discrete resource types** with **location-based storage**:

```prisma
model ResourceType {
  id             Int    @id @default(autoincrement())
  name           String @unique
  emoji          String
  category       String
  stocks         ResourceStock[] @relation("ResourceTypeToResourceStock")
}

model ResourceStock {
  id             Int
  locationType   LocationType  // CITY or EXPEDITION
  locationId     String        // townId or expeditionId
  resourceTypeId Int           // FK to ResourceType
  quantity       Int
  
  @@unique([locationType, locationId, resourceTypeId])
}
```

**Why This Works**:
- Quantities are naturally stackable (one row per resource type per location)
- Polymorphic - can store in towns OR expeditions
- Efficient queries with composite unique index
- Easy to query: "Give me all resources in town X"

### 2.2 Capability-Character Pattern (M2M Pattern)

For M2M relationships with no extra data:
```prisma
model Capability { ... }
model CharacterCapability { // junction table
  characterId String
  capabilityId String
  character Capability @relation(...)
  capability Capability @relation(...)
  @@id([characterId, capabilityId])
}
```

**When to Use**: Links with no extra metadata (like "owns skill X")
**When NOT to Use**: If you need metadata (like "skill level 3" or "skill learned at date")

### 2.3 Admin Command Pattern

All admin commands follow this structure:

```
/new-element-admin           <- Command entry point
  ├─ handleNewElementAdminCommand()    <- Main handler (button display)
  │  └─ Displays button menu (Capability | Resource)
  │
  ├─ handleNewCapabilityButton()      <- Button handler
  │  └─ Shows modal with form fields
  │
  └─ handleCapabilityModalSubmit()    <- Modal submission handler
     └─ Validates + calls API service
        └─ apiService.capabilities.createCapability()
```

**Key Files**:
- Command definition: `/bot/src/commands/admin-commands/new-element-admin.ts`
- Handlers: `/bot/src/features/admin/new-element-admin.handlers.ts`
- Backend routes: `/backend/src/routes/admin/*.ts`
- Backend controllers: `/backend/src/controllers/capabilities.ts`
- Backend services: `/backend/src/services/capability.service.ts`

**Pattern**: Command → Handler → Modal Form → API Call → Service Logic → Database

### 2.4 API Service Pattern

The bot communicates with backend via `apiService`:

```typescript
// In bot handlers
const response = await apiService.resources.createResourceType({
  name, emoji, category, description
});

// Service definition (bot/src/services/api.ts)
resources: {
  createResourceType: (data) => 
    api.post('/resources/types', data)
}
```

### 2.5 Location-Based Operations

Character inventory should support storage at multiple locations:

```typescript
// Resources can be in:
- Town (LocationType.CITY) - shared storage
- Expedition (LocationType.EXPEDITION) - portable inventory
- Character (NEW) - personal inventory

// Pattern to follow:
const inventory = await prisma.characterInventory.findMany({
  where: { characterId },
  include: { objects: true }
});
```

---

## 3. Recommended Schema Design for New Features

### 3.1 Objects/Inventory System

```prisma
model ObjectType {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  emoji       String
  category    String  // "equipment", "tool", "quest", "crafting"
  description String?
  
  // Inventory relationships
  inventorySlots CharacterInventorySlot[]
  
  // Relationship metadata
  skillBonuses    ObjectSkillBonus[]
  capacityBonuses ObjectCapacityBonus[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("object_types")
}

model CharacterInventory {
  id          String   @id @default(cuid())
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  characterId String   @map("character_id")
  
  slots       CharacterInventorySlot[]
  capacity    Int      @default(10)  // Max slots
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([characterId])
  @@map("character_inventories")
}

model CharacterInventorySlot {
  id          String   @id @default(cuid())
  inventory   CharacterInventory @relation(fields: [inventoryId], references: [id], onDelete: Cascade)
  inventoryId String   @map("inventory_id")
  
  objectType   ObjectType @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  objectTypeId Int        @map("object_type_id")
  
  quantity    Int      @default(1)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([inventoryId, objectTypeId])
  @@map("character_inventory_slots")
}

model ObjectSkillBonus {
  id         String   @id @default(cuid())
  object     ObjectType @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  objectTypeId Int      @map("object_type_id")
  
  skill      Capability @relation(fields: [capabilityId], references: [id], onDelete: Cascade)
  capabilityId String   @map("capability_id")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([objectTypeId, capabilityId])
  @@map("object_skill_bonuses")
}

model ObjectCapacityBonus {
  id         String   @id @default(cuid())
  object     ObjectType @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  objectTypeId Int      @map("object_type_id")
  
  bonusAmount Int      // e.g., +5 capacity
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("object_capacity_bonuses")
}

// For objects that convert to resources when picked up
model ObjectResourceConversion {
  id         String   @id @default(cuid())
  object     ObjectType @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  objectTypeId Int      @map("object_type_id")
  
  resource   ResourceType @relation(fields: [resourceTypeId], references: [id], onDelete: Cascade)
  resourceTypeId Int      @map("resource_type_id")
  
  conversionRatio Float  // 1 object = X resources
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([objectTypeId, resourceTypeId])
  @@map("object_resource_conversions")
}
```

### 3.2 Design Rationale

**Integer IDs for ObjectType**: Matches ResourceType pattern for consistency
**Composite key in inventory slots**: Prevents duplicate entries efficiently
**Separate bonus tables**: Follows Prisma convention for optional relationships
**Resource conversion table**: Handles "object becomes resource" mechanic

---

## 4. Existing Admin Commands Structure

### 4.1 Available Admin Commands

```
/character-admin
  ├─ View/edit character stats
  ├─ Manage capabilities
  ├─ Kill character
  └─ Toggle reroll

/new-element-admin
  ├─ Create new capability
  └─ Create new resource type

/stock-admin
  ├─ Add/remove resources
  ├─ Transfer resources
  └─ View stocks

/expeditions-admin
  ├─ Manage expeditions
  └─ Emergency returns

/chantiers-admin
  └─ Manage construction projects

/projets-admin
  └─ Manage crafting projects

/season-admin
  └─ Change seasons
```

### 4.2 Command Registration

All commands are in `/bot/src/commands/admin-commands/` and follow this pattern:
1. Import handler function
2. Create SlashCommandBuilder
3. Execute → call handler
4. Handlers use modals/buttons for UI

**Key Pattern**: Handlers are separate from command definitions, making them reusable and testable.

---

## 5. Backend API Routes Pattern

### 5.1 Existing Resource Routes

```
GET    /resources/types                  - Get all resource types
GET    /resources/CITY/:townId           - Get town resources
GET    /resources/EXPEDITION/:expedId    - Get expedition resources
POST   /resources/types                  - Create resource type
POST   /resources/CITY/:townId/:resId    - Add resource to town
PATCH  /resources/CITY/:townId/:resId    - Update resource quantity
DELETE /resources/CITY/:townId/:resId    - Remove resource
```

### 5.2 Pattern for New Routes

For objects, follow the same structure:
```
GET    /objects/types                     - List all object types
GET    /characters/:charId/inventory      - Get character inventory
POST   /objects/types                     - Create object type
POST   /characters/:charId/inventory/add  - Add object to inventory
DELETE /characters/:charId/inventory/remove - Remove from inventory
```

---

## 6. Service Layer Pattern

### 6.1 ResourceService Example

Location: `/backend/src/services/resource.service.ts`

Key methods:
- `getLocationResources(locationType, locationId)` - Get all resources
- `addResourceToLocation(locationType, locationId, resourceName, quantity)`
- `removeResourceFromLocation(...)`
- `transferResource(fromLocation, toLocation, resourceName, quantity)`

**Key Pattern**:
- Use Prisma transactions for multi-step operations
- Find by name (not ID) in public methods for usability
- Validate quantities and existence before modifying
- Use `upsert()` for create-or-update operations

### 6.2 CapabilityService Example

Location: `/backend/src/services/capability.service.ts`

Key methods:
- `getCharacterCapabilities(characterId)` - Get all skills
- `addCapabilityToCharacter(characterId, capabilityId)`
- `removeCapabilityFromCharacter(...)`
- `hasCapability(characterId, capabilityId)` - Check if character has skill
- `executeHarvestCapacity(...)` - Use a capability

**Key Pattern**:
- Heavy use of transactions for consistency
- Validation helpers (validateCanUsePA, etc.)
- Event logging for important actions

---

## 7. Profile Command Pattern

**Status**: No `/profil` command found in current codebase.

However, based on the admin commands pattern, a profile command would:
1. Be defined in `/bot/src/commands/user-commands/`
2. Call a handler in `/bot/src/features/users/`
3. Display character stats via embeds
4. Call API service: `apiService.characters.getCharacter()`

**Expected Structure**:
```
GET /characters/:characterId  - Get full character with inventory + capabilities
```

---

## 8. Key Files to Reference

### Backend Database
- `/backend/prisma/schema.prisma` - Main schema (479 lines)
- `/backend/src/services/resource.service.ts` - Resource patterns
- `/backend/src/services/capability.service.ts` - M2M & service patterns
- `/backend/src/services/character.service.ts` - Character operations

### Bot Command Handlers
- `/bot/src/features/admin/new-element-admin.handlers.ts` - Admin pattern
- `/bot/src/features/admin/character-admin.handlers.ts` - Complex admin UI
- `/bot/src/features/admin/stock-admin/` - Inventory-like operations

### API Routes
- `/backend/src/routes/capabilities.ts` - Route pattern
- `/backend/src/routes/resources.ts` - Resource API

---

## 9. Important Constraints & Validations

### 9.1 Character Restrictions
- Can't use capabilities while in DEPARTED expedition (many methods check this)
- Agonie (hp=1) + Affamé (hungerLevel=0) = can't use certain actions
- Character must have capability before using it

### 9.2 Resource Constraints
- Resources can only be in CITY or EXPEDITION locations
- Transfers use transactions to ensure consistency
- Quantities must be validated before decrements

### 9.3 Database Constraints
- Character-Town unique constraint is **applied at application level** (see line 95 comment)
- ResourceStock has composite unique index
- Capability names are globally unique

---

## 10. Migration & Setup

### 10.1 Creating New Tables

Use Prisma migrations:
```bash
cd backend
npx prisma migrate dev --name add_inventory_system
```

This will:
1. Create migration in `/backend/prisma/migrations/[timestamp]_add_inventory_system/`
2. Run migration automatically against development DB
3. Regenerate Prisma client

### 10.2 Migration File Structure

Each migration has:
- `migration.sql` - The actual SQL
- `metadata.json` - Prisma metadata

**Important**: Don't edit migration.sql files after they're applied.

---

## 11. Summary: Implementation Roadmap

To implement the five features, follow this order:

1. **ObjectType Model** - Base for all object features
   - Add `ObjectType` model with basic fields
   - Create admin command `/new-object-admin` (copy pattern from `/new-element-admin`)
   - Add API routes for CRUD operations

2. **Inventory System** - Store objects on character
   - Add `CharacterInventory` + `CharacterInventorySlot` models
   - Create inventory service with add/remove methods
   - Add routes: GET/POST/DELETE inventory endpoints

3. **Object-Skill Relationship** - Objects grant skills
   - Add `ObjectSkillBonus` model
   - Create view command showing "this object grants X skill"
   - Implement logic: when object acquired, check for skill bonuses

4. **Object-Capacity Relationship** - Objects give capacity bonus
   - Add `ObjectCapacityBonus` model
   - Modify character profile to show: `baseCapacity + objectBonuses`
   - Update inventory UI to reflect actual vs max capacity

5. **Resource Bag Objects** - Objects convert to resources
   - Add `ObjectResourceConversion` model
   - Create logic: when object picked up, convert to resources
   - Track in daily event logs

**Each feature should**:
- Add service methods (backend)
- Add API routes with validation
- Add Discord command or button handler
- Add database migration
- Include appropriate error handling & logging

