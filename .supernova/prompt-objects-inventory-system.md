# SUPERNOVA: Objects & Inventory System Implementation

## 🎯 OBJECTIF
Implémenter un système complet d'objets et d'inventaires pour FateWeaverBot selon les spécifications de `docs/doing.md`.

## ✅ DÉCISIONS VALIDÉES PAR L'UTILISATEUR

1. **Inventaire**: 1 slot = 1 objet (pas de quantity, slots séparés pour multiples du même objet)
2. **Capacités manuelles**: Créer les entrées ObjectCapacityBonus même pour capacités interprétées manuellement par admins
3. **Blueprints objets**: Nouveau champ `Project.outputObjectTypeId` (nullable, mutuellement exclusif avec outputResourceTypeId)
4. **Fishing loot table**: Database-driven avec `FishingLootEntry` model (plus propre et flexible)
5. **Seed data**: Mettre à jour `backend/prisma/seed.ts` existant
6. **Database**: Totalement vierge en local et production - toutes les données de base seront créées via seed

## 📋 WORK PACKAGES (7 tâches principales)

### WP1: Renommer "Travailler le bois" → "Menuiser"
**Fichiers à modifier:**
- `/backend/prisma/schema.prisma` - Line 118: `CraftType` enum
- `/backend/src/services/capability.service.ts` - Line 693: `CRAFT_CONFIGS` key
- `/bot/src/features/projects/projects.handlers.ts` - 2 mappings
- `/bot/src/features/projects/projects.utils.ts` - Case statement
- `/bot/src/features/projects/project-creation.ts` - UI label

**Action:** Find-replace `TRAVAILLER_LE_BOIS` → `MENUISER` et variations textuelles.

---

### WP2: Core Object & Inventory System

#### A. DATABASE SCHEMA

```prisma
model ObjectType {
  id                   Int                         @id @default(autoincrement())
  name                 String                      @unique
  description          String?

  // Relations
  inventorySlots       CharacterInventorySlot[]
  skillBonuses         ObjectSkillBonus[]
  capacityBonuses      ObjectCapacityBonus[]
  resourceConversions  ObjectResourceConversion[]
  projectOutputs       Project[]                   @relation("ProjectObjectOutput")

  createdAt            DateTime                    @default(now()) @map("created_at")
  updatedAt            DateTime                    @updatedAt @map("updated_at")

  @@map("object_types")
}

model CharacterInventory {
  id          String                   @id @default(cuid())
  characterId String                   @unique @map("character_id")
  character   Character                @relation(fields: [characterId], references: [id], onDelete: Cascade)
  slots       CharacterInventorySlot[]
  createdAt   DateTime                 @default(now()) @map("created_at")
  updatedAt   DateTime                 @updatedAt @map("updated_at")

  @@map("character_inventories")
}

model CharacterInventorySlot {
  id           String             @id @default(cuid())
  inventoryId  String             @map("inventory_id")
  inventory    CharacterInventory @relation(fields: [inventoryId], references: [id], onDelete: Cascade)
  objectTypeId Int                @map("object_type_id")
  objectType   ObjectType         @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  createdAt    DateTime           @default(now()) @map("created_at")
  updatedAt    DateTime           @updatedAt @map("updated_at")

  @@index([inventoryId])
  @@map("character_inventory_slots")
}

// Modifier le model Project existant
model Project {
  // ... champs existants ...

  outputResourceTypeId Int?        @map("output_resource_type_id") // Rendre nullable
  outputObjectTypeId   Int?        @map("output_object_type_id")   // NOUVEAU

  // ... relations existantes ...
  outputObjectType     ObjectType? @relation("ProjectObjectOutput", fields: [outputObjectTypeId], references: [id])
}
```

**IMPORTANT:** Ajouter validation: un Project doit avoir SOIT `outputResourceTypeId` SOIT `outputObjectTypeId` (pas les deux, pas aucun).

#### B. BACKEND API ENDPOINTS

