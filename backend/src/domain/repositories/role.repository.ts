import { PrismaClient, Prisma } from "@prisma/client";

export class RoleRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id }
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findByDiscordId(discordId: string, guildId: string) {
    return this.prisma.role.findUnique({
      where: {
        role_guild_unique: {
          discordId,
          guildId
        }
      }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.RoleCreateInput) {
    return this.prisma.role.create({
      data
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.RoleUpdateInput) {
    return this.prisma.role.update({
      where: { id },
      data
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.role.delete({
      where: { id }
    });
  }
}
