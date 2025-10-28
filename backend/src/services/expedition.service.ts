import { PrismaClient, ExpeditionStatus, Prisma, Direction } from "@prisma/client";
import type { Expedition, ExpeditionMember } from "@prisma/client";
import { logger } from "./logger";
import { dailyEventLogService } from "./daily-event-log.service";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils } from "../shared/utils";
import { ExpeditionRepository } from "../domain/repositories/expedition.repository";
import { ResourceRepository } from "../domain/repositories/resource.repository";
import { NotFoundError, BadRequestError, ValidationError } from "../shared/errors";

const prisma = new PrismaClient();

export interface CreateExpeditionData {
  name: string;
  townId: string;
  initialResources: { resourceTypeName: string; quantity: number }[]; // Remplacement de foodStock par ressources génériques
  duration: number; // in days (minimum 1)
  createdBy: string; // Discord user ID
  initialDirection?: string; // "NORD", "SUD_EST", etc.
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
  initialDirection: Direction | null;
  path: Direction[];
  currentDayDirection: Direction | null;
  directionSetBy: string | null;
  directionSetAt: Date | null;
}

export class ExpeditionService {
  private expeditionRepo: ExpeditionRepository;
  private resourceRepo: ResourceRepository;

  constructor(
    expeditionRepo?: ExpeditionRepository,
    resourceRepo?: ResourceRepository
  ) {
    // For backward compatibility, create new repositories if not provided
    this.expeditionRepo = expeditionRepo || new ExpeditionRepository(prisma);
    this.resourceRepo = resourceRepo || new ResourceRepository(prisma);
  }
  /**
   * Récupère les ressources d'une expédition
   */
  async getExpeditionResources(expeditionId: string) {
    return await this.resourceRepo.getLocationResources("EXPEDITION", expeditionId);
  }

  /**
   * Ajoute des ressources à une expédition
   */
  async addResourceToExpedition(
    expeditionId: string,
    resourceTypeName: string,
    quantity: number
  ): Promise<void> {
    const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

    await ResourceUtils.upsertStock("EXPEDITION", expeditionId, resourceType.id, quantity);
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new BadRequestError(
          "Cannot transfer resources for expedition that is not in PLANNING status"
        );
      }

      if (amount <= 0) {
        throw new ValidationError("Transfer amount must be positive");
      }

      const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