**Nouveaux fichiers:**
- `/backend/src/controllers/objects.ts`
- `/backend/src/routes/objects.ts`
- `/backend/src/services/object.service.ts`

**Endpoints à créer:**

```typescript
// Object Types Management (Admin)
POST   /api/objects                          // Créer nouveau type d'objet
GET    /api/objects                          // Lister tous les types d'objets
GET    /api/objects/:id                      // Détails d'un type d'objet

// Character Inventory
GET    /api/characters/:id/inventory         // Inventaire du personnage
POST   /api/characters/:id/inventory/add     // Ajouter objet (admin)
DELETE /api/characters/:id/inventory/:slotId // Retirer objet (admin)
POST   /api/characters/:id/inventory/transfer // Transférer objet à autre personnage
```

**Logique de transfert:**
- Vérifier que les 2 personnages sont dans la même ville OU dans la même expédition DEPARTED
- Créer slot dans inventaire cible
- Supprimer slot dans inventaire source
- Transaction Prisma

#### C. BOT COMMANDS - Profile Display

**Fichiers à modifier:**
- `/bot/src/features/users/users.utils.ts` - Fonction de formatage du profil
- `/bot/src/features/users/users.handlers.ts` - Handler pour bouton "Donner objet"

**Ajouts au profil:**
```
📦 **Inventaire**
- Arc
- Couteau de chasse
- Lanterne

[Bouton: Donner un objet]
```

**Flow "Donner un objet":**
1. Click bouton → Modal/SelectMenu avec:
   - Liste déroulante: Personnages éligibles (même ville OU même expédition DEPARTED)
   - Liste déroulante: Objets dans inventaire du donneur
2. Confirmation
3. API call `/inventory/transfer`

#### D. BOT COMMANDS - Character Admin

**Fichiers à modifier:**
- `/bot/src/features/admin/character-admin.handlers.ts`
- `/bot/src/features/admin/character-admin.components.ts`

**Ajout:** Bouton "Gérer Inventaire" dans le menu character-admin → Sous-menu:
- "Ajouter un objet" → SelectMenu avec tous les ObjectTypes
- "Retirer un objet" → SelectMenu avec objets actuels du personnage

#### E. BOT COMMANDS - New Element Admin

**Fichiers à modifier:**
- `/bot/src/features/admin/new-element-admin.handlers.ts`

**Ajout:** Bouton "➕ Nouvel Objet" → Modal avec:
- Nom de l'objet
- Description (optionnel)

---

### WP3: Object-Skill Bonus System

#### A. DATABASE SCHEMA

```prisma
model ObjectSkillBonus {
  id           String     @id @default(cuid())
  objectTypeId Int        @map("object_type_id")
  objectType   ObjectType @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  capabilityId String     @map("capability_id")
  capability   Capability @relation(fields: [capabilityId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  @@unique([objectTypeId, capabilityId])
  @@map("object_skill_bonuses")
}

// Modifier model Capability existant pour ajouter la relation
model Capability {
  // ... champs existants ...
  objectBonuses ObjectSkillBonus[]  // NOUVEAU
}
```

#### B. BACKEND LOGIC

**Modifier:**
- `/backend/src/services/character.service.ts` - Fonction `getCharacterWithCapabilities()`

**Logique:**
1. Récupérer capabilities de `CharacterCapability` (compétences permanentes)
2. Récupérer inventaire du personnage
3. Pour chaque objet dans inventaire, récupérer `ObjectSkillBonus` associés
4. Merge les deux listes, marquer celles venant d'objets avec flag `fromObject: true`

#### C. BOT DISPLAY - Profile

**Modifier:** `/bot/src/features/users/users.utils.ts`

**Format d'affichage:**
```
🎯 **Compétences**
- Combat rapproché
- Cuisiner

🎯 **Compétences (objets)**
- Combat distance (Arc)
- Vision nocturne (Lanterne)
```

---

### WP4: Object-Capacity+ Bonus System

#### A. DATABASE SCHEMA

