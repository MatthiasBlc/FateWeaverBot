# Database Schema Quick Reference

## Most Important Patterns to Remember

### Pattern 1: ResourceType + ResourceStock (Stackable Items)
- **Use for**: Any quantifiable, stackable items (base resources, objects)
- **Key files**: `backend/src/services/resource.service.ts`
- **Structure**:
  ```prisma
  model ResourceType {
    id @id @default(autoincrement())  // INT, not UUID
    name String @unique
    emoji String
    category String
  }
  
  model ResourceStock {
    locationType LocationType  // CITY | EXPEDITION
    locationId String          // polymorphic: townId or expeditionId
    resourceTypeId Int
    quantity Int
    @@unique([locationType, locationId, resourceTypeId])
  }
  ```

### Pattern 2: M2M with Junction Table (Relationships without metadata)
- **Use for**: Skills owned, items equipped, etc. (no extra data)
- **Key file**: `backend/src/services/capability.service.ts`
- **Structure**:
  ```prisma
  model Capability { ... }
  model CharacterCapability {
    characterId String
    capabilityId String
    @@id([characterId, capabilityId])
  }
  ```

### Pattern 3: Admin Command Structure
- **File layout**:
  - `/bot/src/commands/admin-commands/object.ts` (command definition)
  - `/bot/src/features/admin/object.handlers.ts` (handlers)
  - `/backend/src/routes/objects.ts` (API routes)
  - `/backend/src/controllers/objects.ts` (controller)
  - `/backend/src/services/object.service.ts` (business logic)
- **Flow**: Command → Handler (Modal) → API → Service → Database
- **Example**: `/bot/src/features/admin/new-element-admin.handlers.ts`

---

## Key Models Already Exist

| Model | PK | Purpose |
|-------|----|---------| 
| Character | cuid | Player character with stats |
| User | cuid | Discord user account |
| Town | cuid | Shared location (shared storage) |
| Expedition | cuid | Mobile location (group storage) |
| ResourceType | Int | Type of stackable item |
| ResourceStock | Int | Quantity at a location |
| Capability | cuid | Player skill/ability |
| CharacterCapability | composite | Character has skill (M2M) |

---

## What's Missing (For Your Features)

```prisma
ObjectType              // Type of item (equipment, tool, quest)
CharacterInventory      // Inventory container per character
CharacterInventorySlot  // Item + quantity in inventory
ObjectSkillBonus        // Object grants this skill
ObjectCapacityBonus     // Object gives +X inventory capacity
ObjectResourceConversion // Object becomes X resources when acquired
```

---

## Service Method Patterns

### Add something to a location
```typescript
// Pattern from ResourceService
await this.prisma.resourceStock.upsert({
  where: {
    locationType_locationId_resourceTypeId: {
      locationType,
      locationId,
      resourceTypeId
    }
  },
  update: { quantity: { increment } },
  create: { locationType, locationId, resourceTypeId, quantity }
});
```

### Check if character has capability
```typescript
// Pattern from CapabilityService
async hasCapability(characterId: string, capabilityId: string): Promise<boolean> {
  const count = await this.prisma.characterCapability.count({
    where: { characterId, capabilityId }
  });
  return count > 0;
}
```

### Character can't do action if in DEPARTED expedition
```typescript
const departedExpedition = await this.prisma.expeditionMember.findFirst({
  where: {
    characterId,
    expedition: { status: "DEPARTED" }
  }
});
if (departedExpedition) throw new Error("Can't do action in DEPARTED expedition");
```

---

## API Route Patterns

### Standard CRUD for types
```
GET    /objects/types                 → List all types
POST   /objects/types                 → Create new type
GET    /objects/types/:typeId         → Get one type
PATCH  /objects/types/:typeId         → Update type
DELETE /objects/types/:typeId         → Delete type
```

### Character-specific operations
```
GET    /characters/:charId/inventory          → Get inventory
POST   /characters/:charId/inventory/:objId   → Add item to inventory
DELETE /characters/:charId/inventory/:objId   → Remove item
PATCH  /characters/:charId/inventory/:objId   → Update quantity
```

### Location-based operations (like resources)
```
GET    /inventories/CITY/:townId              → Get town inventory (if shared)
GET    /inventories/EXPEDITION/:expedId       → Get expedition inventory (if shared)
```

---

## Admin Command Flow Example

```typescript
// Command: /new-object-admin
// 1. Entry point shows button menu
const row = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    new ButtonBuilder().setCustomId("create_object").setLabel("Create Object"),
    new ButtonBuilder().setCustomId("edit_object").setLabel("Edit Object")
  );

// 2. Button click shows modal
const modal = new ModalBuilder()
  .setCustomId("new_object_modal")
  .setTitle("Create Object");
modal.addComponents(
  new ActionRowBuilder<TextInputBuilder>()
    .addComponents(new TextInputBuilder()
      .setCustomId("object_name")
      .setLabel("Object Name")
    )
);

// 3. Modal submission validates and calls API
const response = await apiService.objects.createObject({
  name, emoji, category, description
});
```

---

## Database ID Types to Use

| Scenario | Type | Example |
|----------|------|---------|
| Unique small integer type ID | Int @id @default(autoincrement()) | ResourceType, ObjectType |
| String UUID identifier | String @id @default(cuid()) | Character, User, Town |
| Foreign keys to Int types | Int @map("name") | resourceTypeId, objectTypeId |
| Foreign keys to String types | String @map("name") | characterId, townId |

---

## Migrations Quick Reference

```bash
# Create new migration
cd backend
npx prisma migrate dev --name add_inventory_system

# View migrations
ls prisma/migrations/

# Reset database (local dev only!)
npx prisma migrate reset
```

---

## Important Validation Rules

- Character can't use capabilities in DEPARTED expedition
- Can't transfer resources to same location
- Quantities must be >= 0
- Resource transfers use transactions
- Character has composite index on (userId, townId, isActive)
- ResourceStock has composite unique on (locationType, locationId, resourceTypeId)

---

## Testing Commands (if you need them)

```bash
# Build bot
cd bot
npm run build
npm run deploy  # Deploy new commands to Discord

# Start backend
cd backend
npm run dev

# Check Prisma schema
npx prisma validate
```

---

## Files to Read First (in order)

1. `/backend/prisma/schema.prisma` - Full schema (479 lines, organized clearly)
2. `/backend/src/services/resource.service.ts` - How to implement service patterns
3. `/bot/src/features/admin/new-element-admin.handlers.ts` - Admin command pattern
4. `/backend/src/controllers/resources.ts` - API controller pattern
5. `/backend/src/routes/resources.ts` - Route definitions

---

## Common Gotchas

1. **Don't use STRING for IDs in ResourceType** - Use INT @default(autoincrement())
2. **Don't forget @map("field_name")** - For snake_case database columns
3. **Always validate permissions** - Check checkAdmin() in handlers
4. **Use transactions** - For multi-step operations like transfers
5. **No profile command exists yet** - You'll need to create it or find existing endpoints
6. **Character-Town uniqueness is APPLICATION LEVEL** - Not enforced at DB (see comment line 95)

