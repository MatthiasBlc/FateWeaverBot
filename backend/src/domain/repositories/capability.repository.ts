import { PrismaClient, Prisma } from "@prisma/client";

export class CapabilityRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.capability.findUnique({
      where: { id }
    });
  }

  async findAll() {
    return this.prisma.capability.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findByName(name: string) {
    return this.prisma.capability.findUnique({
      where: { name }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.CapabilityCreateInput) {
    return this.prisma.capability.create({
      data
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.CapabilityUpdateInput) {
    return this.prisma.capability.update({
      where: { id },
      data
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.capability.delete({
      where: { id }
    });
  }
}