```prisma
enum CapacityBonusType {
  LUCKY_ROLL          // Chasser+, Cueillir+, Miner+, Pêcher+, Cuisiner+
  HEAL_EXTRA          // Soigner+
  ENTERTAIN_BURST     // Divertir+
  ADMIN_INTERPRETED   // Tisser+, Forger+, Menuiser+, Cartographier+, Rechercher+, Auspice+
}

model ObjectCapacityBonus {
  id           String            @id @default(cuid())
  objectTypeId Int               @map("object_type_id")
  objectType   ObjectType        @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  capabilityId String            @map("capability_id")
  capability   Capability        @relation(fields: [capabilityId], references: [id], onDelete: Cascade)
  bonusType    CapacityBonusType @map("bonus_type")
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")

  @@unique([objectTypeId, capabilityId])
  @@map("object_capacity_bonuses")
}

// Modifier model Capability existant
model Capability {
  // ... champs existants ...
  objectCapacityBonuses ObjectCapacityBonus[]  // NOUVEAU
}
```

#### B. BACKEND LOGIC - Helper Function

**Créer:** `/backend/src/services/inventory.service.ts`

```typescript
/**
 * Vérifie si un personnage a un objet donnant un bonus à une capacité
 */
async function getCharacterCapacityBonus(
  characterId: string,
  capabilityName: string
): Promise<CapacityBonusType | null> {
  // 1. Récupérer inventaire
  // 2. Pour chaque objet, checker ObjectCapacityBonus avec capabilityName
  // 3. Retourner le premier bonus trouvé (ou null)
}
```

#### C. MODIFICATIONS CAPABILITY.SERVICE.TS

**Fichier:** `/backend/src/services/capability.service.ts`

**Pour LUCKY_ROLL (Chasser, Cueillir, Miner, Pêcher, Cuisiner):**

Avant:
```typescript
const result = weightedPool[Math.floor(Math.random() * weightedPool.length)];
```

Après:
```typescript
const bonus = await inventoryService.getCharacterCapacityBonus(characterId, 'Chasser');
let result;

if (bonus === 'LUCKY_ROLL') {
  // Roll twice, keep best
  const roll1 = weightedPool[Math.floor(Math.random() * weightedPool.length)];
  const roll2 = weightedPool[Math.floor(Math.random() * weightedPool.length)];
  result = Math.max(roll1, roll2);
} else {
  result = weightedPool[Math.floor(Math.random() * weightedPool.length)];
}
```

**Pour HEAL_EXTRA (Soigner):**

Après la logique de soin existante, ajouter:
```typescript
const bonus = await inventoryService.getCharacterCapacityBonus(characterId, 'Soigner');

if (bonus === 'HEAL_EXTRA' && targetCharacter.hp < 5) {
  // 20% chance de soigner un PV supplémentaire
  if (Math.random() < 0.2) {
    await prisma.character.update({
      where: { id: targetId },
      data: { hp: { increment: 1 } }
    });
    message += "\n✨ Soin bonus ! (+1 PV supplémentaire)";
  }
}
```

**Pour ENTERTAIN_BURST (Divertir):**

Dans `executeDivertir()`, après incrémentation du counter:
```typescript
const bonus = await inventoryService.getCharacterCapacityBonus(characterId, 'Divertir');

if (bonus === 'ENTERTAIN_BURST' && newCounter < 5) {
  // Calculer % de chance: newCounter * 5%
  const burstChance = newCounter * 0.05;

  if (Math.random() < burstChance) {
    // Déclencher le concert immédiatement
    newCounter = 0;
    // Appliquer l'effet concert (code existant)
    // ...
    message = "🎭 Concert spontané ! Le public est conquis !";
  }
}
```

#### D. BOT DISPLAY - Profile

**Format:**
```
⚡ **Capacités+**
- Chasser+ (Couteau de chasse)
- Vision nocturne+ (Lanterne)
```

---

### WP5: Resource Bag Objects

#### A. DATABASE SCHEMA

