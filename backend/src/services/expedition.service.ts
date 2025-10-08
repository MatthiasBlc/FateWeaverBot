import { PrismaClient, ExpeditionStatus, Prisma } from "@prisma/client";
import type { Expedition, ExpeditionMember } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

export interface CreateExpeditionData {
  name: string;
  townId: string;
  initialResources: { resourceTypeName: string; quantity: number }[]; // Remplacement de foodStock par ressources génériques
  duration: number; // in days (minimum 1)
  createdBy: string; // Discord user ID
}

export interface ExpeditionWithDetails extends Expedition {
  town: {
    id: string;
    name: string;
  };
  members: Array<
    ExpeditionMember & {
      character: {
        id: string;
        name: string;
        user: {
          id: string;
          discordId: string;
          username: string;
        };
      };
    }
  >;
  _count?: {
    members: number;
  };
}

export class ExpeditionService {
  /**
   * Récupère les ressources d'une expédition
   */
  async getExpeditionResources(expeditionId: string) {
    return await prisma.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        locationId: expeditionId,
      },
      include: {
        resourceType: true,
      },
    });
  }

  /**
   * Ajoute des ressources à une expédition
   */
  async addResourceToExpedition(
    expeditionId: string,
    resourceTypeName: string,
    quantity: number
  ): Promise<void> {
    const resourceType = await prisma.resourceType.findFirst({
      where: { name: resourceTypeName },
    });

    if (!resourceType) {
      throw new Error(`Resource type "${resourceTypeName}" not found`);
    }

    await prisma.resourceStock.upsert({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: "EXPEDITION",
          locationId: expeditionId,
          resourceTypeId: resourceType.id,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        locationType: "EXPEDITION",
        locationId: expeditionId,
        resourceTypeId: resourceType.id,
        quantity,
      },
    });
  }

  /**
   * Transfert des ressources entre ville et expédition
   */
  async transferResource(
    expeditionId: string,
    resourceTypeName: string,
    amount: number,
    direction: "to_town" | "from_town"
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      // Check expedition exists and is in PLANNING status
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, townId: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new Error(
          "Cannot transfer resources for expedition that is not in PLANNING status"
        );
      }

      if (amount <= 0) {
        throw new Error("Transfer amount must be positive");
      }

      const resourceType = await tx.resourceType.findFirst({
        where: { name: resourceTypeName },
      });

      if (!resourceType) {
        throw new Error(`Resource type "${resourceTypeName}" not found`);
      }

      if (direction === "from_town") {
        // Transfer from town to expedition
        const townStock = await tx.resourceStock.findUnique({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType: "CITY",
              locationId: expedition.townId,
              resourceTypeId: resourceType.id,
            },
          },
        });

        if (!townStock || townStock.quantity < amount) {
          throw new Error(`Not enough ${resourceTypeName} in town`);
        }

        await Promise.all([
          tx.resourceStock.update({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: expedition.townId,
                resourceTypeId: resourceType.id,
              },
            },
            data: {
              quantity: { decrement: amount },
            },
          }),
          tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "EXPEDITION",
                locationId: expeditionId,
                resourceTypeId: resourceType.id,
              },
            },
            update: {
              quantity: { increment: amount },
            },
            create: {
              locationType: "EXPEDITION",
              locationId: expeditionId,
              resourceTypeId: resourceType.id,
              quantity: amount,
            },
          }),
        ]);
      } else {
        // Transfer from expedition to town
        const expeditionStock = await tx.resourceStock.findUnique({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType: "EXPEDITION",
              locationId: expeditionId,
              resourceTypeId: resourceType.id,
            },
          },
        });

        if (!expeditionStock || expeditionStock.quantity < amount) {
          throw new Error(`Not enough ${resourceTypeName} in expedition`);
        }

        await Promise.all([
          tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: expedition.townId,
                resourceTypeId: resourceType.id,
              },
            },
            update: {
              quantity: { increment: amount },
            },
            create: {
              locationType: "CITY",
              locationId: expedition.townId,
              resourceTypeId: resourceType.id,
              quantity: amount,
            },
          }),
          tx.resourceStock.update({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "EXPEDITION",
                locationId: expeditionId,
                resourceTypeId: resourceType.id,
              },
            },
            data: {
              quantity: { decrement: amount },
            },
          }),
        ]);
      }

      logger.info("expedition_event", {
        event: "resource_transferred",
        expeditionId,
        resourceTypeName,
        amount,
        direction,
      });
    });
  }
  async createExpedition(data: CreateExpeditionData): Promise<Expedition> {
    return await prisma.$transaction(async (tx) => {
      // Check if town exists
      const town = await tx.town.findUnique({
        where: { id: data.townId },
        select: { id: true, name: true },
      });

      if (!town) {
        throw new Error("Town not found");
      }

      if (data.duration < 1) {
        throw new Error("Expedition duration must be at least 1 day");
      }

      // Validate initial resources and check if town has enough
      for (const resource of data.initialResources) {
        if (resource.quantity <= 0) {
          throw new Error(
            `Resource quantity must be positive for ${resource.resourceTypeName}`
          );
        }

        const resourceType = await tx.resourceType.findFirst({
          where: { name: resource.resourceTypeName },
        });

        if (!resourceType) {
          throw new Error(
            `Resource type "${resource.resourceTypeName}" not found`
          );
        }

        // Check if town has enough of this resource
        const townStock = await tx.resourceStock.findUnique({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType: "CITY",
              locationId: data.townId,
              resourceTypeId: resourceType.id,
            },
          },
        });

        if (!townStock || townStock.quantity < resource.quantity) {
          throw new Error(`Not enough ${resource.resourceTypeName} in town`);
        }
      }

      // Create expedition
      const expedition = await tx.expedition.create({
        data: {
          name: data.name,
          townId: data.townId,
          duration: data.duration,
          createdBy: data.createdBy,
          status: ExpeditionStatus.PLANNING,
          returnAt: null,
        },
      });

      // Transfer resources from town to expedition
      for (const resource of data.initialResources) {
        const resourceType = await tx.resourceType.findFirst({
          where: { name: resource.resourceTypeName },
        });

        if (resourceType) {
          // Remove from town
          await tx.resourceStock.update({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: data.townId,
                resourceTypeId: resourceType.id,
              },
            },
            data: {
              quantity: { decrement: resource.quantity },
            },
          });

          // Add to expedition
          await tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "EXPEDITION",
                locationId: expedition.id,
                resourceTypeId: resourceType.id,
              },
            },
            update: {
              quantity: { increment: resource.quantity },
            },
            create: {
              locationType: "EXPEDITION",
              locationId: expedition.id,
              resourceTypeId: resourceType.id,
              quantity: resource.quantity,
            },
          });
        }
      }

      logger.info("expedition_event", {
        event: "created",
        expeditionId: expedition.id,
        expeditionName: expedition.name,
        townId: data.townId,
        initialResources: data.initialResources,
        createdBy: data.createdBy,
      });

      // Return a clean expedition object without circular references
      return {
        id: expedition.id,
        name: expedition.name,
        status: expedition.status,
        duration: expedition.duration,
        townId: expedition.townId,
        createdBy: expedition.createdBy,
        createdAt: expedition.createdAt,
        updatedAt: expedition.updatedAt,
        returnAt: expedition.returnAt,
      };
    });
  }

  async getExpeditionById(id: string): Promise<ExpeditionWithDetails | null> {
    const expedition = await prisma.expedition.findUnique({
      where: { id },
      include: {
        town: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            character: {
              include: {
                user: {
                  select: { id: true, discordId: true, username: true },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!expedition) return null;

    // Return a clean expedition object without circular references
    return {
      id: expedition.id,
      name: expedition.name,
      status: expedition.status,
      duration: expedition.duration,
      townId: expedition.townId,
      createdBy: expedition.createdBy,
      createdAt: expedition.createdAt,
      updatedAt: expedition.updatedAt,
      returnAt: expedition.returnAt,
      town: expedition.town,
      members: expedition.members,
      _count: expedition._count,
    };
  }

  async getExpeditionsByTown(
    townId: string,
    includeReturned: boolean = false
  ): Promise<ExpeditionWithDetails[]> {
    const whereClause: { townId: string; status?: { not?: ExpeditionStatus } } =
      { townId };
    if (!includeReturned) {
      whereClause.status = { not: ExpeditionStatus.RETURNED };
    }

    return await prisma.expedition.findMany({
      where: whereClause,
      include: {
        town: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            character: {
              include: {
                user: {
                  select: { id: true, discordId: true, username: true },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async joinExpedition(
    expeditionId: string,
    characterId: string
  ): Promise<ExpeditionMember> {
    return await prisma.$transaction(async (tx) => {
      // Check expedition exists and is in PLANNING status
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new Error(
          "Cannot join expedition that is not in PLANNING status"
        );
      }

      // Check if character is already a member
      const existingMember = await tx.expeditionMember.findFirst({
        where: {
          expeditionId,
          characterId,
        },
      });

      if (existingMember) {
        throw new Error("Character is already a member of this expedition");
      }

      // Check if character is already on another active expedition
      const activeExpedition = await tx.expeditionMember.findFirst({
        where: {
          characterId,
          expedition: {
            status: {
              in: [
                ExpeditionStatus.PLANNING,
                ExpeditionStatus.LOCKED,
                ExpeditionStatus.DEPARTED,
              ],
            },
          },
        },
        include: { expedition: true },
      });

      if (activeExpedition) {
        throw new Error(
          `Character is already on expedition: ${activeExpedition.expedition.name}`
        );
      }

      const member = await tx.expeditionMember.create({
        data: {
          expeditionId,
          characterId,
        },
        include: {
          character: {
            include: {
              user: {
                select: { id: true, discordId: true, username: true },
              },
            },
          },
        },
      });

      logger.info("expedition_event", {
        event: "character_joined",
        expeditionId,
        characterId,
        characterName: member.character.name,
        joinedBy: member.character.user.discordId,
      });

      return member;
    });
  }

  async leaveExpedition(
    expeditionId: string,
    characterId: string
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      // Check expedition exists and is in PLANNING status
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new Error(
          "Cannot leave expedition that is not in PLANNING status"
        );
      }

      // Check if character is a member
      const member = await tx.expeditionMember.findFirst({
        where: {
          expeditionId,
          characterId,
        },
        include: { character: true },
      });

      if (!member) {
        throw new Error("Character is not a member of this expedition");
      }

      // Remove member
      await tx.expeditionMember.delete({
        where: { id: member.id },
      });

      // If this was the last member and expedition is still PLANNING, terminate it
      const remainingMembers = await tx.expeditionMember.count({
        where: { expeditionId },
      });

      if (remainingMembers === 0) {
        await this.terminateExpedition(tx, expeditionId);
      }

      logger.info("expedition_event", {
        event: "character_left",
        expeditionId,
        characterId,
        characterName: member.character.name,
        terminated: remainingMembers === 0,
      });
    });
  }

  async lockExpedition(expeditionId: string): Promise<Expedition> {
    return await prisma.$transaction(async (tx) => {
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, name: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new Error("Can only lock expeditions in PLANNING status");
      }

      // Check if expedition has members
      const memberCount = await tx.expeditionMember.count({
        where: { expeditionId },
      });

      if (memberCount === 0) {
        throw new Error("Cannot lock expedition with no members");
      }

      const updatedExpedition = await tx.expedition.update({
        where: { id: expeditionId },
        data: { status: ExpeditionStatus.LOCKED },
      });

      logger.info("expedition_event", {
        event: "locked",
        expeditionId,
        expeditionName: expedition.name,
        memberCount,
      });

      return updatedExpedition;
    });
  }

  async departExpedition(expeditionId: string): Promise<Expedition> {
    return await prisma.$transaction(async (tx) => {
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, name: true, duration: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.LOCKED) {
        throw new Error("Can only depart expeditions in LOCKED status");
      }

      const returnAt = new Date();
      returnAt.setHours(returnAt.getHours() + expedition.duration * 24); // Convert days to hours

      const updatedExpedition = await tx.expedition.update({
        where: { id: expeditionId },
        data: {
          status: ExpeditionStatus.DEPARTED,
          returnAt,
        },
      });

      logger.info("expedition_event", {
        event: "departed",
        expeditionId,
        expeditionName: expedition.name,
        returnAt: returnAt.toISOString(),
      });

      return updatedExpedition;
    });
  }

  async returnExpedition(expeditionId: string): Promise<Expedition> {
    return await prisma.$transaction(async (tx) => {
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: {
          id: true,
          status: true,
          name: true,

          townId: true,
        },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new Error("Can only return expeditions in DEPARTED status");
      }

      // Return food to town and clear expedition food stock
      const town = await tx.town.findUnique({
        where: { id: expedition.townId },
        select: { id: true },
      });

      if (!town) {
        throw new Error("Town not found");
      }

      const [, updatedExpedition] = await Promise.all([
        // Town food stock is now handled via ResourceStock, so no update needed here
        Promise.resolve(),
        tx.expedition.update({
          where: { id: expeditionId },
          data: {
            status: ExpeditionStatus.RETURNED,
            returnAt: new Date(),
          },
        }),
      ]);

      logger.info("expedition_event", {
        event: "returned",
        expeditionId,
        expeditionName: expedition.name,
        foodReturned: 0,
        townFoodStock: 0,
      });

      return updatedExpedition;
    });
  }

  /**
   * Toggle emergency return vote for a user on an expedition
   * Returns the vote if created, null if removed
   */
  async toggleEmergencyVote(
    expeditionId: string,
    userId: string
  ): Promise<{ voted: boolean; totalVotes: number; membersCount: number; thresholdReached: boolean }> {
    return await prisma.$transaction(async (tx) => {
      // Vérifier que l'expédition existe et est DEPARTED
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        include: {
          members: true,
          emergencyVotes: true,
        },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new Error("Can only vote for emergency return on DEPARTED expeditions");
      }

      // Vérifier si l'utilisateur est membre de l'expédition
      const isMember = expedition.members.some(
        (member) => member.characterId && member.character // Will be loaded if needed
      );

      // Actually check userId properly via character relation
      const memberCharacters = await tx.character.findMany({
        where: {
          id: { in: expedition.members.map((m) => m.characterId) },
          userId,
        },
      });

      if (memberCharacters.length === 0) {
        throw new Error("User is not a member of this expedition");
      }

      // Check if vote already exists
      const existingVote = await tx.expeditionEmergencyVote.findUnique({
        where: {
          expedition_vote_unique: {
            expeditionId,
            userId,
          },
        },
      });

      let voted: boolean;

      if (existingVote) {
        // Remove vote (dévote)
        await tx.expeditionEmergencyVote.delete({
          where: { id: existingVote.id },
        });
        voted = false;
      } else {
        // Add vote
        await tx.expeditionEmergencyVote.create({
          data: {
            expeditionId,
            userId,
          },
        });
        voted = true;
      }

      // Get updated vote count
      const totalVotes = await tx.expeditionEmergencyVote.count({
        where: { expeditionId },
      });

      const membersCount = expedition.members.length;
      const threshold = Math.ceil(membersCount / 2); // 50% arrondi supérieur
      const thresholdReached = totalVotes >= threshold;

      // Update pendingEmergencyReturn flag if threshold reached
      if (thresholdReached && !expedition.pendingEmergencyReturn) {
        await tx.expedition.update({
          where: { id: expeditionId },
          data: { pendingEmergencyReturn: true },
        });

        logger.info("expedition_emergency_return_triggered", {
          expeditionId,
          totalVotes,
          membersCount,
          threshold,
        });
      } else if (!thresholdReached && expedition.pendingEmergencyReturn) {
        // Reset flag if below threshold
        await tx.expedition.update({
          where: { id: expeditionId },
          data: { pendingEmergencyReturn: false },
        });
      }

      return {
        voted,
        totalVotes,
        membersCount,
        thresholdReached,
      };
    });
  }

  /**
   * Force emergency return for all expeditions with pendingEmergencyReturn flag
   * Called by cron job
   */
  async forceEmergencyReturns(): Promise<number> {
    const expeditions = await prisma.expedition.findMany({
      where: {
        status: ExpeditionStatus.DEPARTED,
        pendingEmergencyReturn: true,
      },
      select: { id: true, name: true },
    });

    let returnedCount = 0;

    for (const expedition of expeditions) {
      try {
        await this.returnExpedition(expedition.id);

        // Clear votes after return
        await prisma.expeditionEmergencyVote.deleteMany({
          where: { expeditionId: expedition.id },
        });

        logger.info("expedition_emergency_return_executed", {
          expeditionId: expedition.id,
          expeditionName: expedition.name,
        });

        returnedCount++;
      } catch (error) {
        logger.error("Failed to force emergency return", {
          expeditionId: expedition.id,
          error,
        });
      }
    }

    return returnedCount;
  }

  async getActiveExpeditionsForCharacter(
    characterId: string
  ): Promise<ExpeditionWithDetails[]> {
    return await prisma.expedition.findMany({
      where: {
        members: {
          some: { characterId },
        },
        status: {
          in: [
            ExpeditionStatus.PLANNING,
            ExpeditionStatus.LOCKED,
            ExpeditionStatus.DEPARTED,
          ],
        },
      },
      include: {
        town: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            character: {
              include: {
                user: {
                  select: { id: true, discordId: true, username: true },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async getAllExpeditions(
    includeReturned: boolean = false
  ): Promise<ExpeditionWithDetails[]> {
    const whereClause: { status?: { not?: ExpeditionStatus } } = {};
    if (!includeReturned) {
      whereClause.status = { not: ExpeditionStatus.RETURNED };
    }

    return await prisma.expedition.findMany({
      where: whereClause,
      include: {
        town: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            character: {
              include: {
                user: {
                  select: { id: true, discordId: true, username: true },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addMemberToExpedition(
    expeditionId: string,
    characterId: string
  ): Promise<ExpeditionMember> {
    return await prisma.$transaction(async (tx) => {
      // Check if expedition exists and is in planning status
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, name: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new Error(
          "Can only add members to expeditions in PLANNING status"
        );
      }

      // Check if character exists
      const character = await tx.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is already in expedition
      const existingMember = await tx.expeditionMember.findUnique({
        where: {
          expedition_member_unique: {
            expeditionId,
            characterId,
          },
        },
      });

      if (existingMember) {
        throw new Error("Character is already in this expedition");
      }

      const member = await tx.expeditionMember.create({
        data: {
          expeditionId,
          characterId,
        },
      });

      logger.info("expedition_event", {
        event: "member_added",
        expeditionId,
        expeditionName: expedition.name,
        characterId,
        characterName: character.name,
      });

      return member;
    });
  }

  async terminateExpedition(
    tx: Prisma.TransactionClient,
    expeditionId: string
  ): Promise<void> {
    const expedition = await tx.expedition.findUnique({
      where: { id: expeditionId },
      select: { id: true, name: true, townId: true },
    });

    if (!expedition) {
      return; // Already terminated or doesn't exist
    }

    // Return all resources to town
    const expeditionResources = await tx.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        locationId: expeditionId,
      },
    });

    for (const resource of expeditionResources) {
      // Add to town
      await tx.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: expedition.townId,
            resourceTypeId: resource.resourceTypeId,
          },
        },
        update: {
          quantity: { increment: resource.quantity },
        },
        create: {
          locationType: "CITY",
          locationId: expedition.townId,
          resourceTypeId: resource.resourceTypeId,
          quantity: resource.quantity,
        },
      });
    }

    // Remove all expedition resources
    await tx.resourceStock.deleteMany({
      where: {
        locationType: "EXPEDITION",
        locationId: expeditionId,
      },
    });

    // Mark as returned and clear members
    await Promise.all([
      tx.expedition.update({
        where: { id: expeditionId },
        data: {
          status: ExpeditionStatus.RETURNED,
          returnAt: new Date(),
        },
      }),
      tx.expeditionMember.deleteMany({
        where: { expeditionId },
      }),
    ]);

    logger.info("expedition_event", {
      event: "terminated",
      expeditionId,
      expeditionName: expedition.name,
      resourcesReturned: expeditionResources.length,
    });
  }

  async removeMemberFromExpedition(
    expeditionId: string,
    characterId: string
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      // Check if expedition exists
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, name: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      // Check if member exists
      const member = await tx.expeditionMember.findUnique({
        where: {
          expedition_member_unique: {
            expeditionId,
            characterId,
          },
        },
      });

      if (!member) {
        throw new Error("Character is not a member of this expedition");
      }

      await tx.expeditionMember.delete({
        where: {
          expedition_member_unique: {
            expeditionId,
            characterId,
          },
        },
      });

      logger.info("expedition_event", {
        event: "member_removed",
        expeditionId,
        expeditionName: expedition.name,
        characterId,
      });
    });
  }
}
