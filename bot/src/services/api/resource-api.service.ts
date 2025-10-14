import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateResourceTypeDto {
  name: string;
  emoji: string;
  category: string;
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
}