```prisma
model ObjectResourceConversion {
  id             String       @id @default(cuid())
  objectTypeId   Int          @map("object_type_id")
  objectType     ObjectType   @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  resourceTypeId Int          @map("resource_type_id")
  resourceType   ResourceType @relation(fields: [resourceTypeId], references: [id], onDelete: Cascade)
  quantity       Int
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  @@unique([objectTypeId, resourceTypeId])
  @@map("object_resource_conversions")
}

// Modifier ResourceType existant
model ResourceType {
  // ... champs existants ...
  objectConversions ObjectResourceConversion[]  // NOUVEAU
}
```

#### B. BACKEND LOGIC

**Modifier:** `/backend/src/services/object.service.ts` - Fonction `addObjectToCharacter()`

**Logique:**
```typescript
async function addObjectToCharacter(characterId: string, objectTypeId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Récupérer l'objet avec ses conversions
    const objectType = await tx.objectType.findUnique({
      where: { id: objectTypeId },
      include: { resourceConversions: { include: { resourceType: true } } }
    });

    // 2. Si l'objet a des conversions de ressources
    if (objectType.resourceConversions.length > 0) {
      // 3. Récupérer le personnage pour savoir où il est
      const character = await tx.character.findUnique({
        where: { id: characterId },
        include: {
          expeditionMembers: {
            include: { expedition: true },
            where: { expedition: { status: 'DEPARTED' } }
          }
        }
      });

      // 4. Déterminer la destination des ressources
      const isDeparted = character.expeditionMembers.length > 0;
      const locationType = isDeparted ? 'EXPEDITION' : 'CITY';
      const locationId = isDeparted
        ? character.expeditionMembers[0].expedition.id
        : character.townId;

      // 5. Pour chaque conversion, ajouter les ressources
      for (const conversion of objectType.resourceConversions) {
        await tx.resourceStock.upsert({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType,
              locationId,
              resourceTypeId: conversion.resourceTypeId
            }
          },
          update: { quantity: { increment: conversion.quantity } },
          create: {
            locationType,
            locationId,
            resourceTypeId: conversion.resourceTypeId,
            quantity: conversion.quantity
          }
        });
      }

      // 6. NE PAS ajouter l'objet à l'inventaire (auto-consommé)
      return {
        success: true,
        converted: true,
        resources: objectType.resourceConversions.map(c => ({
          name: c.resourceType.name,
          quantity: c.quantity
        }))
      };
    }

    // 7. Sinon, ajouter normalement à l'inventaire
    const inventory = await tx.characterInventory.upsert({
      where: { characterId },
      create: { characterId },
      update: {}
    });

    const slot = await tx.characterInventorySlot.create({
      data: {
        inventoryId: inventory.id,
        objectTypeId
      }
    });

    return { success: true, converted: false, slot };
  });
}
```

---

### WP6: Fishing Grigri Update

#### A. DATABASE SCHEMA

```prisma
model FishingLootEntry {
  id            String   @id @default(cuid())
  paTable       Int      @map("pa_table") // 1 ou 2
  resourceName  String   @map("resource_name") // Nom de la ressource ou "GRIGRI"
  quantity      Int
  isActive      Boolean  @default(true) @map("is_active")
  orderIndex    Int      @map("order_index") // Pour maintenir l'ordre
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([paTable, isActive])
  @@map("fishing_loot_entries")
}

// Ajouter à Town
model Town {
  // ... champs existants ...
  grigriFound   Boolean  @default(false) @map("grigri_found") // NOUVEAU
}
```

#### B. BACKEND LOGIC - Migration des tables hardcodées

**Modifier:** `/backend/src/services/capability.service.ts` - Fonction `executeFish()`

**AVANT:** Tables hardcodées `FISH_LOOT_1PA` et `FISH_LOOT_2PA`

**APRÈS:** Requête base de données

