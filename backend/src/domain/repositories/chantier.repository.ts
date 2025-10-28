import { PrismaClient, Prisma } from "@prisma/client";
import { ChantierQueries } from "../../infrastructure/database/query-builders/chantier.queries";

export class ChantierRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.chantier.findUnique({
      where: { id },
      ...ChantierQueries.fullInclude()
    });
  }

  async findAllByTown(townId: string) {
    return this.prisma.chantier.findMany({
      where: { townId },
      ...ChantierQueries.fullInclude(),
      orderBy: { createdAt: "desc" }
    });
  }

  async findActive(townId: string) {
    return this.prisma.chantier.findMany({
      where: {
        townId,
        status: "IN_PROGRESS"
      },
      ...ChantierQueries.fullInclude(),
      orderBy: { createdAt: "desc" }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.ChantierCreateInput) {
    return this.prisma.chantier.create({
      data,
      ...ChantierQueries.fullInclude()
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.ChantierUpdateInput) {
    return this.prisma.chantier.update({
      where: { id },
      data,
      ...ChantierQueries.fullInclude()
    });
  }

  async updateProgress(id: string, progressIncrement: number) {
    return this.prisma.chantier.update({
      where: { id },
      data: {
        spendOnIt: { increment: progressIncrement }
      },
      ...ChantierQueries.fullInclude()
    });
  }

  async complete(id: string) {
    return this.prisma.chantier.update({
      where: { id },
      data: {
        status: "COMPLETED"
      },
      ...ChantierQueries.fullInclude()
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.chantier.delete({
      where: { id }
    });
  }
}
