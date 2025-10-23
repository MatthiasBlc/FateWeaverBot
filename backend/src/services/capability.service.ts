import {
  PrismaClient,
  Capability as PrismaCapability,
  CapabilityCategory,
} from "@prisma/client";
import { getHuntYield, getGatherYield } from "../util/capacityRandom";
import {
  consumePA,
  validateCanUsePA,
  hasLuckyRollBonus,
} from "../util/character-validators";
import { dailyEventLogService } from "./daily-event-log.service";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils } from "../shared/utils";
import { CapabilityRepository } from "../domain/repositories/capability.repository";
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
} from "../shared/errors";
import { RESOURCES } from "@shared/index";

type CapabilityWithRelations = PrismaCapability & {
  characters: { characterId: string }[];
};

export class CapabilityService {
  private capabilityRepo: CapabilityRepository;

  constructor(
    private prisma: PrismaClient,
    capabilityRepo?: CapabilityRepository
  ) {
    this.capabilityRepo = capabilityRepo || new CapabilityRepository(prisma);
  }

  /**
   * Récupère toutes les capacités disponibles
   */
  async getAllCapabilities(): Promise<PrismaCapability[]> {
    return this.capabilityRepo.findAll();
  }

  /**
   * Récupère une capacité par son ID
   */
  async getCapabilityById(id: string): Promise<CapabilityWithRelations | null> {
    return this.capabilityRepo.findByIdWithCharacters(id);
  }

