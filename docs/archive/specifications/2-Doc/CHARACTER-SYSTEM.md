# Character System Implementation Guide

## 📋 Overview
This document describes the multi-character RPG system for the Discord bot, including database schema, business logic, and implementation notes.

---

## 🗄️ Database Schema Changes

### Key Relationships
- **Guild → Town**: 1:1 (each guild has exactly one town)
- **Town → Characters**: 1:N (a town has many characters)
- **User → Characters**: 1:N (a user can have multiple characters)
- **Character → Town**: N:1 (each character belongs to one town)

### Character Model Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | cuid() | Primary key |
| `name` | String | - | Character name (required) |
| `userId` | String | - | Foreign key to User |
| `townId` | String | - | Foreign key to Town |
| `paTotal` | Int | 2 | Action points (0-4) |
| `lastPaUpdate` | DateTime | now() | Last PA regeneration timestamp |
| `hungerLevel` | Int | 4 | 0=Mort, 1=Agonie, 2=Affamé, 3=Faim, 4=Sain |
| `isDead` | Boolean | false | Character death status |
| `canReroll` | Boolean | false | Permission to create new character |
| `isActive` | Boolean | false | Currently active character for user |
| `createdAt` | DateTime | now() | Creation timestamp |
| `updatedAt` | DateTime | auto | Last update timestamp |

### Constraints & Indexes

```prisma
@@unique([userId, townId, isActive], name: "one_active_per_user_town")
@@index([userId])
@@index([townId])
@@index([userId, townId])
```

**Important**: The unique constraint on `[userId, townId, isActive]` ensures:
- Only ONE active character per user per town
- Multiple inactive characters are allowed
- PostgreSQL will only enforce uniqueness when `isActive = true`

---

## 🎮 Bot Logic Implementation

### 1. Character Creation Flow

#### First Character Creation
```typescript
// When user first interacts with the bot in a town
async function handleFirstInteraction(userId: string, townId: string) {
  // Check if user has any character in this town
  const existingCharacter = await prisma.character.findFirst({
    where: { userId, townId, isActive: true }
  });

  if (!existingCharacter) {
    // Open modal for character name input
    await openCharacterCreationModal(interaction);
  }
}

// On modal submit
async function createCharacter(userId: string, townId: string, name: string) {
  const character = await prisma.character.create({
    data: {
      name,
      userId,
      townId,
      isActive: true,  // First character is active
      isDead: false,
      canReroll: false,
      hungerLevel: 4,
      paTotal: 2
    }
  });
  
  return character;
}
```

### 2. Character Death & Reroll