      if (direction === "from_town") {
        // Transfer from town to expedition
        const townStock = await tx.resourceStock.findUnique({
          where: ResourceQueries.stockWhere("CITY", expedition.townId, resourceType.id),
        });

        if (!townStock || townStock.quantity < amount) {
          throw new BadRequestError(`Not enough ${resourceTypeName} in town`);
        }

        await Promise.all([
          tx.resourceStock.update({
            where: ResourceQueries.stockWhere("CITY", expedition.townId, resourceType.id),
            data: {
              quantity: { decrement: amount },
            },
          }),
          tx.resourceStock.upsert({
            where: ResourceQueries.stockWhere("EXPEDITION", expeditionId, resourceType.id),
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
          where: ResourceQueries.stockWhere("EXPEDITION", expeditionId, resourceType.id),
        });

        if (!expeditionStock || expeditionStock.quantity < amount) {
          throw new BadRequestError(`Not enough ${resourceTypeName} in expedition`);
        }

        await Promise.all([
          tx.resourceStock.upsert({
            where: ResourceQueries.stockWhere("CITY", expedition.townId, resourceType.id),
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
            where: ResourceQueries.stockWhere("EXPEDITION", expeditionId, resourceType.id),
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
        throw new NotFoundError('Town', data.townId);
      }

      if (data.duration < 1) {
        throw new ValidationError("Expedition duration must be at least 1 day");
      }

      // Track resource adjustments
      const adjustments: Array<{
        name: string;
        requested: number;
        actual: number;
        reason: string;
      }> = [];

      // Validate initial resources (positive quantities only)
      for (const resource of data.initialResources) {
        if (resource.quantity <= 0) {
          throw new ValidationError(
            `Resource quantity must be positive for ${resource.resourceTypeName}`
          );
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
          initialDirection: (data.initialDirection as Direction) || "UNKNOWN",
        },
      });

      // Transfer resources from town to expedition (with automatic adjustment)
      for (const resource of data.initialResources) {
        const resourceType = await tx.resourceType.findFirst({
          where: { name: resource.resourceTypeName },
        });

        if (!resourceType) {
          logger.warn(`Resource type not found: ${resource.resourceTypeName}`);
          continue;
        }

        // Check available stock in town
        const townStock = await tx.resourceStock.findUnique({
          where: ResourceQueries.stockWhere("CITY", data.townId, resourceType.id),
        });

        const availableQuantity = townStock?.quantity || 0;
        const requestedQuantity = resource.quantity;

        // Calculate actual quantity to transfer (min of requested and available)
        const actualQuantity = Math.min(requestedQuantity, availableQuantity);

        if (actualQuantity === 0) {
          // No resource available, skip
          adjustments.push({
            name: resource.resourceTypeName,
            requested: requestedQuantity,
            actual: 0,
            reason: "stock épuisé",
          });
          continue;
        }

        if (actualQuantity < requestedQuantity) {
          // Partial transfer
          adjustments.push({
            name: resource.resourceTypeName,
            requested: requestedQuantity,
            actual: actualQuantity,
            reason: "stock insuffisant",
          });
        }

        // Remove from town
        await tx.resourceStock.update({
          where: ResourceQueries.stockWhere("CITY", data.townId, resourceType.id),
          data: {
            quantity: { decrement: actualQuantity },
          },
        });

        // Add to expedition
        await tx.resourceStock.upsert({
          where: ResourceQueries.stockWhere("EXPEDITION", expedition.id, resourceType.id),
          update: {
            quantity: { increment: actualQuantity },
          },
          create: {
            locationType: "EXPEDITION",
            locationId: expedition.id,
            resourceTypeId: resourceType.id,
            quantity: actualQuantity,
          },
        });
      }

      // Log adjustments if any
      if (adjustments.length > 0) {
        logger.warn("expedition_resource_adjustments", {
          expeditionId: expedition.id,
          adjustments,
        });
      }

      logger.info("expedition_event", {
        event: "created",
        expeditionId: expedition.id,
        expeditionName: expedition.name,
        townId: data.townId,
        initialResources: data.initialResources,
        createdBy: data.createdBy,
      });

      // Return a clean expedition object without circular references + adjustments
      return {
        id: expedition.id,
        name: expedition.name,
        status: expedition.status,
        duration: expedition.duration,
        townId: expedition.townId,
        createdBy: expedition.createdBy,
        pendingEmergencyReturn: expedition.pendingEmergencyReturn,
        createdAt: expedition.createdAt,
        updatedAt: expedition.updatedAt,
        returnAt: expedition.returnAt,
        initialDirection: expedition.initialDirection,
        path: expedition.path,
        currentDayDirection: expedition.currentDayDirection,
        directionSetBy: expedition.directionSetBy,
        directionSetAt: expedition.directionSetAt,
        resourceAdjustments: adjustments, // Include adjustments for client notification
      } as any;
    });
  }

  async getExpeditionById(id: string): Promise<ExpeditionWithDetails | null> {
    const expedition = await this.expeditionRepo.findById(id);

    if (!expedition) return null;

    // Return a clean expedition object without circular references
    return {
      id: expedition.id,
      name: expedition.name,
      status: expedition.status,
      duration: expedition.duration,
      townId: expedition.townId,
      createdBy: expedition.createdBy,
      pendingEmergencyReturn: expedition.pendingEmergencyReturn,
      createdAt: expedition.createdAt,
      updatedAt: expedition.updatedAt,
      returnAt: expedition.returnAt,
      initialDirection: expedition.initialDirection,
      path: expedition.path,
      currentDayDirection: expedition.currentDayDirection,
      directionSetBy: expedition.directionSetBy,
      directionSetAt: expedition.directionSetAt,
      town: expedition.town,
      members: expedition.members,
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new BadRequestError(
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
        throw new BadRequestError("Character is already a member of this expedition");
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
        throw new BadRequestError(
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new BadRequestError(
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
        throw new BadRequestError("Character is not a member of this expedition");
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new BadRequestError("Can only lock expeditions in PLANNING status");
      }

      // Check if expedition has members
      const memberCount = await tx.expeditionMember.count({
        where: { expeditionId },
      });

      if (memberCount === 0) {
        throw new BadRequestError("Cannot lock expedition with no members");
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
        select: { id: true, status: true, name: true, duration: true, townId: true },
      });

      if (!expedition) {
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.LOCKED) {
        throw new BadRequestError("Can only depart expeditions in LOCKED status");
      }

      // Calculate returnAt normalized to 08:00:00 (no minutes/seconds/ms)
      const returnAt = new Date();
      returnAt.setHours(returnAt.getHours() + expedition.duration * 24, 0, 0, 0); // Convert days to hours, reset min/sec/ms

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

      // Log expedition departure
      const memberCount = await tx.expeditionMember.count({
        where: { expeditionId },
      });

      await dailyEventLogService.logExpeditionDeparted(
        expeditionId,
        expedition.name,
        expedition.townId,
        memberCount,
        expedition.duration
      );

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
        throw new NotFoundError('Expedition', expeditionId);
      }

      // Allow return for LOCKED (before departure) and DEPARTED (during expedition)
      // LOCKED return = cancellation before departure (admin emergency)
      // DEPARTED return = normal return or emergency return
      if (expedition.status !== ExpeditionStatus.DEPARTED && expedition.status !== ExpeditionStatus.LOCKED) {
        throw new BadRequestError("Can only return expeditions in LOCKED or DEPARTED status");
      }

      // Get expedition resources BEFORE transferring
      const expeditionResources = await tx.resourceStock.findMany({
        where: {
          locationType: "EXPEDITION",
          locationId: expeditionId,
        },
        ...ResourceQueries.withResourceType(),
      });

      // Transfer all expedition resources back to town
      for (const resource of expeditionResources) {
        // Add to town stock (or create if doesn't exist)
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

        // Delete from expedition
        await tx.resourceStock.delete({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType: "EXPEDITION",
              locationId: expeditionId,
              resourceTypeId: resource.resourceTypeId,
            },
          },
        });
      }

      // Get expedition members to remove them
      const expeditionMembers = await tx.expeditionMember.findMany({
        where: { expeditionId },
        select: { characterId: true },
      });

      // Remove all members from expedition
      await tx.expeditionMember.deleteMany({
        where: { expeditionId },
      });

      // Update expedition status
      const updatedExpedition = await tx.expedition.update({
        where: { id: expeditionId },
        data: {
          status: ExpeditionStatus.RETURNED,
          returnAt: new Date(),
        },
      });

      const resourcesSummary = expeditionResources.map(r => ({
        resourceName: r.resourceType.name,
        quantity: r.quantity,
      }));

      // Log expedition return (or cancellation if LOCKED)
      const eventType = expedition.status === ExpeditionStatus.LOCKED ? "cancelled" : "returned";
      await dailyEventLogService.logExpeditionReturned(
        expeditionId,
        expedition.name,
        expedition.townId,
        resourcesSummary
      );

      logger.info("expedition_event", {
        event: eventType,
        expeditionId,
        expeditionName: expedition.name,
        originalStatus: expedition.status,
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new BadRequestError("Can only vote for emergency return on DEPARTED expeditions");
      }

      // Check userId properly via character relation
      // userId is the Discord ID, need to check via user.discordId
      const memberCharacters = await tx.character.findMany({
        where: {
          id: { in: expedition.members.map((m) => m.characterId) },
          user: {
            discordId: userId,
          },
        },
      });

      if (memberCharacters.length === 0) {
        throw new BadRequestError("User is not a member of this expedition");
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
   * Vérifie si un utilisateur a voté pour le retour d'urgence
   */
  async hasUserVotedForEmergency(
    expeditionId: string,
    userId: string
  ): Promise<boolean> {
    const vote = await prisma.expeditionEmergencyVote.findUnique({
      where: {
        expedition_vote_unique: {
          expeditionId,
          userId,
        },
      },
    });

    return !!vote;
  }

  /**
   * Retourne une expédition avec pertes de ressources (pour retours d'urgence)
   * Pour chaque type de ressource, perd un montant aléatoire entre 0 et la moitié (arrondie supérieure)
   */
  async returnExpeditionWithLosses(expeditionId: string): Promise<{
    expedition: Expedition;
    lostResources: Array<{ resourceName: string; lost: number; remaining: number }>;
    returnedResources: Array<{ resourceName: string; quantity: number }>;
  }> {
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new BadRequestError("Can only emergency return expeditions in DEPARTED status");
      }

      // Get expedition resources BEFORE processing losses
      const expeditionResources = await tx.resourceStock.findMany({
        where: {
          locationType: "EXPEDITION",
          locationId: expeditionId,
        },
        ...ResourceQueries.withResourceType(),
      });

      const lostResources: Array<{ resourceName: string; lost: number; remaining: number }> = [];
      const returnedResources: Array<{ resourceName: string; quantity: number }> = [];

      // Process each resource with random losses
      for (const resource of expeditionResources) {
        const originalQuantity = resource.quantity;

        // Calculate maximum loss (half of quantity, rounded up)
        const maxLoss = Math.ceil(originalQuantity / 2);

        // Random loss between 0 and maxLoss (inclusive)
        const lostQuantity = Math.floor(Math.random() * (maxLoss + 1));

        // Calculate remaining quantity
        const remainingQuantity = originalQuantity - lostQuantity;

        lostResources.push({
          resourceName: resource.resourceType.name,
          lost: lostQuantity,
          remaining: remainingQuantity,
        });

        if (remainingQuantity > 0) {
          // Add remaining resources to town stock
          await tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: expedition.townId,
                resourceTypeId: resource.resourceTypeId,
              },
            },
            update: {
              quantity: { increment: remainingQuantity },
            },
            create: {
              locationType: "CITY",
              locationId: expedition.townId,
              resourceTypeId: resource.resourceTypeId,
              quantity: remainingQuantity,
            },
          });

          returnedResources.push({
            resourceName: resource.resourceType.name,
            quantity: remainingQuantity,
          });
        }

        // Delete from expedition
        await tx.resourceStock.delete({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType: "EXPEDITION",
              locationId: expeditionId,
              resourceTypeId: resource.resourceTypeId,
            },
          },
        });

        logger.info(`Emergency return resource loss: ${resource.resourceType.name}`, {
          expeditionId,
          expeditionName: expedition.name,
          original: originalQuantity,
          lost: lostQuantity,
          remaining: remainingQuantity,
        });
      }

      // Remove all members from expedition
      await tx.expeditionMember.deleteMany({
        where: { expeditionId },
      });

      // Update expedition status
      const updatedExpedition = await tx.expedition.update({
        where: { id: expeditionId },
        data: {
          status: ExpeditionStatus.RETURNED,
          returnAt: new Date(),
        },
      });

      return {
        expedition: updatedExpedition,
        lostResources,
        returnedResources,
      };
    });
  }

  /**
   * Force emergency return for all expeditions with pendingEmergencyReturn flag
   * Called by cron job
   * Emergency returns incur random resource losses (0 to half of each resource type)
   */
  async forceEmergencyReturns(): Promise<number> {
    const expeditions = await prisma.expedition.findMany({
      where: {
        status: ExpeditionStatus.DEPARTED,
        pendingEmergencyReturn: true,
      },
      include: {
        members: {
          include: {
            character: {
              select: {
                isDead: true
              }
            }
          }
        }
      }
    });

    let returnedCount = 0;
    let blockedCount = 0;

    for (const expedition of expeditions) {
      try {
        // Skip expeditions with no members - they are abandoned and cannot return
        if (!expedition.members || expedition.members.length === 0) {
          logger.warn(`Emergency return blocked for expedition ${expedition.id} (${expedition.name}) - no members`);
          blockedCount++;
          continue;
        }

        // Skip expeditions where ALL members are dead
        const allMembersDead = expedition.members.every(member => member.character?.isDead === true);
        if (allMembersDead) {
          logger.warn(`Emergency return blocked for expedition ${expedition.id} (${expedition.name}) - all members dead`);
          blockedCount++;
          continue;
        }

        // Use emergency return with resource losses
        const result = await this.returnExpeditionWithLosses(expedition.id);

        // Clear votes after return
        await prisma.expeditionEmergencyVote.deleteMany({
          where: { expeditionId: expedition.id },
        });

        // Log emergency return with resource loss details
        await dailyEventLogService.logExpeditionEmergencyReturn(
          expedition.id,
          expedition.name,
          result.expedition.townId
        );

        // Log detailed resource losses
        if (result.lostResources.length > 0) {
          logger.info("expedition_emergency_return_losses", {
            expeditionId: expedition.id,
            expeditionName: expedition.name,
            losses: result.lostResources,
          });
        }

        logger.info("expedition_emergency_return_executed", {
          expeditionId: expedition.id,
          expeditionName: expedition.name,
          totalLostResources: result.lostResources.length,
          totalReturnedResources: result.returnedResources.length,
        });

        returnedCount++;
      } catch (error) {
        logger.error("Failed to force emergency return", {
          expeditionId: expedition.id,
          error,
        });
      }
    }

    if (blockedCount > 0) {
      logger.warn(`Blocked ${blockedCount} expeditions from emergency return (no members)`);
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
          select: {
            members: true,
            emergencyVotes: true,
          },
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
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new BadRequestError(
          "Can only add members to expeditions in PLANNING status"
        );
      }

      // Check if character exists
      const character = await tx.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true },
      });

      if (!character) {
        throw new NotFoundError('Character', characterId);
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
        throw new BadRequestError("Character is already in this expedition");
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
        where: ResourceQueries.stockWhere("CITY", expedition.townId, resource.resourceTypeId),
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
        throw new NotFoundError('Expedition', expeditionId);
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
        throw new BadRequestError("Character is not a member of this expedition");
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

  /**
   * Remove a member before departure (during lock phase)
   * Used when a character is too weak to depart
   */
  async removeMemberBeforeDeparture(
    expeditionId: string,
    characterId: string,
    reason: string
  ): Promise<{ characterName: string; townId: string }> {
    return await prisma.$transaction(async (tx) => {
      // Check if expedition exists and is PLANNING
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, name: true, townId: true },
      });

      if (!expedition) {
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new BadRequestError("Can only remove members before departure from PLANNING expeditions");
      }

      // Check if character is a member
      const member = await tx.expeditionMember.findFirst({
        where: {
          expeditionId,
          characterId,
        },
        include: {
          character: {
            select: { id: true, name: true, userId: true },
          },
        },
      });

      if (!member) {
        throw new BadRequestError("Character is not a member of this expedition");
      }

      // Remove member from expedition (no PA penalty before departure)
      await tx.expeditionMember.delete({
        where: { id: member.id },
      });

      // Log that character cannot depart
      await dailyEventLogService.logCharacterCannotDepart(
        characterId,
        member.character.name,
        expedition.townId,
        reason
      );

      logger.info("character_cannot_depart", {
        expeditionId,
        expeditionName: expedition.name,
        characterId,
        characterName: member.character.name,
        reason,
      });

      return {
        characterName: member.character.name,
        townId: expedition.townId,
      };
    });
  }

  async removeMemberCatastrophic(
    expeditionId: string,
    characterId: string
  ): Promise<{ characterName: string; townId: string }> {
    return await prisma.$transaction(async (tx) => {
      // Check if expedition exists and is DEPARTED
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, name: true, townId: true },
      });

      if (!expedition) {
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new BadRequestError("Can only remove members from DEPARTED expeditions");
      }

      // Check if character is a member
      const member = await tx.expeditionMember.findFirst({
        where: {
          expeditionId,
          characterId,
        },
        include: {
          character: {
            select: { id: true, name: true, userId: true },
          },
        },
      });

      if (!member) {
        throw new BadRequestError("Character is not a member of this expedition");
      }

      // Remove member from expedition
      await tx.expeditionMember.delete({
        where: { id: member.id },
      });

      // Log the catastrophic return
      await dailyEventLogService.logCharacterCatastrophicReturn(
        characterId,
        member.character.name,
        expedition.townId
      );

      logger.info("expedition_catastrophic_return", {
        expeditionId,
        expeditionName: expedition.name,
        characterId,
        characterName: member.character.name,
      });

      return {
        characterName: member.character.name,
        townId: expedition.townId,
      };
    });
  }

  async setNextDirection(
    expeditionId: string,
    direction: string,
    characterId: string
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: {
          id: true,
          status: true,
          currentDayDirection: true,
          townId: true
        },
      });

      if (!expedition) {
        throw new NotFoundError('Expedition', expeditionId);
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new BadRequestError("Can only set direction for DEPARTED expeditions");
      }

      if (expedition.currentDayDirection) {
        throw new BadRequestError("Direction already set for today");
      }

      // Verify character is member of expedition
      const member = await tx.expeditionMember.findFirst({
        where: {
          expeditionId,
          characterId,
        },
      });

      if (!member) {
        throw new BadRequestError("Character is not a member of this expedition");
      }

      // Set direction
      await tx.expedition.update({
        where: { id: expeditionId },
        data: {
          currentDayDirection: direction as Direction,
          directionSetBy: characterId,
          directionSetAt: new Date(),
        },
      });

      logger.info("expedition_event", {
        event: "direction_set",
        expeditionId,
        direction,
        setBy: characterId,
      });
    });
  }

  /**
   * Set or update expedition dedicated channel
   */
  async setExpeditionChannel(
    expeditionId: string,
    channelId: string | null,
    configuredBy: string
  ): Promise<Expedition> {
    return await prisma.expedition.update({
      where: { id: expeditionId },
      data: {
        expeditionChannelId: channelId,
        channelConfiguredAt: channelId ? new Date() : null,
        channelConfiguredBy: channelId ? configuredBy : null,
      },
      include: {
        town: true,
        members: {
          include: {
            character: true,
          },
        },
      },
    });
  }

  /**
   * Get expedition channel ID (if configured and expedition is DEPARTED)
   */
  async getExpeditionChannelId(expeditionId: string): Promise<string | null> {
    const expedition = await prisma.expedition.findUnique({
      where: { id: expeditionId },
      select: {
        status: true,
        expeditionChannelId: true,
      },
    });

    // Only return channel if expedition is DEPARTED and channel is configured
    if (expedition?.status === ExpeditionStatus.DEPARTED && expedition.expeditionChannelId) {
      return expedition.expeditionChannelId;
    }

    return null;
  }
}
