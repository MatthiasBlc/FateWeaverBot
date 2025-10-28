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

  // =====================
  // CREATE/UPDATE METHODS
  // =====================

  async create(data: {
    name: string;
    description?: string;
    startingAbilityId: string;
    optionalAbilityId?: string | null;
  }) {
    return this.prisma.job.create({
      data,
      include: {
        startingAbility: true,
        optionalAbility: true
      }
    });
  }

  async update(id: number, data: {
    name?: string;
    description?: string;
    startingAbilityId?: string;
    optionalAbilityId?: string | null;
  }) {
    return this.prisma.job.update({
      where: { id },
      data,
      include: {
        startingAbility: true,
        optionalAbility: true
      }
    });
  }

  // =====================
  // CAPABILITY METHODS
  // =====================

  async findCapability(capabilityId: string) {
    return this.prisma.capability.findUnique({
      where: { id: capabilityId }
    });
  }
}
