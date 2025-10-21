import { PrismaClient, LocationType } from "@prisma/client";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils } from "../shared/utils";
import { ResourceRepository } from "../domain/repositories/resource.repository";

export class ResourceService {
  private resourceRepo: ResourceRepository;

  constructor(private prisma: PrismaClient, resourceRepo?: ResourceRepository) {
    // For backward compatibility, create a new repository if not provided
    this.resourceRepo = resourceRepo || new ResourceRepository(prisma);
  }

  /**
   * Récupère les ressources d'un lieu (ville ou expédition)
   */
  async getLocationResources(locationType: LocationType, locationId: string) {
    return await this.resourceRepo.getLocationResources(locationType, locationId);
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
    const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

    // Ajouter ou mettre à jour le stock
    await ResourceUtils.upsertStock(locationType, locationId, resourceType.id, quantity);
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
    const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

    if (newQuantity < 0) {
      throw new Error("La quantité ne peut pas être négative");
    }

    await this.resourceRepo.setStock(locationType, locationId, resourceType.id, newQuantity);
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
    const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

    if (quantity <= 0) {
      throw new Error("La quantité à retirer doit être positive");
    }

    // Vérifier que le lieu a assez de ressources
    const currentStock = await ResourceUtils.getStock(locationType, locationId, resourceType.id);

    if (!currentStock || currentStock.quantity < quantity) {
      throw new Error(`Pas assez de ${resourceTypeName} disponibles`);
    }

    await this.resourceRepo.decrementStock(locationType, locationId, resourceType.id, quantity);
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

    const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

    await this.resourceRepo.transferResource(
      fromLocationType,
      fromLocationId,
      toLocationType,
      toLocationId,
      resourceType.id,
      quantity
    );
  }

  /**
   * Récupère le stock de vivres d'un lieu
   */
  async getVivresStock(locationType: LocationType, locationId: string): Promise<number> {
    const vivresType = await ResourceUtils.getResourceTypeByName("Vivres");

    const stock = await ResourceUtils.getStock(locationType, locationId, vivresType.id);

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
