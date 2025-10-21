import { PrismaClient, Prisma, CraftType, ProjectStatus } from "@prisma/client";
import { ProjectQueries } from "../../infrastructure/database/query-builders/project.queries";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";

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

  async findByIdWithBlueprint(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        craftTypes: true,
        resourceCosts: {
          ...ResourceQueries.withResourceType()
        },
        blueprintResourceCosts: {
          ...ResourceQueries.withResourceType()
        }
      }
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
      include: {
        craftTypes: true,
        resourceCosts: {
          ...ResourceQueries.withResourceType()
        },
        blueprintResourceCosts: {
          ...ResourceQueries.withResourceType()
        }
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "asc" }
      ]
    });
  }

  async findActiveProjectsForCraftType(townId: string, craftType: CraftType) {
    return this.prisma.project.findMany({
      where: {
        townId,
        status: ProjectStatus.ACTIVE,
        craftTypes: {
          some: {
            craftType
          }
        }
      },
      include: {
        craftTypes: true,
        resourceCosts: {
          ...ResourceQueries.withResourceType()
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async findFirst(where: Prisma.ProjectWhereInput) {
    return this.prisma.project.findFirst({
      where
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