#### Handling Character Death
```typescript
async function handleCharacterDeath(characterId: string) {
  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      isDead: true,
      isActive: false,  // Dead character is no longer active
      hungerLevel: 0
    }
  });

  // Check if reroll is allowed
  if (character.canReroll) {
    await openRerollModal(character.userId, character.townId);
  } else {
    await sendDeathMessage(character.userId, {
      message: `💀 Votre personnage **${character.name}** est mort. Contactez un administrateur pour obtenir l'autorisation de créer un nouveau personnage.`
    });
  }
}
```

#### Reroll Process
```typescript
async function handleReroll(userId: string, townId: string, newName: string) {
  // Verify canReroll permission
  const deadCharacter = await prisma.character.findFirst({
    where: {
      userId,
      townId,
      isDead: true,
      canReroll: true
    }
  });

  if (!deadCharacter) {
    throw new Error("Vous n'avez pas l'autorisation de créer un nouveau personnage.");
  }

  // Create new character
  const newCharacter = await prisma.character.create({
    data: {
      name: newName,
      userId,
      townId,
      isActive: true,  // New character becomes active
      isDead: false,
      canReroll: false,
      hungerLevel: 4,
      paTotal: 2
    }
  });

  // Optional: Mark old character's canReroll as false to prevent multiple rerolls
  await prisma.character.update({
    where: { id: deadCharacter.id },
    data: { canReroll: false }
  });

  return newCharacter;
}
```

### 3. Active Character Management

#### Get Active Character
```typescript
async function getActiveCharacter(userId: string, townId: string) {
  const character = await prisma.character.findFirst({
    where: {
      userId,
      townId,
      isActive: true,
      isDead: false  // Active character must be alive
    }
  });

  if (!character) {
    throw new Error("Aucun personnage actif trouvé. Créez un personnage d'abord.");
  }

  return character;
}
```

#### Switch Active Character (Optional Feature)
```typescript
async function switchActiveCharacter(userId: string, townId: string, newActiveCharacterId: string) {
  await prisma.$transaction([
    // Deactivate current active character
    prisma.character.updateMany({
      where: {
        userId,
        townId,
        isActive: true
      },
      data: { isActive: false }
    }),
    
    // Activate new character
    prisma.character.update({
      where: {
        id: newActiveCharacterId,
        userId,  // Security: ensure user owns this character
        townId,
        isDead: false  // Can't activate dead character
      },
      data: { isActive: true }
    })
  ]);
}
```

### 4. Command Execution Pattern

All bot commands should follow this pattern:

```typescript
async function executeCommand(interaction: CommandInteraction) {
  const userId = interaction.user.id;
  
  // Get user from database
  const user = await getOrCreateUser(userId);
  
  // Get town for this guild
  const town = await getTownByGuildId(interaction.guildId);
  
  // Get active character
  const character = await getActiveCharacter(user.id, town.id);
  
  // Execute command logic with character
  await interaction.reply({
    content: `**${character.name}** effectue l'action...`
  });
}
```

---

## 🛠️ Admin Commands

### Set Reroll Permission
```typescript
// Command: /admin-reroll <user> <allow:true/false>
async function setRerollPermission(
  adminUserId: string,
  targetUserId: string,
  townId: string,
  allow: boolean
) {
  // Verify admin permissions
  if (!isAdmin(adminUserId)) {
    throw new Error("Permission refusée.");
  }

  // Find the dead character
  const character = await prisma.character.findFirst({
    where: {
      userId: targetUserId,
      townId,
      isDead: true,
      isActive: false
    },
    orderBy: { createdAt: 'desc' }  // Get most recent dead character
  });

  if (!character) {
    throw new Error("Aucun personnage mort trouvé pour cet utilisateur.");
  }

  await prisma.character.update({
    where: { id: character.id },
    data: { canReroll: allow }
  });

  return character;
}
```

### List All Characters in Town
```typescript
// Command: /admin-characters [user]
async function listCharacters(townId: string, userId?: string) {
  const where = userId 
    ? { townId, userId }
    : { townId };

  const characters = await prisma.character.findMany({
    where,
    include: {
      user: {
        select: {
          username: true,
          discordId: true
        }
      }
    },
    orderBy: [
      { isActive: 'desc' },
      { isDead: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  return characters;
}
```

### Force Character Death (Admin)
```typescript
// Command: /admin-kill <user>
async function forceKillCharacter(adminUserId: string, targetUserId: string, townId: string) {
  if (!isAdmin(adminUserId)) {
    throw new Error("Permission refusée.");
  }

  const character = await prisma.character.findFirst({
    where: {
      userId: targetUserId,
      townId,
      isActive: true
    }
  });

  if (!character) {
    throw new Error("Aucun personnage actif trouvé.");
  }

  await handleCharacterDeath(character.id);
}
```

---

## 📊 Database Migration

After updating the schema, run:

```bash
# Generate migration
npx prisma migrate dev --name add_character_death_system

# Or if in production
npx prisma migrate deploy
```

### Data Migration Considerations

If you have existing characters in the database:

```typescript
// Migration script to set first character as active for each user
async function migrateExistingCharacters() {
  const users = await prisma.user.findMany({
    include: {
      characters: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  for (const user of users) {
    if (user.characters.length > 0) {
      // Set first character as active
      await prisma.character.update({
        where: { id: user.characters[0].id },
        data: { isActive: true }
      });
    }
  }
}
```

---

## 🎨 User Experience Guidelines

### Messages to Display

#### Character Creation Success
```
✅ Bienvenue **{characterName}** !
Votre personnage a été créé avec succès dans **{townName}**.
```

#### Character Death (No Reroll)
```
💀 **{characterName}** est mort(e).
Vous ne pouvez pas créer de nouveau personnage pour le moment.
Contactez un administrateur pour obtenir l'autorisation.
```

#### Character Death (With Reroll)
```
💀 **{characterName}** est mort(e).
Vous avez l'autorisation de créer un nouveau personnage.
Cliquez sur le bouton ci-dessous pour commencer.
```

#### Reroll Success
```
✨ **{newCharacterName}** est né(e) !
Votre nouveau personnage est maintenant actif.
```

#### Command Execution
```
**{characterName}** {action description}
```

---

## ⚠️ Important Constraints

### Database Level
1. **Unique Active Character**: The `@@unique([userId, townId, isActive])` constraint ensures only one active character per user per town when `isActive = true`.
2. **Cascade Deletion**: If a User or Town is deleted, all associated characters are deleted (`onDelete: Cascade`).
3. **Indexes**: Optimized for queries on `userId`, `townId`, and combinations.

### Application Level
1. **Active Character Validation**: Always verify `isActive = true` AND `isDead = false` when getting active character.
2. **Reroll Permission**: Check `canReroll = true` before allowing character creation after death.
3. **Transaction Safety**: Use Prisma transactions when switching active characters to prevent race conditions.

### Business Rules
1. A user can have multiple characters in the same town (dead or alive).
2. Only ONE character can be active per user per town at any time.
3. Dead characters remain in the database (for history/admin purposes).
4. `canReroll` must be manually set by admins (default: false).
5. New characters after reroll start with default stats (PA=2, hunger=4).

---

## 🔍 Testing Checklist

- [ ] Create first character for new user
- [ ] Character becomes active automatically
- [ ] Kill character → verify `isDead = true`, `isActive = false`
- [ ] Try to use commands with dead character → should fail
- [ ] Set `canReroll = true` → modal appears
- [ ] Create new character → old stays dead, new becomes active
- [ ] Multiple characters per user in same town
- [ ] Cannot have 2 active characters simultaneously
- [ ] Admin commands work correctly
- [ ] Character switching (if implemented)
- [ ] Database constraints enforced

---

## 🚀 Next Steps

1. **Update Prisma Schema** ✅ (Done)
2. **Run Migration**: `npx prisma migrate dev`
3. **Update API Services**: Modify character service to use new fields
4. **Update Bot Commands**: Implement character creation modal
5. **Add Admin Commands**: `/admin-reroll`, `/admin-characters`, `/admin-kill`
6. **Update Existing Commands**: Use `getActiveCharacter()` pattern
7. **Add Death Handling**: Implement death triggers (hunger, combat, etc.)
8. **Test Thoroughly**: Follow testing checklist

---

## 📝 Code Examples Location

- **Character Service**: `backend/src/services/character.service.ts`
- **Bot Commands**: `bot/src/commands/`
- **Admin Commands**: `bot/src/commands/admin/`
- **Modals**: `bot/src/modals/character-creation.ts`
- **Death Handler**: `bot/src/handlers/death.handler.ts`
