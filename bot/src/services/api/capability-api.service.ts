import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateCapabilityDto {
  name: string;
  emojiTag: string;
  category: "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";
  costPA: number;
  description?: string;
}

export interface UpdateCapabilityDto {
  name?: string;
  emojiTag?: string;
  category?: "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";
  costPA?: number;
  description?: string;
}

export class CapabilityAPIService extends BaseAPIService {
  constructor(api: AxiosInstance) {
    super(api);
  }

  /**
   * Crée une nouvelle capacité
   */
  async createCapability(data: CreateCapabilityDto) {
    const response = await this.api.post("/capabilities", data);
    return response.data;
  }

  /**
   * Récupère toutes les capacités
   */
  async getAllCapabilities() {
    const response = await this.api.get("/capabilities");
    return response.data;
  }

  /**
   * Récupère une capacité par son ID
   */
  async getCapabilityById(id: string) {
    const response = await this.api.get(`/capabilities/${id}`);
    return response.data;
  }

  /**
   * Met à jour une capacité
   */
  async updateCapability(id: string, data: UpdateCapabilityDto) {
    const response = await this.api.patch(`/capabilities/${id}`, data);
    return response.data;
  }

  /**
   * Supprime une capacité
   */
  async deleteCapability(id: string) {
    const response = await this.api.delete(`/capabilities/${id}`);
    return response.data;
  }
}
