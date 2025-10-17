import {
  PrismaClient,
  Capability as PrismaCapability,
  CapabilityCategory,
} from "@prisma/client";
import { getHuntYield, getGatherYield } from "../util/capacityRandom";
import { consumePA, validateCanUsePA } from "../util/character-validators";
import { dailyEventLogService } from "./daily-event-log.service";

type CapabilityWithRelations = PrismaCapability & {
  characters: { characterId: string }[];
};

export class CapabilityService {
  constructor(private prisma: PrismaClient) { }

  /**
   * Récupère toutes les capacités disponibles
   */
  async getAllCapabilities(): Promise<PrismaCapability[]> {
    return this.prisma.capability.findMany();
  }

  /**
   * Récupère une capacité par son ID
   */
  async getCapabilityById(id: string): Promise<CapabilityWithRelations | null> {
    return this.prisma.capability.findUnique({
      where: { id },
      include: {
        characters: {
          select: { characterId: true },
        },
      },
    });
  }

  /**
   * Récupère une capacité par son nom
   */
  async getCapabilityByName(name: string): Promise<PrismaCapability | null> {
    return this.prisma.capability.findUnique({
      where: { name },
    });
  }

  /**
   * Crée une nouvelle capacité
   */
  async createCapability(data: {
    name: string;
    category: CapabilityCategory;
    costPA: number;
    description?: string;
    emojiTag: string;
  }): Promise<PrismaCapability> {
    return this.prisma.capability.create({
      data: {
        name: data.name,
        category: data.category,
        costPA: data.costPA,
        description: data.description,
        emojiTag: data.emojiTag,
      },
    });
  }

