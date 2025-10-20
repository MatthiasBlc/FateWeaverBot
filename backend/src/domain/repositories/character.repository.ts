import { PrismaClient, Prisma } from "@prisma/client";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";

export class CharacterRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.character.findUnique({
      where: { id },
      ...CharacterQueries.fullInclude()
    });
  }

  async findActiveCharacter(userId: string, townId: string) {
    return this.prisma.character.findFirst({
      where: {
        userId,
        townId,
        isActive: true
      },
      ...CharacterQueries.fullInclude()
    });
  }

  async findUserByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId },
      include: {
        characters: {
          ...CharacterQueries.fullInclude()
        }
      }
    });
  }

  async findAllByTown(townId: string) {
    return this.prisma.character.findMany({
      where: { townId, isDead: false },
      ...CharacterQueries.baseInclude()
    });
  }

  async findAllByGuild(guildId: string) {
    return this.prisma.character.findMany({
      where: {
        town: { guildId }
      },
      ...CharacterQueries.baseInclude()
    });
  }

  async findAllDead(townId: string) {
    return this.prisma.character.findMany({
      where: { townId, isDead: true },
      ...CharacterQueries.baseInclude()
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.CharacterCreateInput) {
    return this.prisma.character.create({
      data,
      ...CharacterQueries.fullInclude()
    });
  }

  async createUser(discordId: string, username: string, discriminator: string) {
    return this.prisma.user.create({
      data: {
        discordId,
        username,
        discriminator
      }
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.CharacterUpdateInput) {
    return this.prisma.character.update({
      where: { id },
      data,
      ...CharacterQueries.fullInclude()
    });
  }

  async updateStats(id: string, hp?: number, pm?: number, paTotal?: number) {
    const data: Prisma.CharacterUpdateInput = {};
    if (hp !== undefined) data.hp = hp;
    if (pm !== undefined) data.pm = pm;
    if (paTotal !== undefined) data.paTotal = paTotal;

    return this.prisma.character.update({
      where: { id },
      data,
      ...CharacterQueries.baseInclude()
    });
  }

  async updateHunger(id: string, hungerLevel: number) {
    return this.prisma.character.update({
      where: { id },
      data: { hungerLevel },
      ...CharacterQueries.baseInclude()
    });
  }

  async deactivateOtherCharacters(userId: string, townId: string, exceptId?: string) {
    return this.prisma.character.updateMany({
      where: {
        userId,
        townId,
        id: exceptId ? { not: exceptId } : undefined
      },
      data: { isActive: false }
    });
  }

  async revive(id: string) {
    return this.prisma.character.update({
      where: { id },
      data: {
        isDead: false,
        hp: 5,
        pm: 5,
        hungerLevel: 4
      },
      ...CharacterQueries.fullInclude()
    });
  }

  async kill(id: string) {
    return this.prisma.character.update({
      where: { id },
      data: {
        isDead: true,
        hp: 0
      },
      ...CharacterQueries.fullInclude()
    });
  }

  // =====================
  // CAPABILITY METHODS
  // =====================

  async addCapability(characterId: string, capabilityId: string) {
    return this.prisma.characterCapability.create({
      data: {
        characterId,
        capabilityId
      },
      include: {
        capability: true,
        character: CharacterQueries.withCapabilities()
      }
    });
  }

  async removeCapability(characterId: string, capabilityId: string) {
    return this.prisma.characterCapability.delete({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId
        }
      }
    });
  }

  async getCapabilities(characterId: string) {
    return this.prisma.characterCapability.findMany({
      where: { characterId },
      include: { capability: true },
      orderBy: { capability: { name: "asc" } }
    });
  }

  async hasCapability(characterId: string, capabilityName: string): Promise<boolean> {
    const capability = await this.prisma.characterCapability.findFirst({
      where: {
        characterId,
        capability: { name: capabilityName }
      }
    });
    return capability !== null;
  }

  // =====================
  // INVENTORY METHODS
  // =====================

  async getInventory(characterId: string) {
    return this.prisma.characterInventory.findUnique({
      where: { characterId },
      include: {
        slots: {
          include: { objectType: true }
        }
      }
    });
  }

  async addItemToInventory(characterId: string, objectTypeId: number) {
    const inventory = await this.prisma.characterInventory.findUnique({
      where: { characterId }
    });

    if (!inventory) {
      throw new Error(`No inventory found for character ${characterId}`);
    }

    return this.prisma.characterInventorySlot.create({
      data: {
        inventoryId: inventory.id,
        objectTypeId
      },
      include: { objectType: true }
    });
  }

  async removeItemFromInventory(slotId: string) {
    return this.prisma.characterInventorySlot.delete({
      where: { id: slotId }
    });
  }

  // =====================
  // SKILL METHODS
  // =====================

  async addSkill(characterId: string, skillId: string) {
    return this.prisma.characterSkill.create({
      data: {
        characterId,
        skillId
      },
      include: {
        skill: true,
        character: true
      }
    });
  }

  async removeSkill(characterId: string, skillId: string) {
    return this.prisma.characterSkill.delete({
      where: {
        characterId_skillId: {
          characterId,
          skillId
        }
      }
    });
  }

  async getSkills(characterId: string) {
    return this.prisma.characterSkill.findMany({
      where: { characterId },
      include: { skill: true }
    });
  }

  // =====================
  // ROLE METHODS
  // =====================

  async addRole(characterId: string, roleId: string) {
    return this.prisma.characterRole.create({
      data: {
        characterId,
        roleId
      },
      include: {
        role: true,
        character: true
      }
    });
  }

  async removeRole(characterId: string, roleId: string) {
    const characterRole = await this.prisma.characterRole.findFirst({
      where: { characterId, roleId }
    });

    if (!characterRole) {
      throw new Error(`Role assignment not found for character ${characterId} and role ${roleId}`);
    }

    return this.prisma.characterRole.delete({
      where: { id: characterRole.id }
    });
  }

  async getRoles(characterId: string) {
    return this.prisma.characterRole.findMany({
      where: { characterId },
      include: { role: true }
    });
  }
}
