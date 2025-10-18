import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";
import { logger } from "../logger";
import type { Project } from "../../features/projects/projects.types";

/**
 * Service API spécialisé pour les projets
 * Gère toutes les opérations liées aux projets
 */
export class ProjectAPIService extends BaseAPIService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Récupère tous les projets d'une ville
   */
  public async getProjectsByTown(townId: string): Promise<Project[]> {
    const response = await this.api.get(`/projects/town/${townId}`);
    return response.data;
  }

  /**
   * Récupère les projets filtrés par type d'artisanat
   */
  public async getProjectsByCraftType(townId: string, craftType: string): Promise<Project[]> {
    const response = await this.api.get(`/projects/town/${townId}/craft-type/${craftType}`);
    return response.data;
  }

  /**
   * Crée un nouveau projet
   */
  public async createProject(
    projectData: {
      name: string;
      paRequired: number;
      townId: string;
      craftTypes: string[];
      outputResourceTypeId?: number;
      outputObjectTypeId?: number; // NOUVEAU: Support pour objets en sortie
      outputQuantity: number;
      resourceCosts?: { resourceTypeId: number; quantityRequired: number }[];
      paBlueprintRequired?: number; // NOUVEAU: PA requis pour blueprints
      blueprintResourceCosts?: { resourceTypeId: number; quantityRequired: number }[]; // NOUVEAU: Coûts blueprint
    },
    userId: string
  ) {
    const response = await this.api.post('/projects', {
      ...projectData,
      createdBy: userId
    });
    return response.data;
  }

  /**
   * Supprime un projet par son ID
   */
  public async deleteProject(id: string) {
    const response = await this.api.delete(`/projects/${id}`);
    return response.data;
  }

  /**
   * Contribue PA et/ou ressources à un projet (endpoint unifié backend)
   */
  public async contributeToProject(
    characterId: string,
    projectId: string,
    paAmount?: number,
    resourceContributions?: { resourceTypeId: number; quantity: number }[]
  ) {
    const response = await this.api.post(
      `/characters/${characterId}/projects/${projectId}/contribute`,
      {
        paAmount: paAmount || 0,
        resourceContributions: resourceContributions || []
      }
    );
    return response.data;
  }

  /**
   * Redémarre un blueprint pour créer un nouveau projet
   */
  public async restartBlueprint(projectId: number, createdBy: string): Promise<Project> {
    const response = await this.api.post(`/projects/${projectId}/restart`, { createdBy });
    return response.data;
  }
}
