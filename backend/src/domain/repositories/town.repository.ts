import { PrismaClient, Prisma } from "@prisma/client";

export class TownRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.town.findUnique({
      where: { id },
      include: {
        guild: true
      }
    });
  }

  async findAll() {
    return this.prisma.town.findMany({
      include: {
        guild: true
      },
      orderBy: { name: "asc" }
    });
  }

  async findByGuild(guildId: string) {
    return this.prisma.town.findMany({
      where: { guildId },
      include: {
        guild: true
      },
      orderBy: { name: "asc" }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.TownCreateInput) {
    return this.prisma.town.create({
      data,
      include: {
        guild: true
      }
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.TownUpdateInput) {
    return this.prisma.town.update({
      where: { id },
      data,
      include: {
        guild: true
      }
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.town.delete({
      where: { id }
    });
  }
}
