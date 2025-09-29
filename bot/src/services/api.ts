import { AxiosInstance } from "axios";
import { Client } from "discord.js";
import { httpClient } from "./httpClient";
import { getOrCreateGuild as getOrCreateGuildSvc } from "./guilds.service";
import {
  getChantiersByServer as fetchChantiersByServer,
  createChantier as createChantierSvc,
  deleteChantier as deleteChantierSvc,
  investInChantier as investInChantierSvc,
} from "./chantiers.service";
import {
  getOrCreateUser as getOrCreateUserSvc,
  updateUser as updateUserSvc,
} from "./users.service";
import { upsertRole as upsertRoleSvc } from "./roles.service";
import { getOrCreateCharacter as getOrCreateCharacterSvc } from "./characters.service";
import { logger } from "./logger";

class APIService {
  private static instance: APIService;
  private api: AxiosInstance;

  private constructor() {
    // Use shared HTTP client
    this.api = httpClient;
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  /**
   * Récupère ou crée un utilisateur
   */
  public async getOrCreateUser(
    discordId: string,
    username: string,
    discriminator: string
  ) {
    return getOrCreateUserSvc(discordId, username, discriminator);
  }

  /**
   * Met à jour les informations d'un utilisateur existant
   */
  public async updateUser(
    discordId: string,
    userData: {
      username: string;
      discriminator: string;
      globalName?: string | null;
      avatar?: string | null;
      email?: string | null;
    }
  ) {
    return updateUserSvc(discordId, userData);
  }

  /**
   * Récupère ou crée une guilde
   */
  public async getOrCreateGuild(
    discordId: string,
    name: string,
    memberCount: number
  ) {
    return getOrCreateGuildSvc(discordId, name, memberCount);
  }
  /**
   * Récupère une guilde par son ID Discord
   */
  public async getGuildByDiscordId(discordId: string) {
    try {
      const response = await this.api.get(`/guilds/discord/${discordId}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching guild by Discord ID:", {
        discordId,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      });
      throw error;
    }
  }

  /**
   * Crée ou met à jour un rôle
   */
  public async upsertRole(
    guildId: string,
    discordRoleId: string,
    name: string,
    color?: string
  ) {
    return upsertRoleSvc(guildId, discordRoleId, name, color);
  }

  /**
   * Récupère ou crée un personnage pour un utilisateur dans une guilde
   */
  public async getOrCreateCharacter(
    userId: string,
    guildId: string,
    guildName: string,
    characterData: {
      nickname?: string | null;
      roles: string[];
      username?: string;
    },
    client: Client
  ) {
    return getOrCreateCharacterSvc(
      userId,
      guildId,
      guildName,
      characterData,
      client
    );
  }

  /**
   * Récupère une ville par l'ID de sa guilde
   */
  public async getTownByGuildId(guildId: string) {
    try {
      const response = await this.api.get(`/towns/guild/${guildId}`);
      return response.data;
    } catch (error: any) {
      logger.error("Error fetching town by guild ID:", {
        guildId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      });
      throw error;
    }
  }

  /**
   * Récupère tous les chantiers d'une guilde
   */
  public async getChantiersByServer(guildId: string) {
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
    return createChantierSvc(chantierData, userId);
  }

  /**
   * Supprime un chantier par son ID
   */
  public async deleteChantier(id: string) {
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
    return investInChantierSvc(characterId, chantierId, points);
  }

  /**
   * Récupère les informations des points d'action d'un personnage
   */
  public async getActionPoints(characterId: string, token: string) {
    const response = await this.api.get(`/action-points/${characterId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * Permet à un personnage de manger
   */
  public async eatFood(characterId: string) {
    const response = await this.api.post(`/characters/${characterId}/eat`);
    return response.data;
  }

  /**
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    try {
      const response = await this.api.patch(`/towns/${townId}/food-stock`, {
        foodStock,
      });
      return response.data;
    } catch (error: any) {
      logger.error("Error updating town food stock:", {
        townId,
        foodStock,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      });
      throw error;
    }
  }

  public async updateGuildLogChannel(
    discordId: string,
    logChannelId: string | null
  ) {
    try {
      const response = await this.api.patch(
        `/guilds/${discordId}/log-channel`,
        {
          logChannelId,
        }
      );
      return response.data;
    } catch (error) {
      logger.error("Error updating guild log channel:", {
        discordId,
        logChannelId,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      });
      throw error;
    }
  }
}
export const apiService = APIService.getInstance();
