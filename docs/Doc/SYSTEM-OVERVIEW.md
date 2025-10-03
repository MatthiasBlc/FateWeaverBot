# Character System Overview

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Discord Guild                            │
│                      (Discord Server)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ 1:1
                             ▼
                    ┌─────────────────┐
                    │      Guild      │
                    │   (Database)    │
                    └────────┬────────┘
                             │ 1:1
                             ▼
                    ┌─────────────────┐
                    │      Town       │
                    │  - foodStock    │
                    └────────┬────────┘
                             │ 1:N
                 ┌───────────┴───────────┐
                 ▼                       ▼
        ┌─────────────────┐     ┌─────────────────┐
        │   Character 1   │     │   Character 2   │
        │  - name         │     │  - name         │
        │  - isActive ✓   │     │  - isActive ✗   │
        │  - isDead ✗     │     │  - isDead ✓     │
        │  - canReroll ✗  │     │  - canReroll ✓  │
        └────────┬────────┘     └────────┬────────┘
                 │                       │
                 └───────────┬───────────┘
                             │ N:1
                             ▼
                    ┌─────────────────┐
                    │      User       │
                    │  (Discord User) │
                    └─────────────────┘
```

---

## 🔄 Character Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHARACTER LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

1️⃣ CREATION (First Interaction)
   ┌─────────────────────────────────────────┐
   │ User joins guild / First command        │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ Check: Has active character?            │
   └──────────────────┬──────────────────────┘
                      │ No
                      ▼
   ┌─────────────────────────────────────────┐
   │ Open modal: Enter character name        │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ Create character:                       │
   │  - isActive = true                      │
   │  - isDead = false                       │
   │  - canReroll = false                    │
   │  - hungerLevel = 4                      │
   │  - paTotal = 2                          │
   └──────────────────┬──────────────────────┘
                      ▼
              [ACTIVE CHARACTER]

2️⃣ ACTIVE PHASE (Normal Gameplay)
   ┌─────────────────────────────────────────┐
   │ Character is active and alive           │
   │  - isActive = true                      │
   │  - isDead = false                       │
   └──────────────────┬──────────────────────┘
                      │
                      ▼
   ┌─────────────────────────────────────────┐
   │ User executes commands                  │
   │  - /work, /explore, /build, etc.        │
   │  - Bot uses active character            │
   └──────────────────┬──────────────────────┘
                      │
                      ▼
   ┌─────────────────────────────────────────┐
   │ Character stats change:                 │
   │  - PA consumed/regenerated              │
   │  - Hunger increases/decreases           │
   └──────────────────┬──────────────────────┘
                      │
                      ▼ hungerLevel = 0
              [CHARACTER DEATH]

3️⃣ DEATH (Character Dies)
   ┌─────────────────────────────────────────┐
   │ Character dies (hunger, combat, etc.)   │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ Update character:                       │
   │  - isDead = true                        │
   │  - isActive = false                     │
   │  - hungerLevel = 0                      │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ Check: canReroll?                       │
   └──────┬────────────────────────┬─────────┘
          │ No                     │ Yes
          ▼                        ▼
   ┌──────────────┐      ┌──────────────────┐
   │ Send message:│      │ Open modal:      │
   │ "Contact     │      │ "Create new      │
   │  admin for   │      │  character"      │
   │  reroll"     │      │                  │
   └──────────────┘      └────────┬─────────┘
                                  ▼
                         [NEW CHARACTER]

4️⃣ REROLL (Create New Character)
   ┌─────────────────────────────────────────┐
   │ Admin grants reroll permission:         │
   │  - canReroll = true                     │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ User creates new character              │
   │  - Old character: isDead=true, inactive │
   │  - New character: isActive=true, alive  │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ Revoke reroll permission:               │
   │  - Old character: canReroll = false     │
   └──────────────────┬──────────────────────┘
                      ▼
              [ACTIVE CHARACTER]
              (Back to phase 2)
```

---

## 🎮 User Experience Flow

### Scenario 1: New User

```
User: /work
Bot: 👋 Bienvenue ! Créez votre personnage pour commencer.
     [Modal opens: "Nom de votre personnage"]

User: Enters "Aragorn"
Bot: ✅ Bienvenue Aragorn ! Votre personnage a été créé.

User: /work
Bot: **Aragorn** travaille et gagne 2 PA.
```

### Scenario 2: Character Death (No Reroll)

```
User: /explore
Bot: **Aragorn** explore... mais meurt de faim ! 💀
     Votre personnage est mort. Contactez un administrateur.

User: /work
Bot: ❌ Votre personnage est mort. Vous ne pouvez pas effectuer cette action.

Admin: /admin-reroll @User allow:true
Bot: ✅ @User peut maintenant créer un nouveau personnage.

User: /work
Bot: 💀 Votre personnage est mort. Créez un nouveau personnage.
     [Modal opens: "Nom de votre personnage"]
```

### Scenario 3: Character Death (With Reroll)

```
User: /explore
Bot: **Aragorn** explore... mais meurt de faim ! 💀
     Vous pouvez créer un nouveau personnage.
     [Modal opens automatically]

User: Enters "Legolas"
Bot: ✨ Bienvenue Legolas ! Votre nouveau personnage est actif.

User: /work
Bot: **Legolas** travaille et gagne 2 PA.
```

