import { PrismaClient, Prisma } from "@prisma/client";

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        characters: true
      }
    });
  }

  async findByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId },
      include: {
        characters: true
      }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      include: {
        characters: true
      }
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        characters: true
      }
    });
  }
}
