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
import { checkCharacterStatus } from "./characters.service";
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
   * Récupère le personnage actif d'un utilisateur dans une ville
   */
  public async getActiveCharacter(userId: string, townId: string) {
    try {
      // Récupérer tous les personnages de la ville
      const characters = await this.getTownCharacters(townId);

      // Trouver le personnage actif de l'utilisateur
      const activeCharacter = characters.find((char: any) =>
        char.userId === userId && char.isActive
      );

      return activeCharacter || null;
    } catch (error) {
      logger.error("Error fetching active character:", {
        userId,
        townId,
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
   * Vérifie l'état du personnage d'un utilisateur (sans création automatique)
   */
  public async checkCharacterStatus(userId: string, guildId: string, client: Client) {
    return checkCharacterStatus(userId, guildId, client);
  }

  /**
   * Récupère une ville par l'ID de sa guilde
   */
  public async getTownByGuildId(guildId: string) {
    try {
      logger.info("Appel API getTownByGuildId", {
        guildId,
        baseURL: this.api.defaults.baseURL,
      });
      const response = await this.api.get(`/towns/guild/${guildId}`);
      logger.info("Réponse API getTownByGuildId réussie", {
        guildId,
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error: any) {
      logger.error("Erreur API getTownByGuildId", {
        guildId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
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
  public async getActionPoints(characterId: string) {
    try {
      const response = await this.api.get(`/action-points/${characterId}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching action points:", {
        characterId,
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
   * Permet à un personnage de manger
   */
  public async eatFood(characterId: string) {
    const response = await this.api.post(`/characters/${characterId}/eat`);
    return response.data;
  }

  /**
   * Récupère tous les personnages d'une guilde
   */
  public async getGuildCharacters(guildId: string) {
    try {
      const response = await this.api.get(`/characters/guild/${guildId}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching guild characters:", {
        guildId,
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
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    try {
      logger.info("Appel API updateTownFoodStock", {
        townId,
        foodStock,
        baseURL: this.api.defaults.baseURL,
      });
      const response = await this.api.patch(`/towns/${townId}/food-stock`, {
        foodStock,
      });
      logger.info("Réponse API updateTownFoodStock réussie", {
        townId,
        foodStock,
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error: any) {
      logger.error("Erreur API updateTownFoodStock", {
        townId,
        foodStock,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
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
   * Récupère tous les personnages d'une ville
   */
  public async getTownCharacters(townId: string) {
    try {
      const response = await this.api.get(`/characters/town/${townId}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching town characters:", {
        townId,
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
   * Crée un nouveau personnage
   */
  public async createCharacter(characterData: {
    name: string;
    userId: string;
    townId: string;
  }) {
    try {
      const response = await this.api.post('/characters', characterData);
      return response.data;
    } catch (error) {
      logger.error("Error creating character:", {
        characterData,
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
   * Tue un personnage
   */
  public async killCharacter(characterId: string) {
    try {
      const response = await this.api.post(`/characters/${characterId}/kill`);
      return response.data;
    } catch (error) {
      logger.error("Error killing character:", {
        characterId,
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
   * Donne l'autorisation de reroll à un personnage
   */
  public async grantRerollPermission(characterId: string) {
    try {
      const response = await this.api.post(`/characters/${characterId}/grant-reroll`);
      return response.data;
    } catch (error) {
      logger.error("Error granting reroll permission:", {
        characterId,
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
   * Crée un personnage reroll
   */
  public async createRerollCharacter(rerollData: {
    userId: string;
    townId: string;
    name: string;
  }) {
    try {
      const response = await this.api.post('/characters/reroll', rerollData);
      return response.data;
    } catch (error) {
      logger.error("Error creating reroll character:", {
        rerollData,
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
   * Change le personnage actif d'un utilisateur
   */
  public async switchActiveCharacter(userId: string, townId: string, characterId: string) {
    try {
      const response = await this.api.post(`/characters/switch-active`, {
        userId,
        townId,
        characterId
      });
      return response.data;
    } catch (error) {
      logger.error("Error switching active character:", {
        userId,
        townId,
        characterId,
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
   * Récupère les personnages morts éligibles pour reroll
   */
  public async getRerollableCharacters(userId: string, townId: string) {
    try {
      const response = await this.api.get(`/characters/rerollable/${userId}/${townId}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching rerollable characters:", {
        userId,
        townId,
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
   * Vérifie si un utilisateur a besoin de créer un personnage
   */
  public async needsCharacterCreation(userId: string, townId: string) {
    try {
      const response = await this.api.get(`/characters/needs-creation/${userId}/${townId}`);
      return response.data;
    } catch (error) {
      logger.error("Error checking character creation need:", {
        userId,
        townId,
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
   * Met à jour les statistiques d'un personnage (PA, faim, etc.)
   */
  public async updateCharacterStats(
    characterId: string,
    stats: {
      paTotal?: number;
      hungerLevel?: number;
      isDead?: boolean;
      canReroll?: boolean;
      isActive?: boolean;
    }
  ) {
    try {
      logger.info("Appel API updateCharacterStats", {
        characterId,
        stats,
        baseURL: this.api.defaults.baseURL,
      });
      const response = await this.api.patch(`/characters/${characterId}/stats`, stats);
      logger.info("Réponse API updateCharacterStats réussie", {
        characterId,
        stats,
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error: any) {
      logger.error("Erreur API updateCharacterStats", {
        characterId,
        stats,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }
}
export const apiService = APIService.getInstance();
