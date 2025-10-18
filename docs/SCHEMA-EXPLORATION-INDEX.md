# Database Schema Exploration - Complete Index

Generated: October 16, 2025

## Documents Created

This exploration created two comprehensive reference documents to guide your feature implementation:

### 1. Full Analysis Document
**File**: `/home/bouloc/Repo/FateWeaverBot/docs/database-schema-analysis.md` (17 KB)

**Contents**:
- Executive summary of current architecture
- Detailed breakdown of all 34 existing models and enums
- Complete ResourceType + ResourceStock pattern explanation
- M2M junction table patterns
- Admin command structure and patterns
- Recommended Prisma schema design for your 5 features
- Backend API route patterns
- Service layer patterns with examples
- Important constraints and validations
- Database migration guidance
- Implementation roadmap with prioritized steps

**Use this for**: Understanding the full context, design decisions, and comprehensive implementation guidance

### 2. Quick Reference Document
**File**: `/home/bouloc/Repo/FateWeaverBot/docs/schema-quick-reference.md` (6 KB)

**Contents**:
- Three key patterns to remember with code snippets
- Summary table of existing models
- Missing models for your features
- Service method pattern examples
- API route templates
- Admin command flow example
- Database ID type reference
- Migration quick commands
- Important validation rules
- Common gotchas to avoid
- Priority reading order

**Use this for**: Quick lookups, copy-paste patterns, and reminders while coding

---

## Key Findings Summary

### Current Architecture

The FateWeaverBot uses a well-structured architecture with:
- **Frontend**: Discord bot (Discord.js with TypeScript)
- **Backend**: Express API with Prisma ORM
- **Database**: PostgreSQL with snake_case naming
- **Communication**: Bot calls backend API services

### Three Core Patterns to Follow

#### Pattern 1: ResourceType + ResourceStock
For stackable, quantifiable items with location-based storage.

Used by: Food, wood, minerals, potions, objects

Files to study:
- `/home/bouloc/Repo/FateWeaverBot/backend/src/services/resource.service.ts`
- `/home/bouloc/Repo/FateWeaverBot/backend/src/controllers/resources.ts`

#### Pattern 2: M2M Junction Tables
For relationships between entities without extra metadata.

Used by: Character-Capability links, Character-Role links

Files to study:
- `/home/bouloc/Repo/FateWeaverBot/backend/src/services/capability.service.ts`

#### Pattern 3: Admin Command Structure
Command → Handler (Modal) → API → Service → Database

Used by: `/new-element-admin`, `/character-admin`, `/stock-admin`

Files to study:
- `/home/bouloc/Repo/FateWeaverBot/bot/src/commands/admin-commands/new-element-admin.ts`
- `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/new-element-admin.handlers.ts`

---

## Your Feature Implementation Plan

### Feature 1: Objects and Inventory System
**Models to create**:
- ObjectType
- CharacterInventory
- CharacterInventorySlot

**Timeline**: Foundation for all other features

### Feature 2: Skills System
Already exists! See: `Capability` and `CharacterCapability` models

### Feature 3: Object-Skill Relationship
**Model to create**:
- ObjectSkillBonus (M2M junction)

**Depends on**: Features 1 & 2

### Feature 4: Object-Capacity Relationship
**Model to create**:
- ObjectCapacityBonus

**Depends on**: Feature 1

### Feature 5: Resource Bag Objects
**Model to create**:
- ObjectResourceConversion

**Depends on**: Feature 1

---

## File Reference by Component

### Database Schema
- **Main Schema**: `/home/bouloc/Repo/FateWeaverBot/backend/prisma/schema.prisma`
- **Migrations**: `/home/bouloc/Repo/FateWeaverBot/backend/prisma/migrations/`

### Bot Commands
- **Admin Commands**: `/home/bouloc/Repo/FateWeaverBot/bot/src/commands/admin-commands/`
- **User Commands**: `/home/bouloc/Repo/FateWeaverBot/bot/src/commands/user-commands/`
- **Command Handlers**: `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/`

### Backend Services
- **Services**: `/home/bouloc/Repo/FateWeaverBot/backend/src/services/`
  - `resource.service.ts` - Resource management
  - `capability.service.ts` - Skill/capability management
  - `character.service.ts` - Character operations
- **Controllers**: `/home/bouloc/Repo/FateWeaverBot/backend/src/controllers/`
- **Routes**: `/home/bouloc/Repo/FateWeaverBot/backend/src/routes/`

