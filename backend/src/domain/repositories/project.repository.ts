import { PrismaClient, Prisma } from "@prisma/client";
import { ProjectQueries } from "../../infrastructure/database/query-builders/project.queries";

export class ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // FIND METHODS
  // =====================

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      ...ProjectQueries.fullInclude()
    });
  }

  async findAllAvailable() {
    return this.prisma.project.findMany({
      where: { isBlueprint: true },
      ...ProjectQueries.fullInclude(),
      orderBy: { name: "asc" }
    });
  }

  async findByTown(townId: string) {
    return this.prisma.project.findMany({
      where: { townId },
      ...ProjectQueries.fullInclude(),
      orderBy: { name: "asc" }
    });
  }

  // =====================
  // CREATE METHODS
  // =====================

  async create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({
      data,
      ...ProjectQueries.fullInclude()
    });
  }

  // =====================
  // UPDATE METHODS
  // =====================

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
      ...ProjectQueries.fullInclude()
    });
  }

  // =====================
  // DELETE METHODS
  // =====================

  async delete(id: string) {
    return this.prisma.project.delete({
      where: { id }
    });
  }
}
