import { PrismaClient, Prisma } from "@prisma/client";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { NotFoundError } from "../../shared/errors";

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

  async findActiveCharacterAlive(userId: string, townId: string) {
    return this.prisma.character.findFirst({
      where: {
        userId,
        townId,
        isActive: true,
        isDead: false
      },
      ...CharacterQueries.fullInclude(),
      orderBy: { createdAt: "desc" }
    });
  }

  async findRerollableCharacters(userId: string, townId: string) {
    return this.prisma.character.findMany({
      where: {
        userId,
        townId,
        isDead: true,
        canReroll: true,
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

  async findAllByTownWithDetails(townId: string) {
    return this.prisma.character.findMany({
      where: { townId },
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true
          }
        },
        expeditionMembers: {
          include: {
            expedition: true
          }
        }
      },
      orderBy: [
        { isDead: "asc" },
        { isActive: "desc" },
        { createdAt: "desc" }
      ]
    });
  }

  async findWithCapabilities(characterId: string) {
    return this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        capabilities: {
          include: {
            capability: true
          }
        }
      }
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

  /**
   * Creates a character with base capabilities and job-specific abilities
   * Handles the full transaction logic including deactivating old characters
   */
  async createCharacterWithCapabilities(data: {
    name: string;
    userId: string;
    townId: string;
    jobId?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Deactivate all active characters for this user in this town
      await tx.character.updateMany({
        where: {
          userId: data.userId,
          townId: data.townId,
          isActive: true
        },
        data: { isActive: false }
      });

      // Create the new character
      const character = await tx.character.create({
        data: {
          name: data.name,
          userId: data.userId,
          townId: data.townId,
          jobId: data.jobId,
          paTotal: 2,
          hungerLevel: 4,
          hp: 5,
          pm: 5,
          isActive: true,
          divertCounter: 0
        }
      });

      // Add base capabilities
      const baseCapabilities = ["Couper du bois"];

      for (const capabilityName of baseCapabilities) {
        const capability = await tx.capability.findUnique({
          where: { name: capabilityName }
        });

        if (capability) {
          await tx.characterCapability.create({
            data: {
              characterId: character.id,
              capabilityId: capability.id
            }
          });
        }
      }

      // If a job is provided, assign the starting ability
      if (data.jobId) {
        const job = await tx.job.findUnique({
          where: { id: data.jobId },
          include: { startingAbility: true }
        });

        if (job && job.startingAbility) {
          const hasCapability = await tx.characterCapability.findUnique({
            where: {
              characterId_capabilityId: {
                characterId: character.id,
                capabilityId: job.startingAbility.id
              }
            }
          });

          if (!hasCapability) {
            await tx.characterCapability.create({
              data: {
                characterId: character.id,
                capabilityId: job.startingAbility.id
              }
            });
          }
        }
      }

      // Return the character with full details
      return tx.character.findUniqueOrThrow({
        where: { id: character.id },
        ...CharacterQueries.fullInclude()
      });
    });
  }

  /**
   * Switch active character transaction
   */
  async switchActiveCharacterTransaction(userId: string, townId: string, characterId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.character.updateMany({
        where: { userId, townId, isActive: true },
        data: { isActive: false }
      });
      return tx.character.update({
        where: { id: characterId, userId, townId, isDead: false },
        data: { isActive: true }
      });
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

  async killCharacter(characterId: string) {
    return this.prisma.character.update({
      where: { id: characterId },
      data: { isDead: true, hungerLevel: 0, paTotal: 0, hp: 0, pm: 0 }
    });
  }

  async grantRerollPermission(characterId: string) {
    return this.prisma.character.update({
      where: { id: characterId },
      data: { canReroll: true }
    });
  }

  async updateManyCharacters(where: any, data: any) {
    return this.prisma.character.updateMany({ where, data });
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

  async findCapability(capabilityId: string) {
    return this.prisma.capability.findUnique({
      where: { id: capabilityId }
    });
  }

  async findCapabilityByName(name: string) {
    return this.prisma.capability.findUnique({
      where: { name }
    });
  }

  async findCharacterCapability(characterId: string, capabilityId: string) {
    return this.prisma.characterCapability.findUnique({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId
        }
      }
    });
  }

  async findAllCapabilities() {
    return this.prisma.capability.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findAvailableCapabilities(characterId: string) {
    const characterCapabilities = await this.prisma.characterCapability.findMany({
      where: { characterId },
      select: { capabilityId: true }
    });

    const characterCapabilityIds = characterCapabilities.map(cc => cc.capabilityId);

    return this.prisma.capability.findMany({
      where: {
        id: { notIn: characterCapabilityIds }
      },
      orderBy: { name: "asc" }
    });
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
      throw new NotFoundError('Inventory', characterId);
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
      throw new NotFoundError('Role assignment', characterId);
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

  // =====================
  // JOB METHODS
  // =====================

  async findJob(jobId: number) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        startingAbility: true,
        optionalAbility: true
      }
    });
  }

  /**
   * Changes character job and swaps capabilities
   * Full transaction handling
   */
  async changeJobWithCapabilities(characterId: string, newJobId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch character with current job
      const character = await tx.character.findUnique({
        where: { id: characterId },
        include: {
          job: {
            include: {
              startingAbility: true,
              optionalAbility: true
            }
          }
        }
      });

      if (!character) {
        throw new NotFoundError('Character', characterId);
      }

      // Fetch new job
      const newJob = await tx.job.findUnique({
        where: { id: newJobId },
        include: {
          startingAbility: true,
          optionalAbility: true
        }
      });

      if (!newJob) {
        throw new NotFoundError('Job', newJobId);
      }

      // Remove old job capabilities
      if (character.job) {
        const oldJobAbilityIds: string[] = [];

        if (character.job.startingAbility) {
          oldJobAbilityIds.push(character.job.startingAbility.id);
        }

        if (character.job.optionalAbility) {
          oldJobAbilityIds.push(character.job.optionalAbility.id);
        }

        if (oldJobAbilityIds.length > 0) {
          await tx.characterCapability.deleteMany({
            where: {
              characterId: character.id,
              capabilityId: { in: oldJobAbilityIds }
            }
          });
        }
      }

      // Add new job capabilities
      const newJobAbilityIds: string[] = [];

      if (newJob.startingAbility) {
        newJobAbilityIds.push(newJob.startingAbility.id);
      }

      if (newJob.optionalAbility) {
        newJobAbilityIds.push(newJob.optionalAbility.id);
      }

      for (const abilityId of newJobAbilityIds) {
        await tx.characterCapability.upsert({
          where: {
            characterId_capabilityId: {
              characterId: character.id,
              capabilityId: abilityId
            }
          },
          update: {},
          create: {
            characterId: character.id,
            capabilityId: abilityId
          }
        });
      }

      // Update character with new job
      return tx.character.update({
        where: { id: characterId },
        data: { jobId: newJobId },
        include: {
          job: {
            include: {
              startingAbility: true,
              optionalAbility: true
            }
          },
          capabilities: {
            include: {
              capability: true
            }
          }
        }
      });
    });
  }

  //  =====================
  // CITY CHARACTERS METHODS
  // =====================

  async findCityCharacters(townId: string, excludeStatus?: string) {
    const where: any = {
      townId,
      isDead: false
    };

    if (excludeStatus === "DEPARTED") {
      where.expeditionMembers = {
        none: {
          expedition: { status: "DEPARTED" }
        }
      };
    }

    return this.prisma.character.findMany({ where });
  }
}