---

## Models to Create (for your 5 features)

```prisma
// Feature 1: Objects and Inventory
model ObjectType {
  id          Int
  name        String @unique
  emoji       String
  category    String
  description String?
  inventorySlots CharacterInventorySlot[]
  skillBonuses ObjectSkillBonus[]
  capacityBonuses ObjectCapacityBonus[]
}

model CharacterInventory {
  id          String @id @default(cuid())
  characterId String @unique
  character   Character @relation(...)
  slots       CharacterInventorySlot[]
  capacity    Int @default(10)
}

model CharacterInventorySlot {
  id             String @id @default(cuid())
  inventoryId    String
  inventory      CharacterInventory @relation(...)
  objectTypeId   Int
  objectType     ObjectType @relation(...)
  quantity       Int @default(1)
  @@unique([inventoryId, objectTypeId])
}

// Feature 3: Object-Skill Relationship
model ObjectSkillBonus {
  id           String @id @default(cuid())
  objectTypeId Int
  object       ObjectType @relation(...)
  capabilityId String
  skill        Capability @relation(...)
  @@unique([objectTypeId, capabilityId])
}

// Feature 4: Object-Capacity Relationship
model ObjectCapacityBonus {
  id           String @id @default(cuid())
  objectTypeId Int
  object       ObjectType @relation(...)
  bonusAmount  Int
}

// Feature 5: Resource Bag Objects
model ObjectResourceConversion {
  id              String @id @default(cuid())
  objectTypeId    Int
  object          ObjectType @relation(...)
  resourceTypeId  Int
  resource        ResourceType @relation(...)
  conversionRatio Float
  @@unique([objectTypeId, resourceTypeId])
}
```

---

## Important Constraints to Remember

### Character Restrictions
- Can't use abilities in DEPARTED expedition
- Must own capability to use it
- Agonie + Affamé = restricted actions
- Character-Town uniqueness is APPLICATION LEVEL (not DB enforced)

### Resource/Inventory Constraints
- Items can be in: Town (CITY) or Expedition (EXPEDITION) or Character (NEW)
- Use transactions for multi-step operations
- Validate quantities before decrements

### Database Constraints
- ResourceStock composite unique on (locationType, locationId, resourceTypeId)
- Use Int @id @default(autoincrement()) for type IDs (like ResourceType)
- Use String @id @default(cuid()) for entities (like Character)

---

## Next Steps

1. Read `/home/bouloc/Repo/FateWeaverBot/docs/database-schema-analysis.md` - Full context
2. Review `/home/bouloc/Repo/FateWeaverBot/docs/schema-quick-reference.md` - Quick patterns
3. Study reference files in this order:
   - `/home/bouloc/Repo/FateWeaverBot/backend/prisma/schema.prisma`
   - `/home/bouloc/Repo/FateWeaverBot/backend/src/services/resource.service.ts`
   - `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/new-element-admin.handlers.ts`
4. Create migration: `npx prisma migrate dev --name add_inventory_system`
5. Implement features following the roadmap in the full analysis doc

---

## Document Statistics

- **Full Analysis**: 11 sections, 479 lines, 17 KB
- **Quick Reference**: 6 sections, 160 lines, 6 KB
- **Current Schema**: 34 models/enums, 479 lines
- **Key Services Analyzed**: 3 (Resource, Capability, Character)
- **Admin Commands Found**: 7

---

## Related Documentation

- Project overview: `/home/bouloc/Repo/FateWeaverBot/README.md`
- Local setup: `/home/bouloc/Repo/FateWeaverBot/README-local.md`
- Project instructions: `/home/bouloc/Repo/FateWeaverBot/CLAUDE.md`
- Architecture reference: `/home/bouloc/Repo/FateWeaverBot/.claude/reference.md`

---

## Quick Command Reference

```bash
# Create migration
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma migrate dev --name add_inventory_system

# View migrations
ls /home/bouloc/Repo/FateWeaverBot/backend/prisma/migrations/

# Validate schema
npx prisma validate

# Generate Prisma client
npx prisma generate

# Build and deploy bot
cd /home/bouloc/Repo/FateWeaverBot/bot
npm run build
npm run deploy
```

---

Generated by: Claude Code Analysis Tool
Analysis Date: October 16, 2025
Thoroughness Level: Very Thorough
Repository: /home/bouloc/Repo/FateWeaverBot
