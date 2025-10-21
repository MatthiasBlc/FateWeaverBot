import { PrismaClient, ChantierStatus, Prisma } from "@prisma/client";
import type { Chantier } from "@prisma/client";
import { logger } from "./logger";
import { dailyEventLogService } from "./daily-event-log.service";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ChantierRepository } from "../domain/repositories/chantier.repository";

const prisma = new PrismaClient();

export interface CreateChantierData {
  name: string;
  cost: number;
  townId: string;
  createdBy: string;
  completionText?: string;
  resourceCosts?: { resourceTypeId: number; quantity: number }[];
}

export interface ResourceContribution {
  resourceTypeId: number;
  quantity: number;
}

export class ChantierService {
  private chantierRepo: ChantierRepository;

  constructor(chantierRepo?: ChantierRepository) {
    this.chantierRepo = chantierRepo || new ChantierRepository(prisma);
  }
  /**
   * Create a new chantier with optional resource costs
   */
  async createChantier(data: CreateChantierData): Promise<Chantier> {
    return await prisma.$transaction(async (tx) => {
      // Check if town exists
      const town = await tx.town.findUnique({
        where: { id: data.townId },
        select: { id: true, name: true },
      });

      if (!town) {
        throw new Error("Town not found");
      }

      // Validate resource costs if provided
      if (data.resourceCosts && data.resourceCosts.length > 0) {
        for (const resourceCost of data.resourceCosts) {
          if (resourceCost.quantity <= 0) {
            throw new Error(
              `Resource quantity must be positive for resource type ID ${resourceCost.resourceTypeId}`
            );
          }

          // Check if resource type exists
          const resourceType = await tx.resourceType.findUnique({
            where: { id: resourceCost.resourceTypeId },
          });

          if (!resourceType) {
            throw new Error(
              `Resource type with ID ${resourceCost.resourceTypeId} not found`
            );
          }
        }
      }

      // Create chantier
      const chantier = await tx.chantier.create({
        data: {
          name: data.name,
          cost: data.cost,
          townId: data.townId,
          createdBy: data.createdBy,
          completionText: data.completionText,
          status: ChantierStatus.PLAN,
        },
      });

      // Create resource costs if provided
      if (data.resourceCosts && data.resourceCosts.length > 0) {
        await tx.chantierResourceCost.createMany({
          data: data.resourceCosts.map((rc) => ({
            chantierId: chantier.id,
            resourceTypeId: rc.resourceTypeId,
            quantityRequired: rc.quantity,
            quantityContributed: 0,
          })),
        });
      }

      logger.info("chantier_event", {
        event: "created",
        chantierId: chantier.id,
        chantierName: chantier.name,
        townId: data.townId,
        cost: data.cost,
        resourceCosts: data.resourceCosts || [],
        createdBy: data.createdBy,
      });

      return chantier;
    });
  }

  /**
   * Get chantiers by town with resource costs included
   */
  async getChantiersByTown(townId: string) {
    return await this.chantierRepo.findAllByTown(townId);
  }

  /**
   * Get a single chantier by ID with resource costs
   */
  async getChantierById(chantierId: string) {
    return await this.chantierRepo.findById(chantierId);
  }

  /**
   * Contribute resources to a chantier
   */
  async contributeResources(
    chantierId: string,
    characterId: string,
    contributions: ResourceContribution[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // Check chantier exists and is not completed
      const chantier = await tx.chantier.findUnique({
        where: { id: chantierId },
        include: {
          resourceCosts: true,
        },
      });

      if (!chantier) {
        throw new Error("Chantier not found");
      }

      if (chantier.status === ChantierStatus.COMPLETED) {
        throw new Error("This chantier is already completed");
      }

      // Check character exists and is not dead
      const character = await tx.character.findUnique({
        where: { id: characterId },
        include: {
          expeditionMembers: {
            include: {
              expedition: true,
            },
          },
        },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      if (character.isDead) {
        throw new Error("This character is dead");
      }

      // Block if character is in a DEPARTED expedition
      const inDepartedExpedition = character.expeditionMembers?.some(
        (em: any) => em.expedition.status === "DEPARTED"
      );

      if (inDepartedExpedition) {
        throw new Error("You are on expedition and cannot access city chantiers");
      }

      // Check character is in the same town as the chantier
      if (character.townId !== chantier.townId) {
        throw new Error("Character is not in the same town as this chantier");
      }

      // Validate contributions and check town has enough resources
      for (const contribution of contributions) {
        if (contribution.quantity <= 0) {
          throw new Error("Contribution quantity must be positive");
        }

        // Find the corresponding resource cost
        const resourceCost = chantier.resourceCosts.find(
          (rc) => rc.resourceTypeId === contribution.resourceTypeId
        );

        if (!resourceCost) {
          throw new Error(
            `This chantier does not require resource type ID ${contribution.resourceTypeId}`
          );
        }

        // Check if contribution would exceed required amount
        const remainingNeeded =
          resourceCost.quantityRequired - resourceCost.quantityContributed;
        if (contribution.quantity > remainingNeeded) {
          throw new Error(
            `Cannot contribute ${contribution.quantity} of resource type ID ${contribution.resourceTypeId}. Only ${remainingNeeded} needed.`
          );
        }

        // Check town stock
        const townStock = await tx.resourceStock.findUnique({
          where: ResourceQueries.stockWhere("CITY", chantier.townId, contribution.resourceTypeId),
        });

        if (!townStock || townStock.quantity < contribution.quantity) {
          const resourceType = await tx.resourceType.findUnique({
            where: { id: contribution.resourceTypeId },
          });
          throw new Error(
            `Not enough ${resourceType?.name || "resources"} in town stock`
          );
        }
      }

      // Deduct resources from town and update contributions
      for (const contribution of contributions) {
        // Deduct from town
        await tx.resourceStock.update({
          where: ResourceQueries.stockWhere("CITY", chantier.townId, contribution.resourceTypeId),
          data: {
            quantity: { decrement: contribution.quantity },
          },
        });

        // Update contribution
        await tx.chantierResourceCost.updateMany({
          where: {
            chantierId,
            resourceTypeId: contribution.resourceTypeId,
          },
          data: {
            quantityContributed: { increment: contribution.quantity },
          },
        });
      }

      // Check if chantier is now completed (both PA and all resources met)
      const updatedResourceCosts = await tx.chantierResourceCost.findMany({
        where: { chantierId },
      });

      const allResourcesComplete = updatedResourceCosts.every(
        (rc) => rc.quantityContributed >= rc.quantityRequired
      );
      const paComplete = chantier.spendOnIt >= chantier.cost;
      const isCompleted = allResourcesComplete && paComplete;

      // Update chantier status if completed
      if (isCompleted) {
        await tx.chantier.update({
          where: { id: chantierId },
          data: { status: ChantierStatus.COMPLETED },
        });

        // Log chantier completion
        await dailyEventLogService.logChantierCompleted(
          parseInt(chantierId),
          chantier.name,
          chantier.townId
        );
      }

      logger.info("chantier_event", {
        event: "resources_contributed",
        chantierId,
        chantierName: chantier.name,
        characterId,
        characterName: character.name,
        contributions,
        isCompleted,
      });

      // Return updated chantier with resource costs
      return await tx.chantier.findUnique({
        where: { id: chantierId },
        include: {
          resourceCosts: {
            ...ResourceQueries.withResourceType(),
          },
        },
      });
    });
  }
}

export const chantierService = new ChantierService();
