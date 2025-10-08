# Migration Guide: Character Death & Multi-Character System

## 📋 Overview

This guide covers the database migration from the old single-character-per-guild system to the new multi-character-per-town system with death/reroll mechanics.

---

## 🔄 Schema Changes Summary

### Character Model Changes

| Change | Old | New | Impact |
|--------|-----|-----|--------|
| **Relationship** | Character → Guild | Character → Town | Breaking change |
| **Unique constraint** | `[userId, guildId]` | `[userId, townId, isActive]` | Allows multiple characters |
| **Name field** | `String?` (nullable) | `String` (required) | Must provide name |
| **New fields** | - | `isDead`, `canReroll`, `isActive` | New functionality |
| **hungerLevel default** | 0 | 4 | Starts healthy |

### Breaking Changes

1. **Character.guildId → Character.townId**: Characters now belong to towns, not guilds directly
2. **Character.name**: Now required (was optional)
3. **Unique constraint removed**: Users can now have multiple characters per town
4. **Guild.characters relation removed**: Characters accessed via Town

---

## 🚀 Migration Steps

### Step 1: Backup Database

```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Review Current Data

```sql
-- Check existing characters
SELECT 
  c.id,
  c.name,
  c."user_id",
  c."guild_id",
  u.username,
  g.name as guild_name
FROM characters c
JOIN users u ON c."user_id" = u.id
JOIN guilds g ON c."guild_id" = g.id;

-- Check guilds without towns
SELECT g.id, g.name, g."discord_guild_id"
FROM guilds g
LEFT JOIN towns t ON t."guild_id" = g.id
WHERE t.id IS NULL;
```

### Step 3: Ensure All Guilds Have Towns

Before migrating characters, ensure every guild has a town:

```typescript
// Script: scripts/ensure-towns.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureAllGuildsHaveTowns() {
  const guildsWithoutTowns = await prisma.guild.findMany({
    where: {
      town: null
    }
  });

  console.log(`Found ${guildsWithoutTowns.length} guilds without towns`);

  for (const guild of guildsWithoutTowns) {
    const town = await prisma.town.create({
      data: {
        name: `${guild.name} - Ville`,
        guildId: guild.id,
        foodStock: 100
      }
    });
    console.log(`Created town ${town.name} for guild ${guild.name}`);
  }

  console.log('✅ All guilds now have towns');
}

ensureAllGuildsHaveTowns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
cd backend
npx tsx scripts/ensure-towns.ts
```

### Step 4: Create Migration

```bash
cd backend
npx prisma migrate dev --name character_death_system
```

This will:
1. Add new columns: `is_dead`, `can_reroll`, `is_active`
2. Change `name` to NOT NULL (may fail if existing nulls)
3. Add `town_id` column
4. Remove `guild_id` column
5. Update constraints and indexes

### Step 5: Handle Migration Errors

#### Error: "name" column contains NULL values

If you have characters with NULL names:

```sql
-- Option 1: Set default names before migration
UPDATE characters 
SET name = 'Personnage ' || id 
WHERE name IS NULL;

-- Option 2: Delete characters without names (if acceptable)
DELETE FROM characters WHERE name IS NULL;
```

Then retry the migration.

#### Error: Foreign key constraint fails

If the migration fails due to foreign keys:

```sql
-- Check orphaned characters (characters with invalid guild_id)
SELECT c.* 
FROM characters c
LEFT JOIN guilds g ON c."guild_id" = g.id
WHERE g.id IS NULL;

-- Delete orphaned characters if any
DELETE FROM characters 
WHERE "guild_id" NOT IN (SELECT id FROM guilds);
```

### Step 6: Data Migration Script

After schema migration, migrate existing character data:

```typescript
// Script: scripts/migrate-characters-to-towns.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCharactersToTowns() {
  console.log('🔄 Starting character migration to towns...');

  // This migration is handled by Prisma automatically if you:
  // 1. First add townId as nullable
  // 2. Populate townId from guildId
  // 3. Make townId required
  // 4. Remove guildId

  // Get all characters and set them as active
  const characters = await prisma.character.findMany({
    include: {
      user: true,
      town: true
    }
  });

  console.log(`Found ${characters.length} characters to process`);

  // Group characters by user and town
  const userTownMap = new Map<string, string[]>();

  for (const char of characters) {
    const key = `${char.userId}-${char.townId}`;
    if (!userTownMap.has(key)) {
      userTownMap.set(key, []);
    }
    userTownMap.get(key)!.push(char.id);
  }

  // Set the first character as active for each user-town combination
  let updatedCount = 0;
  for (const [key, characterIds] of userTownMap.entries()) {
    // Set first character as active
    await prisma.character.update({
      where: { id: characterIds[0] },
      data: { 
        isActive: true,
        isDead: false,
        canReroll: false
      }
    });
    updatedCount++;

    // Set others as inactive
    if (characterIds.length > 1) {
      await prisma.character.updateMany({
        where: {
          id: { in: characterIds.slice(1) }
        },
        data: {
          isActive: false,
          isDead: false,
          canReroll: false
        }
      });
    }
  }

  console.log(`✅ Migration complete: ${updatedCount} active characters set`);
}

migrateCharactersToTowns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
cd backend
npx tsx scripts/migrate-characters-to-towns.ts
```

### Step 7: Verify Migration

```sql
-- Check all characters have required fields
SELECT 
  c.id,
  c.name,
  c."town_id",
  c."is_active",
  c."is_dead",
  c."can_reroll",
  t.name as town_name,
  u.username
