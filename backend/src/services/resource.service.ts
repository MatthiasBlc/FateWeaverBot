import { PrismaClient, LocationType } from "@prisma/client";

export class ResourceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Récupère les ressources d'un lieu (ville ou expédition)
   */
  async getLocationResources(locationType: LocationType, locationId: string) {
    return await this.prisma.resourceStock.findMany({
      where: {
        locationType,
        locationId
      },
      include: {
        resourceType: true
      },
      orderBy: {
        resourceType: {
          name: "asc"
        }
      }
    });
  }

  /**
   * Ajoute des ressources à un lieu (ville ou expédition)
   */
  async addResourceToLocation(
    locationType: LocationType,
    locationId: string,
    resourceTypeName: string,
    quantity: number
  ): Promise<void> {
    // Récupérer le type de ressource
    const resourceType = await this.prisma.resourceType.findFirst({
      where: { name: resourceTypeName }
    });

    if (!resourceType) {
      throw new Error(`Type de ressource "${resourceTypeName}" non trouvé`);
    }

    // Ajouter ou mettre à jour le stock
    await this.prisma.resourceStock.upsert({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: resourceType.id
        }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        locationType,
        locationId,
        resourceTypeId: resourceType.id,
        quantity
      }
    });
  }

  /**
   * Met à jour la quantité d'une ressource spécifique
   */
  async updateResourceQuantity(
    locationType: LocationType,
    locationId: string,
    resourceTypeName: string,
    newQuantity: number
  ): Promise<void> {
    const resourceType = await this.prisma.resourceType.findFirst({
      where: { name: resourceTypeName }
    });

    if (!resourceType) {
      throw new Error(`Type de ressource "${resourceTypeName}" non trouvé`);
    }

    if (newQuantity < 0) {
      throw new Error("La quantité ne peut pas être négative");
    }

    await this.prisma.resourceStock.upsert({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: resourceType.id
        }
      },
      update: {
        quantity: newQuantity
      },
      create: {
        locationType,
        locationId,
        resourceTypeId: resourceType.id,
        quantity: newQuantity
      }
    });
  }

  /**
   * Retire des ressources d'un lieu
   */
  async removeResourceFromLocation(
    locationType: LocationType,
    locationId: string,
    resourceTypeName: string,
    quantity: number
  ): Promise<void> {
    const resourceType = await this.prisma.resourceType.findFirst({
      where: { name: resourceTypeName }
    });

    if (!resourceType) {
      throw new Error(`Type de ressource "${resourceTypeName}" non trouvé`);
    }

    if (quantity <= 0) {
      throw new Error("La quantité à retirer doit être positive");
    }

    // Vérifier que le lieu a assez de ressources
    const currentStock = await this.prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: resourceType.id
        }
      }
    });

    if (!currentStock || currentStock.quantity < quantity) {
      throw new Error(`Pas assez de ${resourceTypeName} disponibles`);
    }

    await this.prisma.resourceStock.update({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: resourceType.id
        }
      },
      data: {
        quantity: { decrement: quantity }
      }
    });
  }

  /**
   * Transfère des ressources entre deux lieux
   */
  async transferResource(
    fromLocationType: LocationType,
    fromLocationId: string,
    toLocationType: LocationType,
    toLocationId: string,
    resourceTypeName: string,
    quantity: number
  ): Promise<void> {
    if (fromLocationType === toLocationType && fromLocationId === toLocationId) {
      throw new Error("Impossible de transférer vers le même lieu");
    }

    if (quantity <= 0) {
      throw new Error("La quantité doit être positive");
    }

    const resourceType = await this.prisma.resourceType.findFirst({
      where: { name: resourceTypeName }
    });

    if (!resourceType) {
      throw new Error(`Type de ressource "${resourceTypeName}" non trouvé`);
    }

    // Effectuer le transfert en transaction
    await this.prisma.$transaction([
      // Retirer du lieu source
      this.prisma.resourceStock.update({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: fromLocationType,
            locationId: fromLocationId,
            resourceTypeId: resourceType.id
          }
        },
        data: {
          quantity: { decrement: quantity }
        }
      }),
      // Ajouter au lieu destination
      this.prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: toLocationType,
            locationId: toLocationId,
            resourceTypeId: resourceType.id
          }
        },
        update: {
          quantity: { increment: quantity }
        },
        create: {
          locationType: toLocationType,
          locationId: toLocationId,
          resourceTypeId: resourceType.id,
          quantity
        }
      })
    ]);
  }

  /**
   * Récupère le stock de vivres d'un lieu
   */
  async getVivresStock(locationType: LocationType, locationId: string): Promise<number> {
    const vivresType = await this.prisma.resourceType.findFirst({
      where: { name: "Vivres" }
    });

    if (!vivresType) {
      return 0;
    }

    const stock = await this.prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType,
          locationId,
          resourceTypeId: vivresType.id
        }
      }
    });

    return stock?.quantity || 0;
  }

  /**
   * Ajoute des vivres à un lieu (raccourci)
   */
  async addVivresToLocation(
    locationType: LocationType,
    locationId: string,
    quantity: number
  ): Promise<void> {
    await this.addResourceToLocation(locationType, locationId, "Vivres", quantity);
  }
}
