import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateSkillDto {
  name: string;
  description: string;
}

export class SkillAPIService extends BaseAPIService {
  constructor(api: AxiosInstance) {
    super(api);
  }

  /**
   * Crée une nouvelle compétence
   */
  async createSkill(data: CreateSkillDto) {
    const response = await this.api.post("/skills", data);
    return response.data;
  }

  /**
   * Récupère toutes les compétences
   */
  async getAllSkills() {
    const response = await this.api.get("/skills");
    return response.data;
  }

  /**
   * Récupère une compétence par son ID
   */
  async getSkillById(id: string) {
    const response = await this.api.get(`/skills/${id}`);
    return response.data;
  }
}
