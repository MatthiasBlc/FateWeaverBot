# Schema Constraints & Implementation Notes

## 🔒 Critical Database Constraints

### 1. One Active Character Per User Per Town

**Constraint:**
```prisma
@@unique([userId, townId, isActive], name: "one_active_per_user_town")
```

**How it works:**
- PostgreSQL partial unique index
- Only enforces uniqueness when `isActive = true`
- Allows multiple inactive characters per user per town
- Prevents race conditions at database level

**Example scenarios:**
```typescript
// ✅ ALLOWED: Multiple inactive characters
User A in Town X:
  - Character 1: isActive = false, isDead = true
  - Character 2: isActive = false, isDead = false
  - Character 3: isActive = true, isDead = false  // Only one active

// ❌ BLOCKED: Two active characters
User A in Town X:
  - Character 1: isActive = true   // First active
  - Character 2: isActive = true   // ERROR: Violates unique constraint
```

### 2. Guild → Town (1:1 Relationship)

**Constraint:**
```prisma
guildId String @unique @map("guild_id")
```

**Implications:**
- Each guild has exactly ONE town
- Each town belongs to exactly ONE guild
- Cascade delete: If guild is deleted, town is deleted
- Must create town when creating guild

**Code pattern:**
```typescript
// Create guild with town
const guild = await prisma.guild.create({
  data: {
    discordGuildId: '123456789',
    name: 'My Server',
    town: {
      create: {
        name: 'Main Town',
        foodStock: 100
      }
    }
  }
});

// Get town from guild
const town = await prisma.town.findUnique({
  where: { guildId: guild.id }
});
```

### 3. Character → Town (Many-to-One)

**Constraint:**
```prisma
town Town @relation(fields: [townId], references: [id], onDelete: Cascade)
```

**Implications:**
- Characters belong to towns, not guilds directly
- If town is deleted, all characters are deleted
- Multiple characters can exist in the same town
- Characters are scoped to towns for multi-server support

### 4. Character Name Required

**Constraint:**
```prisma
name String  // Not nullable
```

**Implications:**
- Must provide name when creating character
- Use modal to collect name from user
- No default/auto-generated names
- Enforce at database level

---

## ⚙️ Indexes for Performance

### Character Indexes

```prisma
@@index([userId])           // Fast lookup by user
@@index([townId])           // Fast lookup by town
@@index([userId, townId])   // Fast lookup for user's characters in town
```

**Query optimization:**
```typescript
// ✅ FAST: Uses index
const activeChar = await prisma.character.findFirst({
  where: { userId: 'user123', townId: 'town456', isActive: true }
});

// ✅ FAST: Uses index
const userChars = await prisma.character.findMany({
  where: { userId: 'user123', townId: 'town456' }
});

// ⚠️ SLOWER: Full table scan (no index on isDead alone)
const deadChars = await prisma.character.findMany({
  where: { isDead: true }
});
```

---

## 🎯 Business Logic Constraints

### 1. Active Character Rules

**Application-level enforcement:**

```typescript
// Rule: Active character must be alive
async function getActiveCharacter(userId: string, townId: string) {
  const character = await prisma.character.findFirst({
    where: {
      userId,
      townId,
      isActive: true,
      isDead: false  // ⚠️ Important: Check both conditions
    }
  });

  if (!character) {
    throw new Error('No active living character found');
  }

  return character;
}
```

**Why both checks?**
- `isActive = true` ensures it's the selected character
- `isDead = false` ensures it's alive
- Dead characters should have `isActive = false`, but double-check for safety

### 2. Character Death Flow

**Required steps:**

```typescript
async function killCharacter(characterId: string) {
  // Step 1: Mark as dead and inactive
  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      isDead: true,
      isActive: false,  // ⚠️ Must set to false
      hungerLevel: 0
    }
  });

  // Step 2: Check reroll permission
  if (character.canReroll) {
    // Open modal for new character
    await openRerollModal(character.userId, character.townId);
  } else {
    // Notify user they cannot reroll
    await notifyCannotReroll(character.userId);
  }
}
```

**Critical:** Always set `isActive = false` when setting `isDead = true`

### 3. Character Creation After Death

**Validation required:**

```typescript
async function createRerollCharacter(
  userId: string,
  townId: string,
  newName: string
) {
  // Step 1: Verify permission
  const deadCharacter = await prisma.character.findFirst({
    where: {
      userId,
      townId,
      isDead: true,
      canReroll: true  // ⚠️ Must check permission
    },
    orderBy: { createdAt: 'desc' }  // Get most recent dead character
  });

  if (!deadCharacter) {
    throw new Error('No reroll permission found');
  }

  // Step 2: Create new character
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

  // Step 3: Revoke reroll permission (optional, prevents multiple rerolls)
  await prisma.character.update({
    where: { id: deadCharacter.id },
    data: { canReroll: false }
  });

  return newCharacter;
}
```

### 4. Switching Active Character

**Transaction required:**

```typescript
async function switchActiveCharacter(
  userId: string,
  townId: string,
  newActiveCharacterId: string
) {
  // Use transaction to prevent race conditions
  await prisma.$transaction([
    // Step 1: Deactivate all characters
    prisma.character.updateMany({
      where: {
        userId,
        townId,
        isActive: true
      },
      data: { isActive: false }
    }),

    // Step 2: Activate new character
    prisma.character.update({
      where: {
        id: newActiveCharacterId,
        userId,  // Security: ensure user owns this character
        townId,
        isDead: false  // Cannot activate dead character
      },
      data: { isActive: true }
    })
  ]);
}
```

