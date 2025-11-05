import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";
import { logger } from "../logger";
import { EatResult } from "../../features/hunger/hunger.types";
import { Character } from "../../types/entities";

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
   * @param discordId L'ID Discord de l'utilisateur
   * @param townId L'ID de la ville
   */
  public async getActiveCharacter(discordId: string, townId: string): Promise<Character | null> {
    try {
      // Utiliser directement l'endpoint qui récupère le personnage actif
      const response = await this.get<Character>(`/characters/active/${discordId}/${townId}`);
      
      if (!response) {
        logger.warn("No active character found for user:", { discordId, townId });
        return null;
      }
      
      logger.info(`[getActiveCharacter] Active character found:`, {
        discordId,
        townId,
        characterId: response.id,
        characterName: response.name,
        isActive: response.isActive
      });
      
      return response;
    } catch (error) {
      logger.error("Error fetching active character:", {
        discordId,
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
  public async eatFood(characterId: string): Promise<EatResult> {
    return this.post(`/characters/${characterId}/eat`);
  }

  /**
   * Permet à un personnage de manger un type de nourriture alternatif
   */
  public async eatFoodAlternative(characterId: string, resourceTypeName: string): Promise<EatResult> {
    return this.post(`/characters/${characterId}/eat-alternative`, { foodType: resourceTypeName });
  }

  /**
   * Récupère un personnage par son ID
   * @param characterId L'ID du personnage à récupérer
   */
  public async getCharacterById(characterId: string): Promise<Character> {
    try {
      const response = await this.get<Character>(`/characters/${characterId}`);
      
      if (!response) {
        throw new Error(`Aucun personnage trouvé avec l'ID ${characterId}`);
      }
      
      logger.info(`[getCharacterById] Personnage récupéré:`, {
        characterId,
        characterName: response.name,
        isActive: response.isActive
      });
      
      return response;
    } catch (error) {
      logger.error("Erreur lors de la récupération du personnage:", {
        characterId,
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
    jobId?: number;
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
      hp?: number;
      pm?: number;
      isDead?: boolean;
      canReroll?: boolean;
      isActive?: boolean;
    }
  ) {
    logger.info("Updating character stats", { characterId, stats });
    return this.patch(`/characters/${characterId}/stats`, stats);
  }

  /**
   * Récupère les capacités d'un personnage
   */
  public async getCharacterCapabilities(characterId: string) {
    return this.get(`/characters/${characterId}/capabilities`);
  }

  /**
   * Récupère les compétences (skills) d'un personnage
   */
  public async getCharacterSkills(characterId: string) {
    return this.get(`/characters/${characterId}/skills`);
  }

  /**
   * Récupère les objets d'un personnage
   */
  public async getCharacterObjects(characterId: string) {
    return this.get(`/characters/${characterId}/objects`);
  }
}