  /**
   * Met à jour une capacité existante
   */
  async updateCapability(
    id: string,
    data: {
      name?: string;
      category?: CapabilityCategory;
      costPA?: number;
      description?: string | null;
    }
  ): Promise<PrismaCapability> {
    return this.prisma.capability.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        costPA: data.costPA,
        description: data.description,
      },
    });
  }

  /**
   * Supprime une capacité
   */
  async deleteCapability(id: string): Promise<void> {
    await this.prisma.capability.delete({
      where: { id },
    });
  }

  /**
   * Vérifie si un personnage possède une capacité
   */
  async hasCapability(
    characterId: string,
    capabilityId: string
  ): Promise<boolean> {
    const count = await this.prisma.characterCapability.count({
      where: {
        characterId,
        capabilityId,
      },
    });
    return count > 0;
  }

  /**
   * Ajoute une capacité à un personnage
   */
  async addCapabilityToCharacter(
    characterId: string,
    capabilityId: string
  ): Promise<void> {
    await this.prisma.characterCapability.create({
      data: {
        characterId,
        capabilityId,
      },
    });
  }

  /**
   * Supprime une capacité d'un personnage
   */
  async removeCapabilityFromCharacter(
    characterId: string,
    capabilityId: string
  ): Promise<void> {
    await this.prisma.characterCapability.delete({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId,
        },
      },
    });
  }

  /**
   * Récupère toutes les capacités d'un personnage
   */
  async getCharacterCapabilities(
    characterId: string
  ): Promise<PrismaCapability[]> {
    const capabilities = await this.prisma.characterCapability.findMany({
      where: { characterId },
      include: { capability: true },
    });

    return capabilities.map((c) => c.capability);
  }

  /**
   * Incrémente le compteur de divertissement d'un personnage
   * Retourne true si un spectacle a été déclenché
   */
  async incrementDivertCounter(
    characterId: string
  ): Promise<{ success: boolean; showPerformed: boolean }> {
    const character = await this.prisma.character.update({
      where: { id: characterId },
      data: {
        divertCounter: { increment: 1 },
      },
    });

    // Vérifie si un spectacle doit être déclenché (tous les 5)
    if (character.divertCounter >= 5) {
      await this.prisma.character.update({
        where: { id: characterId },
        data: { divertCounter: 0 },
      });
      return { success: true, showPerformed: true };
    }

    return { success: true, showPerformed: false };
  }

  /**
   * Exécute une capacité de récolte (chasse, cueillette, pêche)
   */
  async executeHarvestCapacity(
    characterId: string,
    capabilityName: string,
    isSummer: boolean,
    luckyRoll: boolean = false
  ): Promise<{ success: boolean; foodGained: number; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName(capabilityName);
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    // Calculer la récolte en fonction de la capacité et de la saison
    let foodGained = 0;
    let message = "";

    switch (capabilityName.toLowerCase()) {
      case "chasser":
        foodGained = getHuntYield(isSummer);
        message = `🦌 ${character.name} est revenu de la chasse avec ${foodGained} vivres !`;
        break;

      case "cueillir":
        foodGained = getGatherYield(isSummer);
        message = `🌿 ${character.name} a cueilli ${foodGained} vivres.`;
        break;

      case "pêcher":
        if (luckyRoll && character.paTotal >= 2) {
          // Double le coût en PA pour le lucky roll
          const roll1 = Math.floor(Math.random() * (isSummer ? 5 : 3));
          const roll2 = Math.floor(Math.random() * (isSummer ? 5 : 3));
          foodGained = Math.max(roll1, roll2);
          message = `🎣 ${character.name} a pêché avec succès et a obtenu ${foodGained} vivres (lucky roll)!`;
        } else {
          foodGained = Math.floor(Math.random() * (isSummer ? 5 : 3));
          message = `🎣 ${character.name} a pêché ${foodGained} vivres.`;
        }
        break;

      default:
        throw new Error("Capacité de récolte non reconnue");
    }

    // Mettre à jour les PA et ajouter les ressources à la ville
    await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: capability.costPA * (luckyRoll ? 2 : 1) },
          paUsedToday: { increment: capability.costPA * (luckyRoll ? 2 : 1) }
        },
      }),
      // Ajouter les vivres au stock de la ville
      this.prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: (await this.prisma.resourceType.findFirst({ where: { name: "Vivres" } }))!.id,
          },
        },
        update: {
          quantity: { increment: foodGained },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: (await this.prisma.resourceType.findFirst({ where: { name: "Vivres" } }))!.id,
          quantity: foodGained,
        },
      }),
    ]);

    // Log resource gathering
    await dailyEventLogService.logResourceGathered(
      characterId,
      character.name,
      character.townId,
      "Vivres",
      foodGained,
      capabilityName
    );

    return { success: true, foodGained, message };
  }

  /**
   * Exécute la capacité Couper du bois
   */
  async executeCouperDuBois(characterId: string): Promise<{ success: boolean; woodGained: number; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName("Couper du bois");
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition = await this.prisma.expeditionMember.findFirst({
      where: {
        characterId,
        expedition: { status: "DEPARTED" }
      }
    });

    if (departedExpedition) {
      throw new Error("Impossible de Couper du bois en expédition DEPARTED");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    // Calculer le rendement (2-3 bois)
    const woodGained = Math.floor(Math.random() * 2) + 2; // 2 or 3

    // Récupérer le type de ressource "Bois"
    const boisType = await this.prisma.resourceType.findFirst({
      where: { name: "Bois" },
    });

    if (!boisType) {
      throw new Error("Type de ressource 'Bois' non trouvé");
    }

    // Mettre à jour les PA et ajouter les ressources à la ville
    await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: capability.costPA },
          paUsedToday: { increment: capability.costPA },
        },
      }),
      // Ajouter le bois au stock de la ville
      this.prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: boisType.id,
          },
        },
        update: {
          quantity: { increment: woodGained },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: boisType.id,
          quantity: woodGained,
        },
      }),
    ]);

    // Log resource gathering
    await dailyEventLogService.logResourceGathered(
      characterId,
      character.name,
      character.townId,
      "Bois",
      woodGained,
      "Couper du bois"
    );

    return {
      success: true,
      woodGained,
      message: `Vous avez récolté ${woodGained} bois`,
    };
  }

  /**
   * Exécute la capacité Miner
   */
  async executeMiner(characterId: string): Promise<{ success: boolean; oreGained: number; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName("Miner");
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition = await this.prisma.expeditionMember.findFirst({
      where: {
        characterId,
        expedition: { status: "DEPARTED" }
      }
    });

    if (departedExpedition) {
      throw new Error("Impossible de Miner en expédition DEPARTED");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    // Calculer le rendement (2-6 minerai)
    const oreGained = Math.floor(Math.random() * 5) + 2; // 2-6

    // Récupérer le type de ressource "Minerai"
    const mineraiType = await this.prisma.resourceType.findFirst({
      where: { name: "Minerai" },
    });

    if (!mineraiType) {
      throw new Error("Type de ressource 'Minerai' non trouvé");
    }

    // Mettre à jour les PA et ajouter les ressources à la ville
    await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: capability.costPA },
          paUsedToday: { increment: capability.costPA },
        },
      }),
      // Ajouter le minerai au stock de la ville
      this.prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: mineraiType.id,
          },
        },
        update: {
          quantity: { increment: oreGained },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: mineraiType.id,
          quantity: oreGained,
        },
      }),
    ]);

    // Log resource gathering
    await dailyEventLogService.logResourceGathered(
      characterId,
      character.name,
      character.townId,
      "Minerai",
      oreGained,
      "Miner"
    );

    return {
      success: true,
      oreGained,
      message: `Vous avez miné ${oreGained} minerai`,
    };
  }

  /**
   * Exécute la capacité Pêcher avec tables de loot depuis la DB (V3)
   */
  async executeFish(characterId: string, paSpent: 1 | 2): Promise<{ success: boolean; loot?: Record<string, number>; message: string; objectFound?: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName("Pêcher");
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition = await this.prisma.expeditionMember.findFirst({
      where: {
        characterId,
        expedition: { status: "DEPARTED" }
      }
    });

    if (departedExpedition) {
      throw new Error("Impossible de Pêcher en expédition DEPARTED");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, paSpent);

    // Récupérer les entrées de loot depuis la DB
    const lootEntries = await this.prisma.fishingLootEntry.findMany({
      where: {
        paTable: paSpent,
        isActive: true
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    if (lootEntries.length === 0) {
      throw new Error(`Aucune table de loot trouvée pour ${paSpent} PA`);
    }

    // Tirer aléatoirement une entrée
    const randomIndex = Math.floor(Math.random() * lootEntries.length);
    const lootEntry = lootEntries[randomIndex];

    // Cas spécial pour Coquillage (objet)
    if (lootEntry.resourceName === "Coquillage") {
      // Récupérer l'objet Coquillage
      const coquillageObject = await this.prisma.objectType.findUnique({
        where: { name: "Coquillage" }
      });

      if (!coquillageObject) {
        throw new Error("Objet Coquillage non trouvé");
      }

      // Ajouter le coquillage à l'inventaire du personnage
      let inventory = await this.prisma.characterInventory.findUnique({
        where: { characterId }
      });

      if (!inventory) {
        inventory = await this.prisma.characterInventory.create({
          data: { characterId }
        });
      }

      await this.prisma.$transaction([
        this.prisma.character.update({
          where: { id: characterId },
          data: {
            paTotal: { decrement: paSpent },
            paUsedToday: { increment: paSpent },
          },
        }),
        this.prisma.characterInventorySlot.create({
          data: {
            inventoryId: inventory.id,
            objectTypeId: coquillageObject.id
          }
        })
      ]);

      return {
        success: true,
        objectFound: "Coquillage",
        message: `${character.name} a trouvé un coquillage ! (-${paSpent} PA)`,
      };
    }

    // Cas normal : ajouter la ressource au stock
    const resourceType = await this.prisma.resourceType.findFirst({
      where: { name: lootEntry.resourceName },
    });

    if (!resourceType) {
      throw new Error(`Type de ressource '${lootEntry.resourceName}' non trouvé`);
    }

    await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: paSpent },
          paUsedToday: { increment: paSpent },
        },
      }),
      this.prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: resourceType.id,
          },
        },
        update: {
          quantity: { increment: lootEntry.quantity },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: resourceType.id,
          quantity: lootEntry.quantity,
        },
      }),
    ]);

    // Log resource gathering
    await dailyEventLogService.logResourceGathered(
      characterId,
      character.name,
      character.townId,
      lootEntry.resourceName,
      lootEntry.quantity,
      "Pêcher"
    );

    return {
      success: true,
      loot: { [lootEntry.resourceName.toLowerCase()]: lootEntry.quantity },
      message: `Vous avez pêché ${lootEntry.quantity} ${lootEntry.resourceName} (-${paSpent} PA)`,
    };
  }

  /**
   * Exécute une capacité de craft générique
   */
  async executeCraft(
    characterId: string,
    craftType: string,
    inputAmount: number,
    paSpent: 1 | 2
  ): Promise<{ success: boolean; outputAmount: number; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition = await this.prisma.expeditionMember.findFirst({
      where: {
        characterId,
        expedition: { status: "DEPARTED" }
      }
    });

    if (departedExpedition) {
      throw new Error("Impossible de crafter en expédition DEPARTED");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime) AVANT de check le craft type
    validateCanUsePA(character, paSpent);

    // Configuration des crafts
    const CRAFT_CONFIGS: Record<string, { inputResource: string; outputResource: string; verb: string }> = {
      tisser: {
        inputResource: "Bois",
        outputResource: "Tissu",
        verb: "tissé"
      },
      forger: {
        inputResource: "Minerai",
        outputResource: "Fer",
        verb: "forgé"
      },
      menuiser: {
        inputResource: "Bois",
        outputResource: "Planches",
        verb: "travaillé"
      },
      cuisiner: {
        inputResource: "Vivres",
        outputResource: "Nourriture",
        verb: "cuisiné"
      }
    };

    const config = CRAFT_CONFIGS[craftType];
    if (!config) {
      throw new Error("Type de craft non reconnu");
    }

    // Vérifier les PA vs quantité d'input
    if (paSpent === 1 && inputAmount > 1) {
      throw new Error("1 PA permet max 1 ressource en entrée");
    }
    if (paSpent === 2 && (inputAmount < 1 || inputAmount > 5)) {
      throw new Error("2 PA permet 1-5 ressources en entrée");
    }

    // Vérifier le stock d'input
    const inputResourceType = await this.prisma.resourceType.findFirst({
      where: { name: config.inputResource },
    });

    if (!inputResourceType) {
      throw new Error(`Type de ressource '${config.inputResource}' non trouvé`);
    }

    const inputStock = await this.prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: inputResourceType.id,
        },
      },
    });

    if (!inputStock || inputStock.quantity < inputAmount) {
      throw new Error(`Stock insuffisant: ${inputStock?.quantity || 0}/${inputAmount} ${config.inputResource}`);
    }

    // Calculer l'output avec la formule aléatoire
    const minOutput = Math.max(0, inputAmount - 1);
    const maxOutput = inputAmount * 3;
    const outputAmount = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;

    // Récupérer le type de ressource d'output
    const outputResourceType = await this.prisma.resourceType.findFirst({
      where: { name: config.outputResource },
    });

    if (!outputResourceType) {
      throw new Error(`Type de ressource '${config.outputResource}' non trouvé`);
    }

    // Exécuter le craft
    await this.prisma.$transaction(async (tx) => {
      // Retirer l'input
      await tx.resourceStock.update({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: inputResourceType.id,
          },
        },
        data: {
          quantity: { decrement: inputAmount },
        },
      });

      // Ajouter l'output
      await tx.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: outputResourceType.id,
          },
        },
        update: {
          quantity: { increment: outputAmount },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: outputResourceType.id,
          quantity: outputAmount,
        },
      });

      // Déduire les PA
      await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: paSpent },
          paUsedToday: { increment: paSpent },
        },
      });
    });

    // Log resource gathering (crafting counts as gathering)
    await dailyEventLogService.logResourceGathered(
      characterId,
      character.name,
      character.townId,
      config.outputResource,
      outputAmount,
      craftType.charAt(0).toUpperCase() + craftType.slice(1)
    );

    return {
      success: true,
      outputAmount,
      message: `Vous avez obtenu ${outputAmount} ${config.outputResource}`,
    };
  }

  /**
   * Exécute la capacité Soigner
   */
  async executeSoigner(
    characterId: string,
    mode: 'heal' | 'craft',
    targetCharacterId?: string
  ): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName("Soigner");
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    if (mode === 'heal') {
      // Mode 1: Heal target
      if (!targetCharacterId) {
        throw new Error("Cible requise pour soigner");
      }

      const target = await this.prisma.character.findUnique({
        where: { id: targetCharacterId },
      });

      if (!target) {
        throw new Error("Personnage cible non trouvé");
      }

      if (target.hp >= 5) {
        throw new Error("La cible a déjà tous ses PV");
      }

      // Vérifier si la cible est en agonie affamé (hungerLevel=0 ET hp=1)
      if (target.hungerLevel === 0 && target.hp === 1) {
        throw new Error("Impossible de soigner un personnage en agonie affamé. Il doit d'abord manger.");
      }

      // Vérifier les PA et les restrictions (Agonie, Déprime) - 1 PA pour heal
      validateCanUsePA(character, 1);

      await this.prisma.character.update({
        where: { id: targetCharacterId },
        data: { hp: Math.min(5, target.hp + 1) }
      });

      // Consommer le PA du soigneur
      await consumePA(characterId, 1, this.prisma);

      return {
        success: true,
        message: `Vous avez soigné ${target.name} (+1 PV)`,
      };

    } else {
      // Mode 2: Craft cataplasme

      // Vérifier les PA et les restrictions (Agonie, Déprime) - 2 PA pour craft
      validateCanUsePA(character, 2);

      // Check cataplasme limit (max 3 per town including expeditions)
      const cataplasmeCount = await this.getCataplasmeCount(character.townId);

      if (cataplasmeCount >= 3) {
        throw new Error("Limite de cataplasmes atteinte (max 3 par ville)");
      }

      await this.prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: (await this.prisma.resourceType.findFirst({ where: { name: "Cataplasme" } }))!.id,
          },
        },
        update: {
          quantity: { increment: 1 },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: (await this.prisma.resourceType.findFirst({ where: { name: "Cataplasme" } }))!.id,
          quantity: 1,
        },
      });

      // Consommer les PA
      await consumePA(characterId, 2, this.prisma);

      return {
        success: true,
        message: "Vous avez préparé un cataplasme",
      };
    }
  }

  /**
   * Récupère le nombre total de cataplasmes dans une ville (city + expeditions)
   */
  async getCataplasmeCount(townId: string): Promise<number> {
    // Count cataplasmes in city
    const cataplasmeType = await this.prisma.resourceType.findFirst({
      where: { name: "Cataplasme" }
    });

    if (!cataplasmeType) {
      return 0;
    }

    const cityStock = await this.prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: "CITY",
          locationId: townId,
          resourceTypeId: cataplasmeType.id
        }
      }
    });

    // Count cataplasmes in all town expeditions
    const expeditionStocks = await this.prisma.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        expedition: {
          townId: townId
        },
        resourceTypeId: cataplasmeType.id
      }
    });

    const cityCount = cityStock?.quantity || 0;
    const expeditionCount = expeditionStocks.reduce((sum, stock) => sum + stock.quantity, 0);

    return cityCount + expeditionCount;
  }

  /**
   * Exécute une capacité de recherche (Analyser, Cartographier, Auspice)
   */
  async executeResearch(
    characterId: string,
    researchType: 'analyser' | 'cartographier' | 'auspice',
    paSpent: 1 | 2,
    _subject: string
  ): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capabilityName = researchType.charAt(0).toUpperCase() + researchType.slice(1);
    const capability = await this.getCapabilityByName(capabilityName);
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, paSpent);

    // Consommer les PA
    await consumePA(characterId, paSpent, this.prisma);

    const infoCount = paSpent === 1 ? 1 : 3;

    return {
      success: true,
      message: `Recherche lancée (${infoCount} information(s))`,
    };
  }

  /**
   * Utilise un cataplasme sur un personnage
   */
  async useCataplasme(characterId: string): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        town: true,
        expeditionMembers: {
          include: { expedition: true }
        }
      }
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    if (character.isDead) {
      throw new Error("Personnage mort");
    }

    if (character.hp >= 5) {
      throw new Error("PV déjà au maximum");
    }

    // Determine location (city or DEPARTED expedition)
    const departedExpedition = character.expeditionMembers.find(
      em => em.expedition.status === "DEPARTED"
    );

    const locationType = departedExpedition ? "EXPEDITION" : "CITY";
    const locationId = departedExpedition ? departedExpedition.expeditionId : character.townId;

    // Check cataplasme availability
    const cataplasmeType = await this.prisma.resourceType.findFirst({
      where: { name: "Cataplasme" }
    });

    if (!cataplasmeType) {
      throw new Error("Type de ressource Cataplasme non trouvé");
    }

    const stock = await this.prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: cataplasmeType.id
        }
      }
    });

    if (!stock || stock.quantity < 1) {
      throw new Error("Aucun cataplasme disponible");
    }

    // Use cataplasme
    await this.prisma.$transaction(async (tx) => {
      // Remove 1 cataplasme
      await tx.resourceStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: 1 } }
      });

      // Heal +1 HP
      await tx.character.update({
        where: { id: characterId },
        data: { hp: Math.min(5, character.hp + 1) }
      });
    });

    return {
      success: true,
      message: `${character.name} utilise un cataplasme et retrouve des forces (+1 PV).`
    };
  }

  /**
   * Exécute la capacité Divertir mise à jour (V2)
   */
  async executeDivertir(characterId: string): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName("Divertir");
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    const newCounter = character.divertCounter + 1;

    if (newCounter < 5) {
      // Not ready for spectacle yet
      await this.prisma.character.update({
        where: { id: characterId },
        data: {
          divertCounter: newCounter,
          paTotal: { decrement: capability.costPA },
          paUsedToday: { increment: capability.costPA }
        }
      });

      return {
        success: true,
        message: `Vous préparez un spectacle (${newCounter}/5)`,
      };

    } else {
      // Spectacle ready! +1 PM to all city characters (not in DEPARTED expeditions)
      await this.prisma.$transaction(async (tx) => {
        // Reset counter and consume PA
        await tx.character.update({
          where: { id: characterId },
          data: {
            divertCounter: 0,
            paTotal: { decrement: capability.costPA },
            paUsedToday: { increment: capability.costPA }
          }
        });

        // +1 PM to all characters in the same city (not in DEPARTED expeditions)
        const cityCharacters = await tx.character.findMany({
          where: {
            townId: character.townId,
            isDead: false,
            expeditionMembers: {
              none: {
                expedition: { status: "DEPARTED" }
              }
            }
          }
        });

        for (const char of cityCharacters) {
          if (char.pm < 5) {
            await tx.character.update({
              where: { id: char.id },
              data: { pm: Math.min(5, char.pm + 1) }
            });
          }
        }
      });

      return {
        success: true,
        message: "Votre spectacle remonte le moral de la ville !",
      };
    }
  }
}
