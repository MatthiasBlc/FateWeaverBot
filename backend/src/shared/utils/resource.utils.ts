import { prisma } from "../../util/db";
import { LocationType } from "@prisma/client";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";

export class ResourceUtils {
  static async getResourceTypeByName(name: string) {
    const resourceType = await prisma.resourceType.findUnique({
      where: { name }
    });

    if (!resourceType) {
      throw new Error(`Type de ressource '${name}' introuvable`);
    }

    return resourceType;
  }

  static async getResourceTypeByNameOrNull(name: string) {
    return await prisma.resourceType.findUnique({
      where: { name }
    });
  }

  static async getStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number
  ) {
    return await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      ...ResourceQueries.withResourceType()
    });
  }

  static async getStockOrThrow(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number
  ) {
    const stock = await this.getStock(locationType, locationId, resourceTypeId);

    if (!stock) {
      throw new Error(
        `Stock introuvable pour locationType=${locationType}, locationId=${locationId}, resourceTypeId=${resourceTypeId}`
      );
    }

    return stock;
  }

  static async upsertStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number,
    amount: number
  ) {
    return await prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      update: { quantity: { increment: amount } },
      create: { locationType, locationId, resourceTypeId, quantity: amount }
    });
  }

  static async decrementStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number,
    amount: number
  ) {
    return await prisma.resourceStock.update({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      data: { quantity: { decrement: amount } }
    });
  }

  static async setStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number,
    quantity: number
  ) {
    return await prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId),
      update: { quantity },
      create: { locationType, locationId, resourceTypeId, quantity }
    });
  }

  static async getAllStockForLocation(
    locationType: LocationType,
    locationId: string
  ) {
    return await prisma.resourceStock.findMany({
      ...ResourceQueries.byLocation(locationType, locationId)
    });
  }

  static async deleteStock(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number
  ) {
    return await prisma.resourceStock.delete({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceTypeId)
    });
  }
}