FROM characters c
JOIN towns t ON c."town_id" = t.id
JOIN users u ON c."user_id" = u.id;

-- Verify only one active character per user per town
SELECT 
  c."user_id",
  c."town_id",
  COUNT(*) as active_count
FROM characters c
WHERE c."is_active" = true
GROUP BY c."user_id", c."town_id"
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check for any NULL names
SELECT COUNT(*) FROM characters WHERE name IS NULL;
-- Should return 0
```

---

## 🔧 Alternative: Step-by-Step Migration

If the automatic migration fails, use this manual approach:

### Migration SQL (Step-by-Step)

```sql
-- Step 1: Add new columns as nullable first
ALTER TABLE characters ADD COLUMN "town_id" TEXT;
ALTER TABLE characters ADD COLUMN "is_dead" BOOLEAN DEFAULT false;
ALTER TABLE characters ADD COLUMN "can_reroll" BOOLEAN DEFAULT false;
ALTER TABLE characters ADD COLUMN "is_active" BOOLEAN DEFAULT false;

-- Step 2: Populate town_id from guild_id
UPDATE characters c
SET "town_id" = (
  SELECT t.id 
  FROM towns t 
  WHERE t."guild_id" = c."guild_id"
)
WHERE c."town_id" IS NULL;

-- Step 3: Set first character as active for each user-town
WITH ranked_characters AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "user_id", "town_id" 
      ORDER BY "created_at" ASC
    ) as rn
  FROM characters
)
UPDATE characters c
SET "is_active" = true
FROM ranked_characters rc
WHERE c.id = rc.id AND rc.rn = 1;

-- Step 4: Make name NOT NULL (handle nulls first)
UPDATE characters SET name = 'Personnage ' || id WHERE name IS NULL;
ALTER TABLE characters ALTER COLUMN name SET NOT NULL;

-- Step 5: Make town_id NOT NULL and add foreign key
ALTER TABLE characters ALTER COLUMN "town_id" SET NOT NULL;
ALTER TABLE characters ADD CONSTRAINT "characters_town_id_fkey" 
  FOREIGN KEY ("town_id") REFERENCES towns(id) ON DELETE CASCADE;

-- Step 6: Drop old constraint and guild_id
ALTER TABLE characters DROP CONSTRAINT IF EXISTS "characters_user_id_guild_id_key";
ALTER TABLE characters DROP COLUMN "guild_id";

-- Step 7: Add new unique constraint
CREATE UNIQUE INDEX "one_active_per_user_town" 
  ON characters("user_id", "town_id", "is_active") 
  WHERE "is_active" = true;

-- Step 8: Add indexes
CREATE INDEX "characters_user_id_idx" ON characters("user_id");
CREATE INDEX "characters_town_id_idx" ON characters("town_id");
CREATE INDEX "characters_user_id_town_id_idx" ON characters("user_id", "town_id");

-- Step 9: Update hungerLevel default for new characters
ALTER TABLE characters ALTER COLUMN "hunger_level" SET DEFAULT 4;
```

---

## 🧪 Testing After Migration

### Test Checklist

```bash
# 1. Verify schema
cd backend
npx prisma validate

# 2. Generate new Prisma client
npx prisma generate

# 3. Run tests
npm test

# 4. Check database state
npx prisma studio
```

### Manual Tests

1. **Create new character**: Should work with modal
2. **View active character**: Should show correct character
3. **Kill character**: Set `isDead = true`, `isActive = false`
4. **Try reroll without permission**: Should fail
5. **Grant reroll permission**: Admin command
6. **Create new character after death**: Should work
7. **Multiple characters per user**: Verify in database

---

## ⚠️ Rollback Plan

If migration fails and you need to rollback:

```bash
# 1. Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 2. Revert Prisma schema
git checkout HEAD~1 backend/prisma/schema.prisma

# 3. Regenerate client
cd backend
npx prisma generate

# 4. Restart services
npm run dev
```

---

## 📊 Expected Data Changes

### Before Migration
```
characters table:
- id, name (nullable), user_id, guild_id, paTotal, hungerLevel, etc.
- Unique: [user_id, guild_id]
```

### After Migration
```
characters table:
- id, name (required), user_id, town_id, paTotal, hungerLevel
- isDead, canReroll, isActive (new fields)
- Unique: [user_id, town_id, isActive] (when isActive = true)
```

---

## 🎯 Post-Migration Tasks

1. **Update API endpoints**: Modify character routes to use townId
2. **Update bot commands**: Use new character service methods
3. **Add admin commands**: `/admin-reroll`, `/admin-characters`
4. **Update documentation**: API docs, bot command help
5. **Monitor logs**: Check for errors in production
6. **User communication**: Announce new multi-character feature

---

## 📞 Support

If you encounter issues during migration:

1. Check logs: `docker logs backend` or `npm run dev`
2. Verify database state: `npx prisma studio`
3. Review error messages carefully
4. Restore from backup if needed
5. Contact database admin if stuck

---

## ✅ Migration Complete

Once migration is successful:

- [ ] Database schema updated
- [ ] All characters have townId
- [ ] Active characters set correctly
- [ ] Tests passing
- [ ] Bot commands working
- [ ] Admin tools functional
- [ ] Documentation updated
- [ ] Backup created and verified
