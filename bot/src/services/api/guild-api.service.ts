import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";
import { logger } from "../logger";

/**
 * Service API spécialisé pour les guildes
 * Gère toutes les opérations liées aux guildes
 */
export class GuildAPIService extends BaseAPIService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Récupère ou crée une guilde
   */
  public async getOrCreateGuild(
    discordId: string,
    name: string,
    memberCount: number
  ) {
    // Cette méthode délègue au service guilds.service
    const { getOrCreateGuild: getOrCreateGuildSvc } = await import("../guilds.service");
    return getOrCreateGuildSvc(discordId, name, memberCount);
  }

  /**
   * Récupère une guilde par son ID Discord
   */
  public async getGuildByDiscordId(discordId: string) {
    return this.get(`/guilds/discord/${discordId}`);
  }

  /**
   * Récupère une ville par l'ID de sa guilde
   */
  public async getTownByGuildId(guildId: string) {
    logger.info("Fetching town by guild ID", { guildId });
    return this.get(`/towns/guild/${guildId}`);
  }

  /**
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    logger.info("Updating town food stock", { townId, foodStock });
    return this.patch(`/towns/${townId}/food-stock`, { foodStock });
  }
}
