import { PrismaClient } from "@prisma/client";

export class JobRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: number) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        startingAbility: true,
        optionalAbility: true
      }
    });
  }

  async findAll() {
    return this.prisma.job.findMany({
      include: {
        startingAbility: true,
        optionalAbility: true
      },
      orderBy: { name: "asc" }
    });
  }

  async findByName(name: string) {
    return this.prisma.job.findUnique({
      where: { name },
      include: {
        startingAbility: true,
        optionalAbility: true
      }
    });
  }
}
