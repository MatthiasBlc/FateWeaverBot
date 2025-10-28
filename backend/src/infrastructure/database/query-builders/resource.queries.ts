import { LocationType } from "@prisma/client";

export class ResourceQueries {
  static stockWhere(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number
  ) {
    return {
      locationType_locationId_resourceTypeId: {
        locationType,
        locationId,
        resourceTypeId
      }
    };
  }

  static withResourceType() {
    return {
      include: { resourceType: true }
    };
  }

  static byLocation(locationType: LocationType, locationId: string) {
    return {
      where: { locationType, locationId },
      ...this.withResourceType(),
      orderBy: { resourceType: { name: "asc" as const } }
    };
  }

  static stockWithType(
    locationType: LocationType,
    locationId: string,
    resourceTypeId: number
  ) {
    return {
      where: this.stockWhere(locationType, locationId, resourceTypeId),
      ...this.withResourceType()
    };
  }
}
