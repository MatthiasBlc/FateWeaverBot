import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateObjectTypeDto {
  name: string;
  description?: string;
}

export class ObjectAPIService extends BaseAPIService {
  constructor(api: AxiosInstance) {
    super(api);
  }

  /**
   * Crée un nouveau type d'objet
   */
  async createObjectType(data: CreateObjectTypeDto) {
    const response = await this.api.post("/objects", data);
    return response.data;
  }

  /**
   * Récupère tous les types d'objets
   */
  async getAllObjectTypes() {
    const response = await this.api.get("/objects");
    return response.data;
  }

  /**
   * Récupère un type d'objet par son ID
   */
  async getObjectTypeById(id: number) {
    const response = await this.api.get(`/objects/${id}`);
    return response.data;
  }
}
