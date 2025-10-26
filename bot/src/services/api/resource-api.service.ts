import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateResourceTypeDto {
  name: string;
  emoji: string;
  category: string;
  description?: string;
}

export interface UpdateResourceTypeDto {
  name?: string;
  emoji?: string;
  category?: string;
  description?: string;
}

export class ResourceAPIService extends BaseAPIService {
  constructor(api: AxiosInstance) {
    super(api);
  }

  /**
   * Crée un nouveau type de ressource
   */
  async createResourceType(data: CreateResourceTypeDto) {
    const response = await this.api.post("/resources/types", data);
    return response.data;
  }

  /**
   * Récupère tous les types de ressources
   */
  async getAllResourceTypes() {
    const response = await this.api.get("/resources/types");
    return response.data;
  }

  /**
   * Récupère un type de ressource par son ID
   */
  async getResourceTypeById(id: number) {
    const response = await this.api.get(`/resources/types/${id}`);
    return response.data;
  }

  /**
   * Met à jour un type de ressource
   */
  async updateResourceType(id: number, data: UpdateResourceTypeDto) {
    const response = await this.api.patch(`/resources/types/${id}`, data);
    return response.data;
  }

  /**
   * Supprime un type de ressource
   */
  async deleteResourceType(id: number) {
    const response = await this.api.delete(`/resources/types/${id}`);
    return response.data;
  }

  /**
   * Récupère les ressources pour une localisation spécifique
   */
  async getResourcesForLocation(locationType: "CITY" | "EXPEDITION", locationId: string) {
    const response = await this.api.get(`/resources/${locationType}/${locationId}`);
    return response.data;
  }

  /**
   * Ajoute ou met à jour une ressource
   */
  async addOrUpdateResource(locationType: "CITY" | "EXPEDITION", locationId: string, resourceTypeId: number, quantity: number) {
    const response = await this.api.post(`/resources/${locationType}/${locationId}/${resourceTypeId}`, {
      quantity
    });
    return response.data;
  }

  /**
   * Définit la quantité d'une ressource
   */
  async setResourceQuantity(locationType: "CITY" | "EXPEDITION", locationId: string, resourceTypeId: number, quantity: number) {
    const response = await this.api.put(`/resources/${locationType}/${locationId}/${resourceTypeId}`, {
      quantity
    });
    return response.data;
  }

  /**
   * Supprime une ressource
   */
  async deleteResource(locationType: "CITY" | "EXPEDITION", locationId: string, resourceTypeId: number) {
    const response = await this.api.delete(`/resources/${locationType}/${locationId}/${resourceTypeId}`);
    return response.data;
  }
}
