import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";
import { logger } from "../logger";

/**
 * Service API spécialisé pour les chantiers
 * Gère toutes les opérations liées aux chantiers
 */
export class ChantierAPIService extends BaseAPIService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Récupère tous les chantiers d'une guilde
   */
  public async getChantiersByServer(guildId: string) {
    // Délègue au service chantiers.service
    const { getChantiersByServer: fetchChantiersByServer } = await import("../chantiers.service");
    return fetchChantiersByServer(guildId);
  }

  /**
   * Crée un nouveau chantier
   */
  public async createChantier(
    chantierData: {
      name: string;
      cost: number;
      guildId: string;
    },
    userId: string
  ) {
    // Délègue au service chantiers.service
    const { createChantier: createChantierSvc } = await import("../chantiers.service");
    return createChantierSvc(chantierData, userId);
  }

  /**
   * Supprime un chantier par son ID
   */
  public async deleteChantier(id: string) {
    // Délègue au service chantiers.service
    const { deleteChantier: deleteChantierSvc } = await import("../chantiers.service");
    return deleteChantierSvc(id);
  }

  /**
   * Investit des points d'action dans un chantier
   */
  public async investInChantier(
    characterId: string,
    chantierId: string,
    points: number
  ) {
    // Délègue au service chantiers.service
    const { investInChantier: investInChantierSvc } = await import("../chantiers.service");
    return investInChantierSvc(characterId, chantierId, points);
  }
}
