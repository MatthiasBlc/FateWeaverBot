import { PrismaClient, Prisma } from "@prisma/client";

export class CapabilityRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.capability.findUnique({
      where: { id }
    });
  }

  async findByIdWithCharacters(id: string) {
    return this.prisma.capability.findUnique({
      where: { id },
      include: {
        characters: {
          select: { characterId: true }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.capability.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findByName(name: string) {
    return this.prisma.capability.findUnique({
      where: { name }
    });
  }

  async findFirst(where: Prisma.CapabilityWhereInput) {
    return this.prisma.capability.findFirst({
      where
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.CapabilityCreateInput) {
    return this.prisma.capability.create({
      data
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.CapabilityUpdateInput) {
    return this.prisma.capability.update({
      where: { id },
      data
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.capability.delete({
      where: { id }
    });
  }

  // =====================
  // CHARACTER-CAPABILITY JUNCTION METHODS
  // =====================

  async hasCharacterCapability(characterId: string, capabilityId: string): Promise<boolean> {
    const count = await this.prisma.characterCapability.count({
      where: {
        characterId,
        capabilityId
      }
    });
    return count > 0;
  }

  async addCapabilityToCharacter(characterId: string, capabilityId: string) {
    return this.prisma.characterCapability.create({
      data: {
        characterId,
        capabilityId
      }
    });
  }

  async removeCapabilityFromCharacter(characterId: string, capabilityId: string) {
    return this.prisma.characterCapability.delete({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId
        }
      }
    });
  }

  async getCharacterCapabilities(characterId: string) {
    const capabilities = await this.prisma.characterCapability.findMany({
      where: { characterId },
      include: { capability: true }
    });

    return capabilities.map((c) => c.capability);
  }

  // =====================
  // FISHING LOOT METHODS
  // =====================

  async getFishingLootEntries(paTable: 1 | 2) {
    return this.prisma.fishingLootEntry.findMany({
      where: {
        paTable,
        isActive: true
      },
      orderBy: {
        orderIndex: "asc"
      }
    });
  }

  async findExpeditionMemberWithDepartedExpedition(characterId: string) {
    return this.prisma.expeditionMember.findFirst({
      where: {
        characterId,
        expedition: { status: "DEPARTED" }
      }
    });
  }
}