### Scenario 4: Multiple Characters

```
User has:
  - Character 1: "Aragorn" (isDead=true, isActive=false)
  - Character 2: "Legolas" (isDead=false, isActive=true)

User: /work
Bot: **Legolas** travaille et gagne 2 PA.
     (Always uses active character)

Admin: /admin-characters @User
Bot: Personnages de @User:
     ✅ **Legolas** (Actif, Vivant)
     💀 **Aragorn** (Inactif, Mort)
```

---

## 🔑 Key Features

### ✅ Multi-Character Support

- Users can have multiple characters in the same town
- Only ONE character can be active at a time
- Dead characters remain in database (history)
- Can switch between living characters (optional feature)

### 🎭 Death & Reroll System

- Characters can die (hunger, combat, etc.)
- Dead characters become inactive automatically
- Admin controls reroll permission
- Reroll creates new character, old stays in DB

### 🏰 Town-Based System

- Characters belong to towns, not guilds directly
- Each guild has exactly one town
- Supports future multi-town expansion
- Isolated character data per town

### 🛡️ Safety & Constraints

- Database-level unique constraint (one active per user/town)
- Transaction-safe active character switching
- Cascade deletes (town deleted → characters deleted)
- Ownership validation on all operations

---

## 📊 Database Schema Summary

```prisma
model Guild {
  id             String   @id
  discordGuildId String   @unique
  town           Town?    // 1:1
}

model Town {
  id         String      @id
  guildId    String      @unique  // 1:1 with Guild
  characters Character[] // 1:N
}

model User {
  id         String      @id
  discordId  String      @unique
  characters Character[] // 1:N
}

model Character {
  id          String   @id
  name        String   // Required
  userId      String   // FK to User
  townId      String   // FK to Town
  isDead      Boolean  @default(false)
  canReroll   Boolean  @default(false)
  isActive    Boolean  @default(false)
  
  // Unique: Only one active per user/town
  @@unique([userId, townId, isActive])
}
```

---

## 🚀 Implementation Checklist

### Phase 1: Database

- [x] Update Prisma schema
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Verify schema: `npx prisma validate`
- [ ] Test constraints in Prisma Studio

### Phase 2: Backend API

- [ ] Update character service
  - [ ] `getActiveCharacter(userId, townId)`
  - [ ] `createCharacter(userId, townId, name)`
  - [ ] `killCharacter(characterId)`
  - [ ] `grantReroll(characterId)`
  - [ ] `createRerollCharacter(userId, townId, name)`
- [ ] Update character routes
  - [ ] GET `/characters/:userId/:townId`
  - [ ] POST `/characters/create`
  - [ ] POST `/characters/reroll`
  - [ ] PATCH `/characters/:id/kill`
- [ ] Add validation middleware

### Phase 3: Bot Commands

- [ ] Update existing commands to use active character
  - [ ] `/work`
  - [ ] `/explore`
  - [ ] `/build`
  - [ ] etc.
- [ ] Add character creation modal
- [ ] Add death handler
- [ ] Add reroll modal

### Phase 4: Admin Commands

- [ ] `/admin-reroll <user> <allow:boolean>`
- [ ] `/admin-characters [user]`
- [ ] `/admin-kill <user>` (optional)
- [ ] `/admin-revive <user>` (optional)

### Phase 5: Testing

- [ ] Unit tests for character service
- [ ] Integration tests for API routes
- [ ] Bot command tests
- [ ] Database constraint tests
- [ ] User flow tests

### Phase 6: Deployment

- [ ] Backup production database
- [ ] Run migration scripts
- [ ] Deploy backend
- [ ] Deploy bot
- [ ] Monitor logs
- [ ] Announce to users

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **SYSTEM-OVERVIEW.md** | This file - high-level overview |
| **CHARACTER-SYSTEM.md** | Full implementation guide with code examples |
| **MIGRATION-GUIDE.md** | Step-by-step database migration process |
| **SCHEMA-CONSTRAINTS.md** | Detailed constraints, patterns, and pitfalls |
| **QUICK-REFERENCE.md** | Quick lookup for common operations |

---

## 🎓 Learning Resources

### Prisma Documentation

- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Unique Constraints](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-a-unique-field)
- [Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

### Discord.js Documentation

- [Modals](https://discordjs.guide/interactions/modals.html)
- [Slash Commands](https://discordjs.guide/interactions/slash-commands.html)
- [Permissions](https://discordjs.guide/popular-topics/permissions.html)

---

## 💬 Support

For questions or issues:

1. Check the documentation files above
2. Review the code examples in CHARACTER-SYSTEM.md
3. Test in Prisma Studio
4. Check logs for error messages
5. Review SCHEMA-CONSTRAINTS.md for common pitfalls

---

## 🎉 Summary

This system provides:

✅ **Flexible**: Multiple characters per user  
✅ **Safe**: Database constraints prevent conflicts  
✅ **Persistent**: Dead characters stay in history  
✅ **Controlled**: Admin-managed reroll permissions  
✅ **Scalable**: Town-based for future expansion  
✅ **User-Friendly**: Clear modals and messages  

The implementation follows best practices for database design, transaction safety, and user experience.
