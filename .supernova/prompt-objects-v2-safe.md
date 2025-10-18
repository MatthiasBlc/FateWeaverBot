# SUPERNOVA V2 (SAFE): Objects & Inventory System - IMPLÉMENTATION COMPLÈTE

## 🚨 RÈGLES DE SÉCURITÉ CRITIQUES

### AVANT TOUTE MODIFICATION DE FICHIER:

1. **TOUJOURS lire le fichier ENTIER avec Read avant d'éditer**
2. **JAMAIS supprimer de modèles existants dans schema.prisma**
3. **TOUJOURS utiliser Edit (pas Write) pour les fichiers existants**
4. **TOUJOURS vérifier avec `npx prisma validate` après modification du schema**
5. **En cas d'erreur Prisma, ARRÊTER et signaler immédiatement**

---

## 📋 CONTEXTE ET DÉCISIONS VALIDÉES

**Utilisateur a confirmé:**
- 1 slot = 1 objet (pas de quantity field)
- Capacités manuelles: créer les entrées même si interprétées par admins
- Blueprints: nouveau champ `outputObjectTypeId` (mutuellement exclusif avec `outputResourceTypeId`)
- Fishing loot: Database-driven avec `FishingLootEntry`
- Seed: Mettre à jour `backend/prisma/seed.ts`
- DB vierge en local et prod - toutes données via seed
- **40 objets listés UNIQUEMENT en seed, jamais hardcodés ailleurs**

---

## 🎯 WORK PACKAGES - ORDRE STRICT

### WP1: Renommer "Travailler le bois" → "Menuiser" ✅ SIMPLE

**Objectif:** Find-replace dans 5 fichiers.

**Fichiers à modifier:**

1. `/home/bouloc/Repo/FateWeaverBot/backend/prisma/schema.prisma`
   - Line 118: `TRAVAILLER_LE_BOIS` → `MENUISER`
   - **IMPORTANT:** Utiliser Edit, pas Write!

2. `/home/bouloc/Repo/FateWeaverBot/backend/src/services/capability.service.ts`
   - Line 693: clé `TRAVAILLER_LE_BOIS` → `MENUISER` dans `CRAFT_CONFIGS`

3. `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/projects.handlers.ts`
   - Chercher toutes occurrences de "travailler le bois" / "TRAVAILLER_LE_BOIS"
   - Remplacer par "Menuiser" / "MENUISER"

4. `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/projects.utils.ts`
   - Case statement "TRAVAILLER_LE_BOIS" → "MENUISER"

5. `/home/bouloc/Repo/FateWeaverBot/bot/src/features/projects/project-creation.ts`
   - UI label

**Validation:** Lancer `npx prisma validate` après modif du schema.

---

### WP2A: Database Schema ⚠️ CRITIQUE - ATTENTION MAXIMALE

**Objectif:** Ajouter les nouveaux modèles SANS toucher aux existants.

**PROCÉDURE STRICTE:**

1. **Lire schema.prisma EN ENTIER d'abord**
2. **Identifier l'emplacement EXACT pour insérer les nouveaux modèles:**
   - Enums AVANT les modèles
   - Nouveaux modèles APRÈS ResourceType (ligne ~410)
   - Relations ajoutées aux modèles existants via Edit
3. **NE JAMAIS supprimer Town, Character, Capability, ResourceType**

**NOUVEAUX ENUMS à ajouter APRÈS SeasonType (ligne ~138):**

```prisma
enum CapacityBonusType {
  LUCKY_ROLL          // Chasser+, Cueillir+, Miner+, Pêcher+, Cuisiner+
  HEAL_EXTRA          // Soigner+
  ENTERTAIN_BURST     // Divertir+
  ADMIN_INTERPRETED   // Tisser+, Forger+, Menuiser+, Cartographier+, Rechercher+, Auspice+
}
```

