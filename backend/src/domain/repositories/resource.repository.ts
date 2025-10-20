import { PrismaClient, Prisma, LocationType } from "@prisma/client";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";

export class ResourceRepository {
  constructor(private prisma: PrismaClient) {}

  // =====================
  // RESOURCE TYPE METHODS
  // =====================

  async findResourceTypeByName(name: string) {
    return this.prisma.resourceType.findUnique({
      where: { name }
    });
  }

  async findResourceTypeById(id: number) {
    return this.prisma.resourceType.findUnique({
      where: { id }
    });
  }

  async getAllResourceTypes() {
    return this.prisma.resourceType.findMany({
      orderBy: { name: "asc" }
    });
  }

  // =====================
  // STOCK METHODS
  // =====================

  async getStock(locationType: LocationType, locationId: string, resourceTypeId: number) {
    return this.prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      ...ResourceQueries.withResourceType()
    });
  }

  async getAllStockForLocation(locationType: LocationType, locationId: string) {
    return this.prisma.resourceStock.findMany({
      ...ResourceQueries.byLocation(locationType, locationId)
    });
  }

  async upsertStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number,
    amount: number
  ) {
    const where = ResourceQueries.stockWhere(locationType, locationId, resourceTypeId);

    return this.prisma.resourceStock.upsert({
      where,
      update: {
        quantity: { increment: amount }
      },
      create: {
        locationType,
        locationId,
        resourceTypeId,
        quantity: amount
      },
      ...ResourceQueries.withResourceType()
    });
  }

  async decrementStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number,
    amount: number
  ) {
    return this.prisma.resourceStock.update({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      data: {
        quantity: { decrement: amount }
      },
      ...ResourceQueries.withResourceType()
    });
  }

  async setStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number,
    quantity: number
  ) {
    return this.prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      update: { quantity },
      create: {
        locationType,
        locationId,
        resourceTypeId,
        quantity
      },
      ...ResourceQueries.withResourceType()
    });
  }

  async deleteStock(locationType: LocationType, locationId: string, resourceTypeId: number) {
    return this.prisma.resourceStock.delete({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId)
    });
  }
}
