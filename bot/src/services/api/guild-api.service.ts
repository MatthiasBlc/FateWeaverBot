import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";
import { logger } from "../logger";
import { Town } from "../../types/entities";

export interface GuildUpdateData {
  logChannelId?: string | null;
}

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
  public async getTownByGuildId(guildId: string): Promise<Town | null> {
    logger.info("Fetching town by guild ID", { guildId });
    return this.get<Town>(`/towns/guild/${guildId}`);
  }

  /**
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    logger.info("Updating town food stock", { townId, foodStock });
    return this.patch(`/towns/${townId}/food-stock`, { foodStock });
  }

  /**
   * Met à jour le canal de logs d'une guilde
   * @param discordGuildId L'ID Discord de la guilde
   * @param logChannelId L'ID du canal de logs (ou null pour désactiver)
   */
  public async updateGuildLogChannel(
    discordGuildId: string,
    logChannelId: string | null
  ) {
    try {
      logger.info("Updating guild log channel", { discordGuildId, logChannelId });
      const response = await this.patch<{ logChannelId: string | null }>(
        `/guilds/${discordGuildId}/log-channel`,
        { logChannelId }
      );

      logger.info("Successfully updated guild log channel", {
        discordGuildId,
        logChannelId,
        response: response
      });

      return response;
    } catch (error) {
      logger.error("Error updating guild log channel:", {
        discordGuildId,
        logChannelId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }

  /**
   * Met à jour le canal des messages quotidiens d'une guilde
   * @param discordGuildId L'ID Discord de la guilde
   * @param dailyMessageChannelId L'ID du canal des messages quotidiens (ou null pour désactiver)
   */
  public async updateGuildDailyMessageChannel(
    discordGuildId: string,
    dailyMessageChannelId: string | null
  ) {
    try {
      logger.info("Updating guild daily message channel", { discordGuildId, dailyMessageChannelId });
      const response = await this.patch<{ dailyMessageChannelId: string | null }>(
        `/guilds/${discordGuildId}/daily-message-channel`,
        { dailyMessageChannelId }
      );

      logger.info("Successfully updated guild daily message channel", {
        discordGuildId,
        dailyMessageChannelId,
        response: response
      });

      return response;
    } catch (error) {
      logger.error("Error updating guild daily message channel:", {
        discordGuildId,
        dailyMessageChannelId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }

  /**
   * Récupère toutes les guildes avec leurs villes associées
   */
  public async getAllGuilds() {
    try {
      logger.info("Fetching all guilds");
      const response = await this.get<Array<{
        id: string;
        discordGuildId: string;
        name: string;
        logChannelId: string | null;
        dailyMessageChannelId: string | null;
        town: Town | null;
      }>>("/guilds");
      return response;
    } catch (error) {
      logger.error("Error fetching all guilds:", { error });
      throw error;
    }
  }
}
