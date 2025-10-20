import { PrismaClient, Prisma } from "@prisma/client";

export class GuildRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.guild.findUnique({
      where: { id },
      include: {
        town: true
      }
    });
  }

  async findAll() {
    return this.prisma.guild.findMany({
      include: {
        town: true
      },
      orderBy: { name: "asc" }
    });
  }

  async findByTown(townId: string) {
    return this.prisma.guild.findFirst({
      where: {
        town: {
          id: townId
        }
      },
      include: {
        town: true
      }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.GuildCreateInput) {
    return this.prisma.guild.create({
      data,
      include: {
        town: true
      }
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.GuildUpdateInput) {
    return this.prisma.guild.update({
      where: { id },
      data,
      include: {
        town: true
      }
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.guild.delete({
      where: { id }
    });
  }
}
