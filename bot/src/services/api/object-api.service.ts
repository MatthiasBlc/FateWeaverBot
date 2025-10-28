import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateObjectTypeDto {
  name: string;
  description?: string;
}

export interface UpdateObjectTypeDto {
  name?: string;
  description?: string;
}

export interface AddSkillBonusDto {
  skillId: string;
  bonusValue: number;
}

export interface AddCapabilityBonusDto {
  capabilityId: string;
}

export interface AddResourceConversionDto {
  resourceTypeId: string;
  quantity: number;
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

  /**
   * Ajoute un bonus de compétence à un objet
   */
  async addSkillBonus(objectId: string, data: AddSkillBonusDto) {
    const response = await this.api.post(`/objects/${objectId}/skill-bonus`, data);
    return response.data;
  }

  /**
   * Ajoute un bonus de capacité à un objet
   */
  async addCapabilityBonus(objectId: string, data: AddCapabilityBonusDto) {
    const response = await this.api.post(`/objects/${objectId}/capability-bonus`, data);
    return response.data;
  }

  /**
   * Ajoute une conversion en ressource à un objet
   */
  async addResourceConversion(objectId: string, data: AddResourceConversionDto) {
    const response = await this.api.post(`/objects/${objectId}/resource-conversion`, data);
    return response.data;
  }

  /**
   * Met à jour un type d'objet
   */
  async updateObjectType(id: number, data: UpdateObjectTypeDto) {
    const response = await this.api.patch(`/objects/${id}`, data);
    return response.data;
  }

  /**
   * Supprime un type d'objet
   */
  async deleteObjectType(id: number) {
    const response = await this.api.delete(`/objects/${id}`);
    return response.data;
  }
}