```typescript
async function executeFish(characterId: string, paSpent: number) {
  // 1. Récupérer la table de loot depuis la DB
  const lootEntries = await prisma.fishingLootEntry.findMany({
    where: {
      paTable: paSpent,
      isActive: true
    },
    orderBy: { orderIndex: 'asc' }
  });

  // 2. Sélectionner un résultat aléatoire
  const loot = lootEntries[Math.floor(Math.random() * lootEntries.length)];

  // 3. Si c'est GRIGRI
  if (loot.resourceName === 'GRIGRI') {
    await prisma.$transaction(async (tx) => {
      // a. Déduire les PA
      await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: paSpent },
          paUsedToday: { increment: paSpent }
        }
      });

      // b. Ajouter l'objet "coquillage" à l'inventaire
      const coquillageType = await tx.objectType.findUnique({
        where: { name: 'coquillage' }
      });

      const inventory = await tx.characterInventory.upsert({
        where: { characterId },
        create: { characterId },
        update: {}
      });

      await tx.characterInventorySlot.create({
        data: {
          inventoryId: inventory.id,
          objectTypeId: coquillageType.id
        }
      });

      // c. Désactiver l'entrée GRIGRI
      await tx.fishingLootEntry.update({
        where: { id: loot.id },
        data: { isActive: false }
      });

      // d. Ajouter les 3 nouvelles entrées de remplacement
      const maxOrder = Math.max(...lootEntries.map(e => e.orderIndex));

      await tx.fishingLootEntry.createMany({
        data: [
          { paTable: 2, resourceName: 'Minerai', quantity: 3, orderIndex: maxOrder + 1 },
          { paTable: 2, resourceName: 'Bois', quantity: 3, orderIndex: maxOrder + 2 },
          { paTable: 2, resourceName: 'Vivres', quantity: 3, orderIndex: maxOrder + 3 }
        ]
      });

      // e. Marquer dans la ville que le grigri a été trouvé
      await tx.town.update({
        where: { id: character.townId },
        data: { grigriFound: true }
      });
    });

    return {
      success: true,
      message: `${character.name} a trouvé un grigri (coquillage) ! 🐚`
    };
  }

  // 4. Sinon, logique normale (ajouter ressource au stock de la ville)
  // ... code existant ...
}
```

---

### WP7: Seed Data

#### A. FICHIER À MODIFIER

`/backend/prisma/seed.ts`

#### B. ORDRE DE CRÉATION

1. **ObjectTypes** (40 objets)
2. **ObjectSkillBonus** (13 relations objet→compétence)
3. **ObjectCapacityBonus** (12 relations objet→capacité+)
4. **ObjectResourceConversion** (4 sacs de ressources)
5. **FishingLootEntry** (34 entrées: 17 pour 1PA, 17 pour 2PA)

#### C. DONNÉES COMPLÈTES

**ObjectTypes:**
```typescript
const objects = [
  // Objets simples
  { name: 'Appeau', description: null },
  { name: 'Herbier', description: null },
  { name: 'Canari', description: null },
  { name: 'Filet', description: null },
  { name: 'Boussole', description: null },
  { name: 'Somnifère', description: null },
  { name: 'Bougie', description: null },
  { name: 'Grenouille', description: null },
  { name: 'Couronne de fleurs', description: null },
  { name: 'coquillage', description: 'Grigri trouvé à la pêche' },

  // Objets donnant compétences
  { name: 'Arc', description: 'Donne la compétence Combat distance' },
  { name: 'Graines', description: 'Donne la compétence Cultiver' },
  { name: 'Lanterne', description: 'Donne la compétence Vision nocturne' },
  { name: 'Matériel de plongée', description: 'Donne la compétence Plongée' },
  { name: 'Corde', description: 'Donne la compétence Noeuds' },
  { name: 'Marteau', description: 'Donne la compétence Réparer' },
  { name: 'Harnais', description: 'Donne la compétence Porter' },
  { name: 'Marmite', description: 'Donne la compétence Réconforter' },
  { name: 'Bottes', description: 'Donne la compétence Déplacement rapide' },
  { name: 'Fioles', description: 'Donne la compétence Herboristerie' },
  { name: 'Grimoire vierge', description: 'Donne la compétence Assommer' },
  { name: 'Longue-vue', description: 'Donne la compétence Vision lointaine' },
  { name: 'Maquillage', description: 'Donne la compétence Camouflage' },

  // Objets donnant capacité+
  { name: 'Couteau de chasse', description: 'Chasser+' },
  { name: 'Serpe', description: 'Cueillir+' },
  { name: 'Pioche', description: 'Miner+' },
  { name: 'Nasse', description: 'Pêcher+' },
  { name: 'Quenouille', description: 'Tisser+' },
  { name: 'Enclume', description: 'Forger+' },
  { name: 'Mètre', description: 'Menuiser+' },
  { name: 'Sel', description: 'Cuisiner+' },
  { name: 'Compas', description: 'Cartographier+' },
  { name: 'Bandages', description: 'Soigner+' },
  { name: 'Loupe', description: 'Rechercher+' },
  { name: 'Anémomètre', description: 'Auspice+' },
  { name: 'instrument', description: 'Divertir+' },

  // Sacs de ressources
  { name: 'Sac de Tissu', description: 'Se transforme en 10 tissu' },
  { name: 'ferraille', description: 'Se transforme en 10 minerai' },
  { name: 'Planches', description: 'Se transforme en 20 planche' },
  { name: 'Jambon', description: 'Se transforme en 10 nourriture' }
];
```