  /**
   * Récupère une capacité par son nom
   */
  async getCapabilityByName(name: string): Promise<PrismaCapability | null> {
    return this.capabilityRepo.findByName(name);
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
    return this.capabilityRepo.create({
      name: data.name,
      category: data.category,
      costPA: data.costPA,
      description: data.description,
      emojiTag: data.emojiTag,
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
    return this.capabilityRepo.update(id, {
      name: data.name,
      category: data.category,
      costPA: data.costPA,
      description: data.description,
    });
  }

  /**
   * Supprime une capacité
   */
  async deleteCapability(id: string): Promise<void> {
    await this.capabilityRepo.delete(id);
  }

  /**
   * Vérifie si un personnage possède une capacité
   */
  async hasCapability(
    characterId: string,
    capabilityId: string
  ): Promise<boolean> {
    return this.capabilityRepo.hasCharacterCapability(
      characterId,
      capabilityId
    );
  }

  /**
   * Ajoute une capacité à un personnage
   */
  async addCapabilityToCharacter(
    characterId: string,
    capabilityId: string
  ): Promise<void> {
    await this.capabilityRepo.addCapabilityToCharacter(
      characterId,
      capabilityId
    );
  }

  /**
   * Supprime une capacité d'un personnage
   */
  async removeCapabilityFromCharacter(
    characterId: string,
    capabilityId: string
  ): Promise<void> {
    await this.capabilityRepo.removeCapabilityFromCharacter(
      characterId,
      capabilityId
    );
  }

  /**
   * Récupère toutes les capacités d'un personnage
   */
  async getCharacterCapabilities(
    characterId: string
  ): Promise<PrismaCapability[]> {
    return this.capabilityRepo.getCharacterCapabilities(characterId);
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
    isSummer: boolean
  ): Promise<{
    success: boolean;
    foodGained: number;
    message: string;
    luckyRollUsed?: boolean;
  }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capability = await this.getCapabilityByName(capabilityName);
    if (!capability) {
      throw new NotFoundError("Capability", capabilityName);
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
    }

    // Vérifier si le personnage a le bonus LUCKY_ROLL pour cette capacité
    const hasBonus = await hasLuckyRollBonus(
      characterId,
      capability.id,
      this.prisma
    );

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    // Calculer la récolte en fonction de la capacité et de la saison
    let foodGained = 0;
    let message = "";

    switch (capabilityName.toLowerCase()) {
      case "chasser":
        foodGained = getHuntYield(isSummer, hasBonus);
        message = `🦌 ${character.name} est revenu de la chasse avec ${foodGained} vivres !`;
        if (hasBonus) {
          message += " ⭐ (Lucky Roll)";
        }
        break;

      case "cueillir":
        foodGained = getGatherYield(isSummer, hasBonus);
        message = `🌿 ${character.name} a cueilli ${foodGained} vivres.`;
        if (hasBonus) {
          message += " ⭐ (Lucky Roll)";
        }
        break;

      default:
        throw new BadRequestError("Capacité de récolte non reconnue");
    }

    // Mettre à jour les PA et ajouter les ressources à la ville
    const vivresType = await this.prisma.resourceType.findFirst({
      where: { name: "Vivres" },
    });

    await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: capability.costPA },
          paUsedToday: { increment: capability.costPA },
        },
      }),
      // Ajouter les vivres au stock de la ville
      this.prisma.resourceStock.upsert({
        where: ResourceQueries.stockWhere(
          "CITY",
          character.townId,
          vivresType!.id
        ),
        update: {
          quantity: { increment: foodGained },
        },
        create: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: vivresType!.id,
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

    return { success: true, foodGained, message, luckyRollUsed: hasBonus };
  }

  /**
   * Exécute la capacité Couper du bois
   */
  async executeCouperDuBois(characterId: string): Promise<{
    success: boolean;
    woodGained: number;
    message: string;
    luckyRollUsed?: boolean;
  }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capability = await this.getCapabilityByName("Couper du bois");
    if (!capability) {
      throw new NotFoundError("Capability", "Couper du bois");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition =
      await this.capabilityRepo.findExpeditionMemberWithDepartedExpedition(
        characterId
      );

    if (departedExpedition) {
      throw new BadRequestError(
        "Impossible de Couper du bois en expédition DEPARTED"
      );
    }

    // Vérifier si le personnage a le bonus LUCKY_ROLL pour cette capacité
    const hasBonus = await hasLuckyRollBonus(
      characterId,
      capability.id,
      this.prisma
    );

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    // Calculer le rendement (2-3 bois)
    let woodGained: number;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde le meilleur
      const roll1 = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const roll2 = Math.floor(Math.random() * 2) + 2; // 2 or 3
      woodGained = Math.max(roll1, roll2);
    } else {
      woodGained = Math.floor(Math.random() * 2) + 2; // 2 or 3
    }

    // Récupérer le type de ressource "Bois"
    const boisType = await ResourceUtils.getResourceTypeByName("Bois");

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
        where: ResourceQueries.stockWhere(
          "CITY",
          character.townId,
          boisType.id
        ),
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

    const message = hasBonus
      ? `Vous avez récolté ${woodGained} bois ⭐ (Lucky Roll)`
      : `Vous avez récolté ${woodGained} bois`;

    return {
      success: true,
      woodGained,
      message,
      luckyRollUsed: hasBonus,
    };
  }

  /**
   * Exécute la capacité Miner
   */
  async executeMiner(characterId: string): Promise<{
    success: boolean;
    oreGained: number;
    message: string;
    publicMessage: string;
    loot?: { [key: string]: number };
    luckyRollUsed?: boolean;
  }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capability = await this.getCapabilityByName("Miner");
    if (!capability) {
      throw new NotFoundError("Capability", "Miner");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition =
      await this.capabilityRepo.findExpeditionMemberWithDepartedExpedition(
        characterId
      );

    if (departedExpedition) {
      throw new BadRequestError("Impossible de Miner en expédition DEPARTED");
    }

    // Vérifier si le personnage a le bonus LUCKY_ROLL pour cette capacité
    const hasBonus = await hasLuckyRollBonus(
      characterId,
      capability.id,
      this.prisma
    );

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, capability.costPA);

    // Calculer le rendement (2-6 minerai)
    let oreGained: number;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde le meilleur
      const roll1 = Math.floor(Math.random() * 5) + 2; // 2-6
      const roll2 = Math.floor(Math.random() * 5) + 2; // 2-6
      oreGained = Math.max(roll1, roll2);
    } else {
      oreGained = Math.floor(Math.random() * 5) + 2; // 2-6
    }

    // Récupérer le type de ressource "Minerai"
    const mineraiType = await ResourceUtils.getResourceTypeByName("Minerai");

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
        where: ResourceQueries.stockWhere(
          "CITY",
          character.townId,
          mineraiType.id
        ),
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

    const message = hasBonus
      ? `De retour des montagnes. Tu as trouvé un nouveau filon et extrait ${oreGained} ⚙️ ⭐ (Lucky Roll)`
      : `De retour des montagnes. Tu as trouvé un nouveau filon et extrait ${oreGained} ⚙️`;
    const publicMessage = hasBonus
      ? `⛏️ ${character.name} a trouvé un joli filon et revient avec ${oreGained} ⚙️ ⭐`
      : `⛏️ ${character.name} a trouvé un joli filon et revient avec ${oreGained} ⚙️`;
    return {
      success: true,
      oreGained,
      message,
      publicMessage,
      luckyRollUsed: hasBonus,
    };
  }

  /**
   * Exécute la capacité Pêcher avec tables de loot depuis la DB (V3)
   */
  async executeFish(
    characterId: string,
    paSpent: 1 | 2
  ): Promise<{
    success: boolean;
    loot?: Record<string, number>;
    message: string;
    objectFound?: string;
    luckyRollUsed?: boolean;
  }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capability = await this.getCapabilityByName("Pêcher");
    if (!capability) {
      throw new NotFoundError("Capability", "Pêcher");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition =
      await this.capabilityRepo.findExpeditionMemberWithDepartedExpedition(
        characterId
      );

    if (departedExpedition) {
      throw new BadRequestError("Impossible de Pêcher en expédition DEPARTED");
    }

    // Vérifier si le personnage a le bonus LUCKY_ROLL pour cette capacité
    const hasBonus = await hasLuckyRollBonus(
      characterId,
      capability.id,
      this.prisma
    );

    // Vérifier les PA et les restrictions (Agonie, Déprime)
    validateCanUsePA(character, paSpent);

    // Récupérer les entrées de loot depuis la DB
    const lootEntries = await this.capabilityRepo.getFishingLootEntries(
      paSpent
    );

    if (lootEntries.length === 0) {
      throw new BadRequestError(
        `Aucune table de loot trouvée pour ${paSpent} PA`
      );
    }

    // Tirer aléatoirement une entrée (ou deux si LUCKY_ROLL)
    let lootEntry;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde l'index le plus élevé (meilleur dans la table)
      const randomIndex1 = Math.floor(Math.random() * lootEntries.length);
      const randomIndex2 = Math.floor(Math.random() * lootEntries.length);
      const bestIndex = Math.max(randomIndex1, randomIndex2);
      lootEntry = lootEntries[bestIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * lootEntries.length);
      lootEntry = lootEntries[randomIndex];
    }

    // Cas spécial pour Coquillage (objet)
    if (lootEntry.resourceName === "Coquillage") {
      // Récupérer l'objet Coquillage
      const coquillageObject = await this.prisma.objectType.findUnique({
        where: { name: "Coquillage" },
      });

      if (!coquillageObject) {
        throw new NotFoundError("Object", "Coquillage");
      }

      // Ajouter le coquillage à l'inventaire du personnage
      const inventory = await this.prisma.characterInventory.upsert({
        where: { characterId },
        create: { characterId },
        update: {}, // No updates needed if it already exists
      });

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
            objectTypeId: coquillageObject.id,
          },
        }),
      ]);

      const message = hasBonus
        ? `${character.name} a trouvé un coquillage ! ⭐ (Lucky Roll) (-${paSpent} PA)`
        : `${character.name} a trouvé un coquillage ! (-${paSpent} PA)`;

      return {
        success: true,
        objectFound: "Coquillage",
        message,
        luckyRollUsed: hasBonus,
      };
    }

    // Cas normal : ajouter la ressource au stock
    const resourceType = await this.prisma.resourceType.findFirst({
      where: { name: lootEntry.resourceName },
    });

    if (!resourceType) {
      throw new NotFoundError("Resource type", lootEntry.resourceName);
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
        where: ResourceQueries.stockWhere(
          "CITY",
          character.townId,
          resourceType.id
        ),
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

    const message = hasBonus
      ? `Vous avez pêché ${lootEntry.quantity} ${lootEntry.resourceName} ⭐ (Lucky Roll) (-${paSpent} PA)`
      : `Vous avez pêché ${lootEntry.quantity} ${lootEntry.resourceName} (-${paSpent} PA)`;

    return {
      success: true,
      loot: { [lootEntry.resourceName.toLowerCase()]: lootEntry.quantity },
      message,
      luckyRollUsed: hasBonus,
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
  ): Promise<{
    success: boolean;
    outputAmount: number;
    message: string;
    luckyRollUsed?: boolean;
  }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    // Vérifier que le personnage n'est pas en expédition DEPARTED
    const departedExpedition =
      await this.capabilityRepo.findExpeditionMemberWithDepartedExpedition(
        characterId
      );

    if (departedExpedition) {
      throw new BadRequestError("Impossible de crafter en expédition DEPARTED");
    }

    // Vérifier les PA et les restrictions (Agonie, Déprime) AVANT de check le craft type
    validateCanUsePA(character, paSpent);

    // Configuration des crafts
    const CRAFT_CONFIGS: Record<
      string,
      { inputResource: string; outputResource: string; verb: string }
    > = {
      tisser: {
        inputResource: "Bois",
        outputResource: "Tissu",
        verb: "tissé",
      },
      forger: {
        inputResource: "Minerai",
        outputResource: "Fer",
        verb: "forgé",
      },
      menuiser: {
        inputResource: "Bois",
        outputResource: "Planches",
        verb: "travaillé",
      },
      cuisiner: {
        inputResource: "Vivres",
        outputResource: "Repas",
        verb: "cuisiné",
      },
    };

    const config = CRAFT_CONFIGS[craftType];
    if (!config) {
      throw new BadRequestError("Type de craft non reconnu");
    }

    // Vérifier les PA vs quantité d'input
    if (paSpent === 1 && (inputAmount < 1 || inputAmount > 2)) {
      throw new ValidationError("1 PA permet 1-2 ressources en entrée");
    }
    if (paSpent === 2 && (inputAmount < 2 || inputAmount > 5)) {
      throw new ValidationError("2 PA permet 2-5 ressources en entrée");
    }

    // Vérifier le stock d'input
    const inputResourceType = await this.prisma.resourceType.findFirst({
      where: { name: config.inputResource },
    });

    if (!inputResourceType) {
      throw new NotFoundError("Resource type", config.inputResource);
    }

    const inputStock = await this.prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(
        "CITY",
        character.townId,
        inputResourceType.id
      ),
    });

    if (!inputStock || inputStock.quantity < inputAmount) {
      throw new BadRequestError(
        `Stock insuffisant: ${inputStock?.quantity || 0}/${inputAmount} ${
          config.inputResource
        }`
      );
    }

    // Vérifier si le personnage a le bonus LUCKY_ROLL pour Cuisiner
    let hasBonus = false;
    if (craftType === "cuisiner") {
      const capability = await this.capabilityRepo.findFirst({
        name: "Cuisiner",
      });
      if (capability) {
        hasBonus = await hasLuckyRollBonus(
          characterId,
          capability.id,
          this.prisma
        );
      }
    }

    // Calculer l'output avec la formule aléatoire
    // 1 PA: Output = random(0, Input × 2)
    // 2 PA: Output = random(0, Input × 3)
    const minOutput = 0;
    const maxOutput = paSpent === 1 ? inputAmount * 2 : inputAmount * 3;

    let outputAmount: number;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde le meilleur
      const roll1 =
        Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
      const roll2 =
        Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
      outputAmount = Math.max(roll1, roll2);
    } else {
      outputAmount =
        Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;
    }

    // Récupérer le type de ressource d'output
    const outputResourceType = await this.prisma.resourceType.findFirst({
      where: { name: config.outputResource },
    });

    if (!outputResourceType) {
      throw new NotFoundError("Resource type", config.outputResource);
    }

    // Exécuter le craft
    await this.prisma.$transaction(async (tx) => {
      // Retirer l'input
      await tx.resourceStock.update({
        where: ResourceQueries.stockWhere(
          "CITY",
          character.townId,
          inputResourceType.id
        ),
        data: {
          quantity: { decrement: inputAmount },
        },
      });

      // Ajouter l'output
      await tx.resourceStock.upsert({
        where: ResourceQueries.stockWhere(
          "CITY",
          character.townId,
          outputResourceType.id
        ),
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

    const message = hasBonus
      ? `Vous avez obtenu ${outputAmount} ${config.outputResource} ⭐ (Lucky Roll)`
      : `Vous avez obtenu ${outputAmount} ${config.outputResource}`;

    return {
      success: true,
      outputAmount,
      message,
      luckyRollUsed: hasBonus,
    };
  }

  /**
   * Exécute la capacité Soigner
   */
  async executeSoigner(
    characterId: string,
    mode: "heal" | "craft",
    targetCharacterId?: string
  ): Promise<{ success: boolean; message: string; publicMessage?: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capability = await this.getCapabilityByName("Soigner");
    if (!capability) {
      throw new NotFoundError("Capability", "Soigner");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
    }

    if (mode === "heal") {
      // Mode 1: Heal target
      if (!targetCharacterId) {
        throw new ValidationError("Cible requise pour soigner");
      }

      const target = await this.prisma.character.findUnique({
        where: { id: targetCharacterId },
      });

      if (!target) {
        throw new NotFoundError("Target character", targetCharacterId);
      }

      if (target.hp >= 5) {
        throw new BadRequestError("La cible a déjà tous ses PV");
      }

      // Vérifier si la cible est en agonie affamé (hungerLevel=0 ET hp=1)
      if (target.hungerLevel === 0 && target.hp === 1) {
        throw new BadRequestError(
          "Impossible de soigner un personnage en agonie affamé. Il doit d'abord manger."
        );
      }

      // Vérifier les PA et les restrictions (Agonie, Déprime) - 1 PA pour heal
      validateCanUsePA(character, 1);

      await this.prisma.character.update({
        where: { id: targetCharacterId },
        data: { hp: Math.min(5, target.hp + 1) },
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
        throw new BadRequestError(
          "Limite de cataplasmes atteinte (max 3 par ville)"
        );
      }

      const cataplasmeType = await ResourceUtils.getResourceTypeByName(
        "Cataplasme"
      );
      await ResourceUtils.upsertStock(
        "CITY",
        character.townId,
        cataplasmeType.id,
        1
      );

      // Consommer les PA
      await consumePA(characterId, 2, this.prisma);

      return {
        success: true,
        message: "Vous avez préparé un cataplasme",
        publicMessage: `${character.name} a préparé un ${RESOURCES.CATAPLASM}.`,
      };
    }
  }

  /**
   * Récupère le nombre total de cataplasmes dans une ville (city + expeditions)
   */
  async getCataplasmeCount(townId: string): Promise<number> {
    // Count cataplasmes in city
    const cataplasmeType = await ResourceUtils.getResourceTypeByName(
      "Cataplasme"
    );

    const cityStock = await ResourceUtils.getStock(
      "CITY",
      townId,
      cataplasmeType.id
    );

    // Count cataplasmes in all town expeditions
    // First get all expeditions for this town
    const townExpeditions = await this.prisma.expedition.findMany({
      where: { townId: townId },
      select: { id: true },
    });

    const expeditionStocks = await this.prisma.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        locationId: {
          in: townExpeditions.map((exp) => exp.id),
        },
        resourceTypeId: cataplasmeType.id,
      },
    });

    const cityCount = cityStock?.quantity || 0;
    const expeditionCount = expeditionStocks.reduce(
      (sum, stock) => sum + stock.quantity,
      0
    );

    return cityCount + expeditionCount;
  }

  /**
   * Exécute une capacité de recherche (Rechercher, Cartographier, Auspice)
   */
  async executeResearch(
    characterId: string,
    researchType: "rechercher" | "cartographier" | "auspice",
    paSpent: 1 | 2
  ): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capabilityName =
      researchType.charAt(0).toUpperCase() + researchType.slice(1);
    const capability = await this.getCapabilityByName(capabilityName);
    if (!capability) {
      throw new NotFoundError("Capability", capabilityName);
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
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
  async useCataplasme(
    characterId: string
  ): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        town: true,
        expeditionMembers: {
          include: { expedition: true },
        },
      },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    if (character.isDead) {
      throw new BadRequestError("Personnage mort");
    }

    if (character.hp >= 5) {
      throw new BadRequestError("PV déjà au maximum");
    }

    // Determine location (city or DEPARTED expedition)
    const departedExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    const locationType = departedExpedition ? "EXPEDITION" : "CITY";
    const locationId = departedExpedition
      ? departedExpedition.expeditionId
      : character.townId;

    // Check cataplasme availability
    const cataplasmeType = await ResourceUtils.getResourceTypeByName(
      "Cataplasme"
    );

    const stock = await ResourceUtils.getStock(
      locationType,
      locationId,
      cataplasmeType.id
    );

    if (!stock || stock.quantity < 1) {
      throw new BadRequestError("Aucun cataplasme disponible");
    }

    // Use cataplasme
    await this.prisma.$transaction(async (tx) => {
      // Remove 1 cataplasme
      await tx.resourceStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: 1 } },
      });

      // Heal +1 HP
      await tx.character.update({
        where: { id: characterId },
        data: { hp: Math.min(5, character.hp + 1) },
      });
    });

    return {
      success: true,
      message: `${character.name} utilise un cataplasme et retrouve des forces (+1 PV).`,
    };
  }

  /**
   * Exécute la capacité Divertir mise à jour (V2)
   */
  async executeDivertir(
    characterId: string
  ): Promise<{ success: boolean; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const capability = await this.getCapabilityByName("Divertir");
    if (!capability) {
      throw new NotFoundError("Capability", "Divertir");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new BadRequestError("Le personnage ne possède pas cette capacité");
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
          paUsedToday: { increment: capability.costPA },
        },
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
            paUsedToday: { increment: capability.costPA },
          },
        });

        // +1 PM to all characters in the same city (not in DEPARTED expeditions)
        const cityCharacters = await tx.character.findMany({
          where: {
            townId: character.townId,
            isDead: false,
            expeditionMembers: {
              none: {
                expedition: { status: "DEPARTED" },
              },
            },
          },
        });

        for (const char of cityCharacters) {
          if (char.pm < 5) {
            await tx.character.update({
              where: { id: char.id },
              data: { pm: Math.min(5, char.pm + 1) },
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