**Why transaction?**
- Prevents two active characters temporarily
- Atomic operation (all or nothing)
- Handles concurrent requests safely

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Check isDead

```typescript
// ❌ BAD: Only checks isActive
const character = await prisma.character.findFirst({
  where: { userId, townId, isActive: true }
});
// Could return a dead character if isActive wasn't set to false!

// ✅ GOOD: Checks both
const character = await prisma.character.findFirst({
  where: { userId, townId, isActive: true, isDead: false }
});
```

### Pitfall 2: Not Using Transactions for Active Switch

```typescript
// ❌ BAD: Race condition possible
await prisma.character.updateMany({
  where: { userId, townId, isActive: true },
  data: { isActive: false }
});
// Another request could set isActive=true here!
await prisma.character.update({
  where: { id: newId },
  data: { isActive: true }
});

// ✅ GOOD: Atomic transaction
await prisma.$transaction([
  prisma.character.updateMany(...),
  prisma.character.update(...)
]);
```

### Pitfall 3: Allowing Multiple Rerolls

```typescript
// ❌ BAD: User could reroll multiple times
async function reroll(userId: string, townId: string, name: string) {
  const deadChar = await prisma.character.findFirst({
    where: { userId, townId, isDead: true, canReroll: true }
  });
  
  if (deadChar) {
    return await prisma.character.create({
      data: { name, userId, townId, isActive: true }
    });
    // canReroll still true! User can reroll again!
  }
}

// ✅ GOOD: Revoke permission after use
async function reroll(userId: string, townId: string, name: string) {
  const deadChar = await prisma.character.findFirst({
    where: { userId, townId, isDead: true, canReroll: true }
  });
  
  if (deadChar) {
    const newChar = await prisma.character.create({
      data: { name, userId, townId, isActive: true }
    });
    
    // Revoke reroll permission
    await prisma.character.update({
      where: { id: deadChar.id },
      data: { canReroll: false }
    });
    
    return newChar;
  }
}
```

### Pitfall 4: Not Handling First Character Creation

```typescript
// ❌ BAD: Assumes character exists
async function executeCommand(userId: string, townId: string) {
  const character = await getActiveCharacter(userId, townId);
  // Throws error if no character exists!
}

// ✅ GOOD: Check and prompt for creation
async function executeCommand(userId: string, townId: string) {
  let character = await prisma.character.findFirst({
    where: { userId, townId, isActive: true, isDead: false }
  });

  if (!character) {
    // Prompt user to create character
    await openCharacterCreationModal(userId, townId);
    return;
  }

  // Execute command with character
}
```

---

## 📊 Query Patterns

### Get Active Character (Most Common)

```typescript
const character = await prisma.character.findFirst({
  where: {
    userId: user.id,
    townId: town.id,
    isActive: true,
    isDead: false
  }
});
```

### Get All User Characters in Town

```typescript
const characters = await prisma.character.findMany({
  where: {
    userId: user.id,
    townId: town.id
  },
  orderBy: [
    { isActive: 'desc' },  // Active first
    { isDead: 'asc' },     // Alive before dead
    { createdAt: 'desc' }  // Newest first
  ]
});
```

### Get Dead Characters Eligible for Reroll

```typescript
const rerollableCharacters = await prisma.character.findMany({
  where: {
    userId: user.id,
    townId: town.id,
    isDead: true,
    canReroll: true
  }
});
```

### Get All Characters in Town (Admin)

```typescript
const allCharacters = await prisma.character.findMany({
  where: { townId: town.id },
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
```

---

## 🔐 Security Considerations

### 1. Always Verify Ownership

```typescript
// ❌ BAD: No ownership check
async function killCharacter(characterId: string) {
  await prisma.character.update({
    where: { id: characterId },
    data: { isDead: true }
  });
}

// ✅ GOOD: Verify user owns character
async function killCharacter(userId: string, characterId: string) {
  await prisma.character.update({
    where: {
      id: characterId,
      userId: userId  // Ensures user owns this character
    },
    data: { isDead: true }
  });
}
```

### 2. Validate Town Belongs to Guild

```typescript
// ✅ Verify town belongs to the guild where command was issued
async function getCharacter(userId: string, guildId: string) {
  const town = await prisma.town.findUnique({
    where: { guildId: guild.id }
  });

  if (!town) {
    throw new Error('Town not found for this guild');
  }

  return await getActiveCharacter(userId, town.id);
}
```

### 3. Admin Permission Checks

```typescript
async function setRerollPermission(
  adminUserId: string,
  targetUserId: string,
  townId: string,
  allow: boolean
) {
  // Check admin permissions first
  const adminMember = await interaction.guild.members.fetch(adminUserId);
  if (!adminMember.permissions.has('Administrator')) {
    throw new Error('Permission denied');
  }

  // Then perform action
  await prisma.character.updateMany({
    where: { userId: targetUserId, townId, isDead: true },
    data: { canReroll: allow }
  });
}
```

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] All guilds have towns (1:1 relationship)
- [ ] Character names are never null
- [ ] Only one active character per user per town
- [ ] Dead characters have `isActive = false`
- [ ] Reroll permission is checked before character creation
- [ ] Transactions used for active character switching
- [ ] Ownership verified in all character operations
- [ ] Indexes exist for common queries
- [ ] Cascade deletes configured correctly
- [ ] Migration scripts tested on staging data
