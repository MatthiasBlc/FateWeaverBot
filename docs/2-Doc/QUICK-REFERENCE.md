# Character System Quick Reference

## 🎯 Key Concepts

- **Guild → Town**: 1:1 (each guild has one town)
- **User → Characters**: 1:N (multiple characters per user)
- **Character → Town**: N:1 (characters belong to towns)
- **Active Character**: Only ONE per user per town
- **Dead Characters**: Stay in DB, can be rerolled if `canReroll = true`

---

## 📦 Character Model

```prisma
model Character {
  id           String   @id @default(cuid())
  name         String   // Required
  userId       String
  townId       String
  paTotal      Int      @default(2)
  hungerLevel  Int      @default(4)
  isDead       Boolean  @default(false)
  canReroll    Boolean  @default(false)
  isActive     Boolean  @default(false)
  // ... timestamps, relations
}
```

---

## 🔧 Common Operations

### Get Active Character

```typescript
const character = await prisma.character.findFirst({
  where: {
    userId: user.id,
    townId: town.id,
    isActive: true,
    isDead: false  // ⚠️ Always check both!
  }
});
```

### Create First Character

```typescript
const character = await prisma.character.create({
  data: {
    name: characterName,
    userId: user.id,
    townId: town.id,
    isActive: true,  // First = active
    isDead: false,
    canReroll: false
  }
});
```

### Kill Character

```typescript
await prisma.character.update({
  where: { id: characterId },
  data: {
    isDead: true,
    isActive: false,  // ⚠️ Must deactivate!
    hungerLevel: 0
  }
});
```

### Grant Reroll Permission (Admin)

```typescript
await prisma.character.update({
  where: { id: deadCharacterId },
  data: { canReroll: true }
});
```

### Create Reroll Character

```typescript
// 1. Check permission
const deadChar = await prisma.character.findFirst({
  where: {
    userId,
    townId,
    isDead: true,
    canReroll: true
  }
});

if (!deadChar) throw new Error('No reroll permission');

// 2. Create new character
const newChar = await prisma.character.create({
  data: {
    name: newName,
    userId,
    townId,
    isActive: true,
    isDead: false,
    canReroll: false
  }
});

// 3. Revoke permission
await prisma.character.update({
  where: { id: deadChar.id },
  data: { canReroll: false }
});
```

### Switch Active Character

```typescript
await prisma.$transaction([
  // Deactivate current
  prisma.character.updateMany({
    where: { userId, townId, isActive: true },
    data: { isActive: false }
  }),
  // Activate new
  prisma.character.update({
    where: { id: newCharId, userId, townId, isDead: false },
    data: { isActive: true }
  })
]);
```

---

## 🎮 Bot Command Pattern

```typescript
async function executeCommand(interaction: CommandInteraction) {
  // 1. Get user
  const user = await getOrCreateUser(interaction.user.id);
  
  // 2. Get town
  const town = await getTownByGuildId(interaction.guildId);
  
  // 3. Get active character
  const character = await prisma.character.findFirst({
    where: {
      userId: user.id,
      townId: town.id,
      isActive: true,
      isDead: false
    }
  });
  
  // 4. Handle no character
  if (!character) {
    await openCharacterCreationModal(interaction);
    return;
  }
  
  // 5. Execute command
  await interaction.reply({
    content: `**${character.name}** fait quelque chose...`
  });
}
```

---

## ⚠️ Critical Rules

### ✅ DO

- Always check `isActive = true` AND `isDead = false`
- Use transactions when switching active characters
- Verify user ownership before operations
- Revoke `canReroll` after use
- Set `isActive = false` when killing character

### ❌ DON'T

- Don't allow multiple active characters per user/town
- Don't forget to check `isDead` status
- Don't allow reroll without permission
- Don't skip ownership validation
- Don't use `updateMany` without `where` conditions

---

## 🗂️ Useful Queries

### List User's Characters

```typescript
const characters = await prisma.character.findMany({
  where: { userId, townId },
  orderBy: [
    { isActive: 'desc' },
    { isDead: 'asc' },
    { createdAt: 'desc' }
  ]
});
```

### Count Active Characters (Debug)

```typescript
const count = await prisma.character.count({
  where: { userId, townId, isActive: true }
});
// Should always be 0 or 1
```

### Find Rerollable Characters

```typescript
const rerollable = await prisma.character.findMany({
  where: {
    userId,
    townId,
    isDead: true,
    canReroll: true
  }
});
```

---

## 🔐 Security Checklist

- [ ] Verify user owns character before operations
- [ ] Check admin permissions for admin commands
- [ ] Validate town belongs to guild
- [ ] Use parameterized queries (Prisma does this)
- [ ] Never expose internal IDs to users (use Discord IDs)

---

## 📊 Database Constraints

```prisma
// Only one active character per user per town
@@unique([userId, townId, isActive], name: "one_active_per_user_town")

// Indexes for performance
@@index([userId])
@@index([townId])
@@index([userId, townId])
```

---

## 🚀 Migration Commands

```bash
# 1. Ensure all guilds have towns
npx tsx scripts/ensure-towns.ts

# 2. Run migration
npx prisma migrate dev --name character_death_system

# 3. Migrate existing characters
npx tsx scripts/migrate-characters-to-towns.ts

# 4. Verify
npx prisma studio
```

---

## 🧪 Testing Scenarios

1. **First character creation**: User has no character → modal opens
2. **Character death**: `isDead = true`, `isActive = false`
3. **Reroll denied**: `canReroll = false` → error message
4. **Reroll allowed**: `canReroll = true` → modal opens
5. **Multiple characters**: User can have multiple inactive characters
6. **Active switch**: Only one active at a time
7. **Command execution**: Always uses active character

---

## 📚 Documentation Files

- **CHARACTER-SYSTEM.md**: Full implementation guide
- **MIGRATION-GUIDE.md**: Step-by-step migration process
- **SCHEMA-CONSTRAINTS.md**: Detailed constraints and patterns
- **QUICK-REFERENCE.md**: This file (quick lookup)

---

## 🆘 Troubleshooting

### Error: "Unique constraint violation"

**Cause**: Trying to set two characters as active for same user/town

**Solution**: Use transaction to deactivate others first

### Error: "Character not found"

**Cause**: No active character exists

**Solution**: Prompt user to create character

### Error: "Cannot reroll"

**Cause**: `canReroll = false`

**Solution**: Admin must grant permission first

### Error: "name cannot be null"

**Cause**: Trying to create character without name

**Solution**: Always collect name via modal

---

## 💡 Tips

- Use `findFirst` instead of `findUnique` for active character (no unique constraint on it)
- Always include `isDead: false` in active character queries
- Use `orderBy` to show active characters first in lists
- Log character operations for debugging
- Test with multiple characters per user
- Use Prisma Studio to inspect database state