**ObjectSkillBonus:** (Arc → Combat distance, etc.)
**ObjectCapacityBonus:** (Couteau de chasse → Chasser+ LUCKY_ROLL, etc.)
**ObjectResourceConversion:** (Sac de Tissu → 10 Tissu, etc.)
**FishingLootEntry:** Migrer les tables hardcodées FISH_LOOT_1PA et FISH_LOOT_2PA

---

## 🔄 ORDRE D'IMPLÉMENTATION

1. **WP1** - Renommer Menuiser (quick win)
2. **WP2** - Core system (foundation)
3. **WP3** - Object skills (simple)
4. **WP5** - Resource bags (uses WP2)
5. **WP4** - Capacity+ (complex)
6. **WP6** - Fishing grigri (uses WP2)
7. **WP7** - Seed data (final)

---

## 📊 RAPPORT À GÉNÉRER

À la fin, créer `.supernova/report-objects-inventory-system.md` avec:

### Section 1: RÉSUMÉ EXÉCUTIF (≤300 tokens)
- Nombre de fichiers modifiés
- Nombre de fichiers créés
- Migrations Prisma créées
- Endpoints API ajoutés
- Commandes bot modifiées
- Tests effectués

### Section 2: DÉTAILS TECHNIQUES
- Liste exhaustive des fichiers par WP
- Changements de schéma
- Points d'attention

### Section 3: NEXT STEPS
- Tests à effectuer
- Documentation à ajouter
- Points de vigilance

---

## ⚠️ CONTRAINTES IMPORTANTES

1. **Toujours utiliser transactions Prisma** pour opérations multi-tables
2. **Valider les données** avant toute opération (objets existent, personnages en vie, etc.)
3. **Logger toutes les actions admin** (création objet, transfert, etc.)
4. **Gérer les cas d'erreur** (inventaire introuvable, objet déjà possédé, etc.)
5. **Respecter les patterns existants** (ResourceType pattern, admin command structure)

---

## 🎯 CRITÈRES DE SUCCÈS

- ✅ Migration Prisma passe sans erreur
- ✅ Seed script peuple correctement la DB
- ✅ Tous les endpoints API répondent 200
- ✅ Bot compile sans erreur TypeScript
- ✅ Profile affiche inventaire + compétences objets + capacités+
- ✅ Transfert d'objets fonctionne
- ✅ Admin peut créer/donner/retirer objets
- ✅ Fishing grigri déclenche correctement la conversion
- ✅ Capacity+ applique les bonus (lucky roll, heal extra, entertain burst)
- ✅ Resource bags se convertissent automatiquement

---

**COMMENCER PAR WP1, PUIS CONTINUER SÉQUENTIELLEMENT.**
