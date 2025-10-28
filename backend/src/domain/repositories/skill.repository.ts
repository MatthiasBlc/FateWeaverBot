import { PrismaClient } from "@prisma/client";

export class SkillRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.skill.findUnique({
      where: { id }
    });
  }

  async findAll() {
    return this.prisma.skill.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findByName(name: string) {
    return this.prisma.skill.findUnique({
      where: { name }
    });
  }
}
