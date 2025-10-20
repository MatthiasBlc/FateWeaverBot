import { PrismaClient, Prisma, ExpeditionStatus } from "@prisma/client";
import { ExpeditionQueries } from "../../infrastructure/database/query-builders/expedition.queries";

export class ExpeditionRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.expedition.findUnique({
      where: { id },
      ...ExpeditionQueries.fullInclude()
    });
  }

  async findAllByTown(townId: string) {
    return this.prisma.expedition.findMany({
      where: { townId },
      ...ExpeditionQueries.fullInclude(),
      orderBy: { createdAt: "desc" }
    });
  }

  async findActive(townId: string) {
    return this.prisma.expedition.findMany({
      where: {
        townId,
        status: ExpeditionStatus.DEPARTED
      },
      ...ExpeditionQueries.fullInclude()
    });
  }

  async findPending(townId: string) {
    return this.prisma.expedition.findMany({
      where: {
        townId,
        status: ExpeditionStatus.PLANNING
      },
      ...ExpeditionQueries.fullInclude()
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.ExpeditionCreateInput) {
    return this.prisma.expedition.create({
      data,
      ...ExpeditionQueries.fullInclude()
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.ExpeditionUpdateInput) {
    return this.prisma.expedition.update({
      where: { id },
      data,
      ...ExpeditionQueries.fullInclude()
    });
  }

  async updateStatus(id: string, status: ExpeditionStatus) {
    return this.prisma.expedition.update({
      where: { id },
      data: { status },
      ...ExpeditionQueries.fullInclude()
    });
  }

  // =====================
  // MEMBERS METHODS
  // =====================

  async addMember(expeditionId: string, characterId: string) {
    return this.prisma.expeditionMember.create({
      data: {
        expeditionId,
        characterId
      },
      include: {
        character: {
          include: { user: true }
        },
        expedition: ExpeditionQueries.fullInclude()
      }
    });
  }

  async removeMember(expeditionId: string, characterId: string) {
    const member = await this.prisma.expeditionMember.findFirst({
      where: { expeditionId, characterId }
    });

    if (!member) {
      throw new Error(`Expedition member not found for expedition ${expeditionId} and character ${characterId}`);
    }

    return this.prisma.expeditionMember.delete({
      where: { id: member.id }
    });
  }

  async getMembers(expeditionId: string) {
    return this.prisma.expeditionMember.findMany({
      where: { expeditionId },
      include: {
        character: {
          include: { user: true }
        }
      }
    });
  }

  // =====================
  // VOTE METHODS
  // =====================

  async addVote(expeditionId: string, userId: string) {
    return this.prisma.expeditionEmergencyVote.create({
      data: {
        expeditionId,
        userId
      }
    });
  }

  async getVotes(expeditionId: string) {
    return this.prisma.expeditionEmergencyVote.findMany({
      where: { expeditionId }
    });
  }
}