**NOUVEAUX MODÈLES à insérer APRÈS DailyMessageOverride (fin du fichier, ligne ~478):**

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
```

**MODIFICATIONS aux modèles EXISTANTS (utiliser Edit):**

1. **Model Character (ligne ~69):**
   - Ajouter AVANT la ligne `createdAt`:
   ```prisma
   inventory         CharacterInventory? // NOUVEAU
   ```

2. **Model Capability (ligne ~218):**
   - Ajouter AVANT la ligne `createdAt`:
   ```prisma
   objectSkillBonuses    ObjectSkillBonus[]    // NOUVEAU
   objectCapacityBonuses ObjectCapacityBonus[] // NOUVEAU
   ```

3. **Model ResourceType (ligne ~360):**
   - Ajouter AVANT la ligne `createdAt`:
   ```prisma
   objectConversions ObjectResourceConversion[] // NOUVEAU
   ```

4. **Model Project (ligne ~149):**
   - Modifier `outputResourceTypeId` pour le rendre nullable:
   ```prisma
   outputResourceTypeId   Int?  @map("output_resource_type_id") // Rendre nullable
   ```
   - Ajouter APRÈS `outputResourceTypeId`:
   ```prisma
   outputObjectTypeId     Int?  @map("output_object_type_id")   // NOUVEAU
   ```
   - Ajouter dans la section relations (après `blueprintCopies`):
   ```prisma
   outputObjectType ObjectType? @relation("ProjectObjectOutput", fields: [outputObjectTypeId], references: [id])
   ```

5. **Model Town (ligne ~36):**
   - Ajouter AVANT la ligne `createdAt`:
   ```prisma
   grigriFound   Boolean  @default(false) @map("grigri_found") // NOUVEAU
   ```

**VALIDATION OBLIGATOIRE:**
```bash
cd /home/bouloc/Repo/FateWeaverBot/backend && npx prisma validate
```

**Si erreur:** ARRÊTER, faire `git checkout backend/prisma/schema.prisma`, signaler l'erreur.

---

### WP2B: Backend API - Créer nouveaux fichiers

**Fichiers à CRÉER (utiliser Write):**

#### 1. `/home/bouloc/Repo/FateWeaverBot/backend/src/services/object.service.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const objectService = {
  /**
   * Récupère tous les types d'objets
   */
  async getAllObjectTypes() {
    return await prisma.objectType.findMany({
      include: {
        skillBonuses: {
          include: {
            capability: true
          }
        },
        capacityBonuses: {
          include: {
            capability: true
          }
        },
        resourceConversions: {
          include: {
            resourceType: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  },

  /**
   * Récupère un type d'objet par ID
   */
  async getObjectTypeById(id: number) {
    return await prisma.objectType.findUnique({
      where: { id },
      include: {
        skillBonuses: {
          include: {
            capability: true
          }
        },
        capacityBonuses: {
          include: {
            capability: true
          }
        },
        resourceConversions: {
          include: {
            resourceType: true
          }
        }
      }
    });
  },

  /**
   * Crée un nouveau type d'objet (admin)
   */
  async createObjectType(data: { name: string; description?: string }) {
    return await prisma.objectType.create({
      data: {
        name: data.name,
        description: data.description
      }
    });
  },

  /**
   * Récupère l'inventaire d'un personnage
   */
  async getCharacterInventory(characterId: string) {
    const inventory = await prisma.characterInventory.findUnique({
      where: { characterId },
      include: {
        slots: {
          include: {
            objectType: {
              include: {
                skillBonuses: {
                  include: {
                    capability: true
                  }
                },
                capacityBonuses: {
                  include: {
                    capability: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return inventory;
  },

  /**
   * Ajoute un objet à l'inventaire d'un personnage
   */
  async addObjectToCharacter(characterId: string, objectTypeId: number) {
    return await prisma.$transaction(async (tx) => {
      // 1. Récupérer l'objet avec ses conversions
      const objectType = await tx.objectType.findUnique({
        where: { id: objectTypeId },
        include: {
          resourceConversions: {
            include: { resourceType: true }
          }
        }
      });

      if (!objectType) {
        throw new Error(`ObjectType ${objectTypeId} not found`);
      }

      // 2. Si l'objet a des conversions de ressources (sac de ressources)
      if (objectType.resourceConversions.length > 0) {
        // Récupérer le personnage pour savoir où il est
        const character = await tx.character.findUnique({
          where: { id: characterId },
          include: {
            expeditionMembers: {
              include: { expedition: true },
              where: { expedition: { status: 'DEPARTED' } }
            }
          }
        });

        if (!character) {
          throw new Error(`Character ${characterId} not found`);
        }

        // Déterminer la destination des ressources
        const isDeparted = character.expeditionMembers.length > 0;
        const locationType = isDeparted ? 'EXPEDITION' : 'CITY';
        const locationId = isDeparted
          ? character.expeditionMembers[0].expedition.id
          : character.townId;

        // Pour chaque conversion, ajouter les ressources
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

        // NE PAS ajouter l'objet à l'inventaire (auto-consommé)
        return {
          success: true,
          converted: true,
          resources: objectType.resourceConversions.map(c => ({
            name: c.resourceType.name,
            quantity: c.quantity
          }))
        };
      }

      // 3. Sinon, ajouter normalement à l'inventaire
      const inventory = await tx.characterInventory.upsert({
        where: { characterId },
        create: { characterId },
        update: {}
      });

      const slot = await tx.characterInventorySlot.create({
        data: {
          inventoryId: inventory.id,
          objectTypeId
        },
        include: {
          objectType: true
        }
      });

      return { success: true, converted: false, slot };
    });
  },

  /**
   * Retire un objet de l'inventaire
   */
  async removeObjectFromCharacter(slotId: string) {
    return await prisma.characterInventorySlot.delete({
      where: { id: slotId }
    });
  },

  /**
   * Transfère un objet entre personnages
   */
  async transferObject(slotId: string, targetCharacterId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Récupérer le slot source
      const sourceSlot = await tx.characterInventorySlot.findUnique({
        where: { id: slotId },
        include: {
          inventory: {
            include: {
              character: {
                include: {
                  expeditionMembers: {
                    include: { expedition: true },
                    where: { expedition: { status: 'DEPARTED' } }
                  }
                }
              }
            }
          },
          objectType: true
        }
      });

      if (!sourceSlot) {
        throw new Error('Slot source not found');
      }

      // 2. Récupérer le personnage cible
      const targetCharacter = await tx.character.findUnique({
        where: { id: targetCharacterId },
        include: {
          expeditionMembers: {
            include: { expedition: true },
            where: { expedition: { status: 'DEPARTED' } }
          }
        }
      });

      if (!targetCharacter) {
        throw new Error('Target character not found');
      }

      const sourceChar = sourceSlot.inventory.character;

      // 3. Vérifier éligibilité (même ville OU même expédition DEPARTED)
      const sameCity = sourceChar.townId === targetCharacter.townId;
      const sourceExpedition = sourceChar.expeditionMembers[0]?.expedition;
      const targetExpedition = targetCharacter.expeditionMembers[0]?.expedition;
      const sameExpedition = sourceExpedition && targetExpedition &&
                              sourceExpedition.id === targetExpedition.id;

      if (!sameCity && !sameExpedition) {
        throw new Error('Characters must be in same city or same DEPARTED expedition');
      }

      // 4. Créer l'inventaire cible si nécessaire
      const targetInventory = await tx.characterInventory.upsert({
        where: { characterId: targetCharacterId },
        create: { characterId: targetCharacterId },
        update: {}
      });

      // 5. Créer nouveau slot pour la cible
      const newSlot = await tx.characterInventorySlot.create({
        data: {
          inventoryId: targetInventory.id,
          objectTypeId: sourceSlot.objectTypeId
        }
      });

      // 6. Supprimer le slot source
      await tx.characterInventorySlot.delete({
        where: { id: slotId }
      });

      return { success: true, newSlot };
    });
  }
};
```

#### 2. `/home/bouloc/Repo/FateWeaverBot/backend/src/controllers/objects.ts`

```typescript
import { Request, Response } from "express";
import { objectService } from "../services/object.service";
import { logger } from "../util/logger";

export const objectsController = {
  /**
   * GET /api/objects
   */
  async getAllObjectTypes(req: Request, res: Response) {
    try {
      const objects = await objectService.getAllObjectTypes();
      res.json(objects);
    } catch (error: any) {
      logger.error("Error in getAllObjectTypes:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/objects/:id
   */
  async getObjectTypeById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const object = await objectService.getObjectTypeById(id);

      if (!object) {
        return res.status(404).json({ error: "Object type not found" });
      }

      res.json(object);
    } catch (error: any) {
      logger.error("Error in getObjectTypeById:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/objects
   */
  async createObjectType(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const object = await objectService.createObjectType({ name, description });
      res.status(201).json(object);
    } catch (error: any) {
      logger.error("Error in createObjectType:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/characters/:id/inventory
   */
  async getCharacterInventory(req: Request, res: Response) {
    try {
      const characterId = req.params.id;
      const inventory = await objectService.getCharacterInventory(characterId);

      res.json(inventory || { slots: [] });
    } catch (error: any) {
      logger.error("Error in getCharacterInventory:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/characters/:id/inventory/add
   */
  async addObjectToCharacter(req: Request, res: Response) {
    try {
      const characterId = req.params.id;
      const { objectTypeId } = req.body;

      if (!objectTypeId) {
        return res.status(400).json({ error: "objectTypeId is required" });
      }

      const result = await objectService.addObjectToCharacter(characterId, objectTypeId);
      res.json(result);
    } catch (error: any) {
      logger.error("Error in addObjectToCharacter:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * DELETE /api/characters/:id/inventory/:slotId
   */
  async removeObjectFromCharacter(req: Request, res: Response) {
    try {
      const { slotId } = req.params;

      await objectService.removeObjectFromCharacter(slotId);
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Error in removeObjectFromCharacter:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/characters/:id/inventory/transfer
   */
  async transferObject(req: Request, res: Response) {
    try {
      const { slotId, targetCharacterId } = req.body;

      if (!slotId || !targetCharacterId) {
        return res.status(400).json({ error: "slotId and targetCharacterId are required" });
      }

      const result = await objectService.transferObject(slotId, targetCharacterId);
      res.json(result);
    } catch (error: any) {
      logger.error("Error in transferObject:", error);
      res.status(500).json({ error: error.message });
    }
  }
};
```

#### 3. `/home/bouloc/Repo/FateWeaverBot/backend/src/routes/objects.ts`

```typescript
import { Router } from "express";
import { objectsController } from "../controllers/objects";

const router = Router();

// Object types routes
router.get("/", objectsController.getAllObjectTypes);
router.get("/:id", objectsController.getObjectTypeById);
router.post("/", objectsController.createObjectType);

export default router;
```

#### 4. Modifier `/home/bouloc/Repo/FateWeaverBot/backend/src/routes/characters.ts`

**Ajouter ces routes APRÈS les routes existantes:**

```typescript
// Inventory routes
router.get("/:id/inventory", objectsController.getCharacterInventory);
router.post("/:id/inventory/add", objectsController.addObjectToCharacter);
router.delete("/:id/inventory/:slotId", objectsController.removeObjectFromCharacter);
router.post("/:id/inventory/transfer", objectsController.transferObject);
```

**N'oublie pas l'import en haut:**
```typescript
import { objectsController } from "../controllers/objects";
```

#### 5. Modifier `/home/bouloc/Repo/FateWeaverBot/backend/src/index.ts`

**Ajouter cette route avec les autres routes (chercher `app.use("/api/...")`):**

```typescript
import objectsRoutes from "./routes/objects";

// ... autres imports ...

app.use("/api/objects", objectsRoutes);
```

---

### WP2C-D: Bot Commands - Modifications

**⚠️ TOUJOURS lire les fichiers EN ENTIER avant modification**

#### C1. Modifier `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/users.utils.ts`

**Chercher la fonction `createProfileEmbed` et:**

1. Rendre la fonction `async`
2. Ajouter un appel API pour récupérer l'inventaire
3. Ajouter une section inventaire dans l'embed

**Exemple de modification (adapter au code existant):**

```typescript
// Ajouter import en haut
import { apiService } from "../../services/api";

// Modifier la signature
export async function createProfileEmbed(character: any, /* autres params */) {
  // ... code existant ...

  // AJOUTER APRÈS la section capacités:
  // Récupérer l'inventaire
  const inventory = await apiService.get(`/characters/${character.id}/inventory`);

  if (inventory && inventory.slots && inventory.slots.length > 0) {
    const inventoryList = inventory.slots
      .map((slot: any) => `- ${slot.objectType.name}`)
      .join("\n");

    embed.addFields({
      name: "📦 Inventaire",
      value: inventoryList,
      inline: false
    });
  }

  // ... reste du code ...
}
```

#### C2. Modifier `/home/bouloc/Repo/FateWeaverBot/bot/src/features/users/users.handlers.ts`

**Ajouter un bouton "Donner un objet" dans le profil (conditionnel si inventaire non vide):**

```typescript
// Dans la fonction qui affiche le profil, après l'embed:

if (inventory && inventory.slots && inventory.slots.length > 0) {
  const giveButton = new ButtonBuilder()
    .setCustomId(`give_object:${character.id}`)
    .setLabel("🎁 Donner un objet")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(giveButton);

  // Ajouter row aux components de la réponse
}
```

#### D1. Modifier `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/new-element-admin.handlers.ts`

**Ajouter un bouton "Nouvel Objet" dans la commande `/new-element-admin`:**

1. Dans `handleNewElementAdminCommand`, ajouter un 3ème bouton:

```typescript
const objectButton = new ButtonBuilder()
  .setCustomId("new_element_object")
  .setLabel("➕ Nouvel Objet")
  .setStyle(ButtonStyle.Secondary);

// Ajouter aux components
```

2. Créer le handler du bouton:

```typescript
export async function handleNewObjectButton(interaction: ButtonInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId("new_object_modal")
      .setTitle("Créer un nouvel objet");

    const nameInput = new TextInputBuilder()
      .setCustomId("object_name")
      .setLabel("Nom de l'objet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("object_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleNewObjectButton", { error });
  }
}
```

3. Créer le handler de soumission du modal:

```typescript
export async function handleObjectModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("object_name");
  const description = interaction.fields.getTextInputValue("object_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const response = await apiService.objects.createObjectType({
      name,
      description,
    });

    logger.info("Nouvel objet créé", { name, userId: interaction.user.id });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Objet créé avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Error creating object", { error, name });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur : ${error.message}`,
    });
  }
}
```

#### D2. Modifier `/home/bouloc/Repo/FateWeaverBot/bot/src/features/admin/character-admin.handlers.ts`

**Ajouter un bouton "Gérer Inventaire" dans le menu character-admin.**

**(À implémenter si le temps le permet, sinon reporter à plus tard)**

---

### WP3-7: Reporter à une prochaine session

**Les WP restants sont complexes et nécessitent:**
- WP3: Logique pour afficher compétences via objets
- WP4: Modifications profondes de capability.service.ts (lucky rolls, etc.)
- WP5: Déjà implémenté dans objectService.addObjectToCharacter()
- WP6: Modification fishing + migration tables hardcodées
- WP7: Seed data complet (40 objets + relations)

**Pour cette session, se concentrer sur WP1-WP2 pour avoir une base fonctionnelle.**

---

## 📊 RAPPORT FINAL

Créer `.supernova/report-objects-v2.md` avec:

### Section 1: RÉSUMÉ (≤300 tokens)

- Fichiers modifiés (liste)
- Fichiers créés (liste)
- Commandes exécutées
- Résultat `npx prisma validate`
- État des WP (complétés vs restants)

### Section 2: DÉTAILS

- Changements exacts par fichier
- Lignes modifiées
- Points d'attention

### Section 3: NEXT STEPS

- WP3-7 à implémenter
- Tests à faire
- Migration Prisma à lancer

---

## ✅ CHECKLIST DE SÉCURITÉ FINALE

Avant de marquer comme terminé:

- [ ] `npx prisma validate` réussit sans erreur
- [ ] Aucun modèle existant supprimé
- [ ] Tous les nouveaux fichiers créés
- [ ] Imports ajoutés correctement
- [ ] Bot compile: `cd bot && npm run build`
- [ ] Backend compile: `cd backend && npm run build`

---

**COMMENCE PAR WP1, PUIS WP2A (TRÈS PRUDEMMENT), PUIS WP2B-C-D.**
