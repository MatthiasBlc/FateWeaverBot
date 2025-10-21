import { PrismaClient, Prisma } from "@prisma/client";

export class SeasonRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: number) {
    return this.prisma.season.findUnique({
      where: { id }
    });
  }

  async getCurrent() {
    return this.prisma.season.findFirst();
  }

  async getAll() {
    return this.prisma.season.findMany({
      orderBy: { updatedAt: "desc" }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.SeasonCreateInput) {
    return this.prisma.season.create({
      data
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: number, data: Prisma.SeasonUpdateInput) {
    return this.prisma.season.update({
      where: { id },
      data
    });
  }
}
