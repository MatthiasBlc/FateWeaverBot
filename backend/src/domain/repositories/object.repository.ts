import { PrismaClient, Prisma } from "@prisma/client";

export class ObjectRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: number) {
    return this.prisma.objectType.findUnique({
      where: { id }
    });
  }

  async findAll() {
    return this.prisma.objectType.findMany({
      orderBy: { name: "asc" }
    });
  }

  async findByName(name: string) {
    return this.prisma.objectType.findUnique({
      where: { name }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.ObjectTypeCreateInput) {
    return this.prisma.objectType.create({
      data
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: number, data: Prisma.ObjectTypeUpdateInput) {
    return this.prisma.objectType.update({
      where: { id },
      data
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: number) {
    return this.prisma.objectType.delete({
      where: { id }
    });
  }
}
