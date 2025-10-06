import { PrismaClient, ExpeditionStatus, Prisma } from "@prisma/client";
import type { Expedition, ExpeditionMember } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

export interface CreateExpeditionData {
  name: string;
  townId: string;
  foodStock: number;
  duration: number; // in days (minimum 1)
  createdBy: string; // Discord user ID
}

export interface ExpeditionWithDetails extends Expedition {
  town: {
    id: string;
    name: string;
    foodStock: number;
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
  async createExpedition(data: CreateExpeditionData): Promise<Expedition> {
    return await prisma.$transaction(async (tx) => {
      // Check if town has enough food
      const town = await tx.town.findUnique({
        where: { id: data.townId },
        select: { id: true, foodStock: true },
      });

      if (!town) {
        throw new Error("Town not found");
      }

      if (data.duration < 1) {
        throw new Error("Expedition duration must be at least 1 day");
      }

      // Create expedition and update town food stock in transaction
      const [expedition] = await Promise.all([
        tx.expedition.create({
          data: {
            name: data.name,
            townId: data.townId,
            foodStock: data.foodStock,
            duration: data.duration,
            createdBy: data.createdBy,
            status: ExpeditionStatus.PLANNING,
            returnAt: null,
          },
        }),
        tx.town.update({
          where: { id: data.townId },
          data: { foodStock: { decrement: data.foodStock } },
        }),
      ]);

      logger.info("expedition_event", {
        event: "created",
        expeditionId: expedition.id,
        expeditionName: expedition.name,
        townId: data.townId,
        foodStock: data.foodStock,
        createdBy: data.createdBy,
      });

      return expedition;
    });
  }

  async getExpeditionById(id: string): Promise<ExpeditionWithDetails | null> {
    return await prisma.expedition.findUnique({
      where: { id },
      include: {
        town: {
          select: { id: true, name: true, foodStock: true },
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
          select: { id: true, name: true, foodStock: true },
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
        select: { id: true, status: true, foodStock: true },
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

  async transferFood(
    expeditionId: string,
    amount: number,
    direction: "to_town" | "from_town"
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      // Check expedition exists and is in PLANNING status
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: { id: true, status: true, foodStock: true, townId: true },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.PLANNING) {
        throw new Error(
          "Cannot transfer food for expedition that is not in PLANNING status"
        );
      }

      const town = await tx.town.findUnique({
        where: { id: expedition.townId },
        select: { id: true, foodStock: true },
      });

      if (!town) {
        throw new Error("Town not found");
      }

      if (amount <= 0) {
        throw new Error("Transfer amount must be positive");
      }

      if (direction === "from_town") {
        // Transfer from town to expedition
        if (town.foodStock < amount) {
          throw new Error("Not enough food in town");
        }

        await Promise.all([
          tx.expedition.update({
            where: { id: expeditionId },
            data: { foodStock: { increment: amount } },
          }),
          tx.town.update({
            where: { id: expedition.townId },
            data: { foodStock: { decrement: amount } },
          }),
        ]);
      } else {
        // Transfer from expedition to town
        if (expedition.foodStock < amount) {
          throw new Error("Not enough food in expedition");
        }

        await Promise.all([
          tx.expedition.update({
            where: { id: expeditionId },
            data: { foodStock: { decrement: amount } },
          }),
          tx.town.update({
            where: { id: expedition.townId },
            data: { foodStock: { increment: amount } },
          }),
        ]);
      }

      logger.info("expedition_event", {
        event: "food_transferred",
        expeditionId,
        amount,
        direction,
        expeditionFoodStock:
          direction === "from_town"
            ? expedition.foodStock + amount
            : expedition.foodStock - amount,
        townFoodStock:
          direction === "from_town"
            ? town.foodStock - amount
            : town.foodStock + amount,
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
      returnAt.setHours(returnAt.getHours() + (expedition.duration * 24)); // Convert days to hours

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
          foodStock: true,
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
        select: { id: true, foodStock: true },
      });

      if (!town) {
        throw new Error("Town not found");
      }

      const [, updatedExpedition] = await Promise.all([
        tx.town.update({
          where: { id: expedition.townId },
          data: { foodStock: { increment: expedition.foodStock } },
        }),
        tx.expedition.update({
          where: { id: expeditionId },
          data: {
            status: ExpeditionStatus.RETURNED,
            foodStock: 0,
            returnAt: new Date(),
          },
        }),
      ]);

      logger.info("expedition_event", {
        event: "returned",
        expeditionId,
        expeditionName: expedition.name,
        foodReturned: expedition.foodStock,
        townFoodStock: town.foodStock + expedition.foodStock,
      });

      return updatedExpedition;
    });
  }

  async getActiveExpeditionsForCharacter(
    characterId: string
  ): Promise<ExpeditionWithDetails[]> {
    return await prisma.expedition.findMany({
      where: {
        members: {
          some: { characterId },
        },
        status: { in: [ExpeditionStatus.PLANNING, ExpeditionStatus.LOCKED, ExpeditionStatus.DEPARTED] },
      },
      include: {
        town: {
          select: { id: true, name: true, foodStock: true },
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
          select: { id: true, name: true, foodStock: true },
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

  async addMemberToExpedition(expeditionId: string, characterId: string): Promise<ExpeditionMember> {
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
        throw new Error("Can only add members to expeditions in PLANNING status");
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
      select: { id: true, name: true, foodStock: true, townId: true },
    });

    if (!expedition) {
      return; // Already terminated or doesn't exist
    }

    // Return food to town
    if (expedition.foodStock > 0) {
      await tx.town.update({
        where: { id: expedition.townId },
        data: { foodStock: { increment: expedition.foodStock } },
      });
    }

    // Mark as returned and clear members
    await Promise.all([
      tx.expedition.update({
        where: { id: expeditionId },
        data: {
          status: ExpeditionStatus.RETURNED,
          foodStock: 0,
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
      foodReturned: expedition.foodStock,
    });
  }

  async removeMemberFromExpedition(expeditionId: string, characterId: string): Promise<void> {
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
