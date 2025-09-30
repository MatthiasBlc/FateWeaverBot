import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";
import { logger } from "../logger";

/**
 * Service API spécialisé pour les personnages
 * Gère toutes les opérations liées aux personnages
 */
export class CharacterAPIService extends BaseAPIService {
  constructor(apiClient: AxiosInstance) {
    super(apiClient);
  }

  /**
   * Récupère le personnage actif d'un utilisateur dans une ville
   */
  public async getActiveCharacter(userId: string, townId: string): Promise<any | null> {
    try {
      // Récupérer tous les personnages de la ville
      const characters = await this.getTownCharacters(townId);

      // S'assurer que characters est un tableau
      if (!Array.isArray(characters)) {
        throw new Error('Expected an array of characters but received something else');
      }

      // Trouver le personnage actif de l'utilisateur
      const activeCharacter = characters.find((char: any) =>
        char.userId === userId && char.isActive
      );

      return activeCharacter || null;
    } catch (error) {
      logger.error("Error fetching active character:", {
        userId,
        townId,
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
   * Récupère les informations des points d'action d'un personnage
   */
  public async getActionPoints(characterId: string) {
    return this.get(`/action-points/${characterId}`);
  }

  /**
   * Permet à un personnage de manger
   */
  public async eatFood(characterId: string) {
    return this.post(`/characters/${characterId}/eat`);
  }

  /**
   * Récupère tous les personnages d'une guilde
   */
  public async getGuildCharacters(guildId: string) {
    return this.get(`/characters/guild/${guildId}`);
  }

  /**
   * Récupère tous les personnages d'une ville
   */
  public async getTownCharacters(townId: string) {
    return this.get(`/characters/town/${townId}`);
  }

  /**
   * Crée un nouveau personnage
   */
  public async createCharacter(characterData: {
    name: string;
    userId: string;
    townId: string;
  }) {
    return this.post('/characters', characterData);
  }

  /**
   * Tue un personnage
   */
  public async killCharacter(characterId: string) {
    return this.post(`/characters/${characterId}/kill`);
  }

  /**
   * Donne l'autorisation de reroll à un personnage
   */
  public async grantRerollPermission(characterId: string) {
    return this.post(`/characters/${characterId}/grant-reroll`);
  }

  /**
   * Crée un personnage reroll
   */
  public async createRerollCharacter(rerollData: {
    userId: string;
    townId: string;
    name: string;
  }) {
    return this.post('/characters/reroll', rerollData);
  }

  /**
   * Change le personnage actif d'un utilisateur
   */
  public async switchActiveCharacter(userId: string, townId: string, characterId: string) {
    return this.post(`/characters/switch-active`, {
      userId,
      townId,
      characterId
    });
  }

  /**
   * Récupère les personnages morts éligibles pour reroll
   */
  public async getRerollableCharacters(userId: string, townId: string) {
    return this.get(`/characters/rerollable/${userId}/${townId}`);
  }

  /**
   * Vérifie si un utilisateur a besoin de créer un personnage
   */
  public async needsCharacterCreation(userId: string, townId: string) {
    return this.get(`/characters/needs-creation/${userId}/${townId}`);
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
    logger.info("Updating character stats", { characterId, stats });
    return this.patch(`/characters/${characterId}/stats`, stats);
  }
}
