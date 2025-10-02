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
import {
  checkCharacterStatus,
  type CharacterCheckResult,
} from "./characters.service";

// Import des services spécialisés
import { CharacterAPIService } from "./api/character-api.service";
import { GuildAPIService } from "./api/guild-api.service";
import { ChantierAPIService } from "./api/chantier-api.service";

/**
 * Service API principal - Façade qui maintient l'interface existante
 * Délègue aux services spécialisés pour séparer les responsabilités
 */
class APIService {
  private static instance: APIService;
  private api: AxiosInstance;

  // Services spécialisés
  private characterAPI: CharacterAPIService;
  private guildAPI: GuildAPIService;
  private chantierAPI: ChantierAPIService;

  private constructor() {
    // Use shared HTTP client
    this.api = httpClient;

    // Initialize specialized services
    this.characterAPI = new CharacterAPIService(this.api);
    this.guildAPI = new GuildAPIService(this.api);
    this.chantierAPI = new ChantierAPIService(this.api);
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  // ========== DÉLÉGATION AUX SERVICES SPÉCIALISÉS ==========

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
    return this.guildAPI.getOrCreateGuild(discordId, name, memberCount);
  }

  /**
   * Récupère une guilde par son ID Discord
   */
  public async getGuildByDiscordId(discordId: string) {
    return this.guildAPI.getGuildByDiscordId(discordId);
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
    return this.guildAPI.updateGuildLogChannel(discordGuildId, logChannelId);
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
   * Récupère un personnage actif par son ID Discord et l'ID de la ville
   */
  public async getActiveCharacter(discordId: string, townId: string) {
    return this.characterAPI.getActiveCharacter(discordId, townId);
  }

  /**
   * Récupère un personnage par son ID
   * @param characterId L'ID du personnage à récupérer
   */
  public async getCharacterById(characterId: string) {
    return this.characterAPI.getCharacterById(characterId);
  }

  /**
   * Vérifie l'état du personnage d'un utilisateur (sans création automatique)
   */
  public async checkCharacterStatus(
    userId: string,
    guildId: string,
    client: Client
  ): Promise<CharacterCheckResult> {
    return checkCharacterStatus(userId, guildId, client);
  }

  /**
   * Récupère une ville par l'ID de sa guilde
   */
  public async getTownByGuildId(guildId: string) {
    return this.guildAPI.getTownByGuildId(guildId);
  }

  /**
   * Récupère tous les chantiers d'une guilde
   */
  public async getChantiersByServer(guildId: string) {
    return this.chantierAPI.getChantiersByServer(guildId);
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
    return this.chantierAPI.createChantier(chantierData, userId);
  }

  /**
   * Supprime un chantier par son ID
   */
  public async deleteChantier(id: string) {
    return this.chantierAPI.deleteChantier(id);
  }

  /**
   * Investit des points d'action dans un chantier
   */
  public async investInChantier(
    characterId: string,
    chantierId: string,
    points: number
  ) {
    return this.chantierAPI.investInChantier(characterId, chantierId, points);
  }

  /**
   * Récupère les informations des points d'action d'un personnage
   */
  public async getActionPoints(characterId: string) {
    return this.characterAPI.getActionPoints(characterId);
  }

  /**
   * Permet à un personnage de manger
   */
  public async eatFood(characterId: string) {
    return this.characterAPI.eatFood(characterId);
  }

  /**
   * Récupère tous les personnages d'une guilde
   */
  public async getGuildCharacters(guildId: string) {
    return this.characterAPI.getGuildCharacters(guildId);
  }

  /**
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    return this.guildAPI.updateTownFoodStock(townId, foodStock);
  }

  /**
   * Récupère tous les personnages d'une ville
   */
  public async getTownCharacters(townId: string) {
    return this.characterAPI.getTownCharacters(townId);
  }

  /**
   * Crée un nouveau personnage
   */
  public async createCharacter(characterData: {
    name: string;
    userId: string;
    townId: string;
  }) {
    return this.characterAPI.createCharacter(characterData);
  }

  /**
   * Tue un personnage
   */
  public async killCharacter(characterId: string) {
    return this.characterAPI.killCharacter(characterId);
  }

  /**
   * Donne l'autorisation de reroll à un personnage
   */
  public async grantRerollPermission(characterId: string) {
    return this.characterAPI.grantRerollPermission(characterId);
  }

  /**
   * Crée un personnage reroll
   */
  public async createRerollCharacter(rerollData: {
    userId: string;
    townId: string;
    name: string;
  }) {
    return this.characterAPI.createRerollCharacter(rerollData);
  }

  /**
   * Change le personnage actif d'un utilisateur
   */
  public async switchActiveCharacter(
    userId: string,
    townId: string,
    characterId: string
  ) {
    return this.characterAPI.switchActiveCharacter(userId, townId, characterId);
  }

  /**
   * Récupère les personnages morts éligibles pour reroll
   */
  public async getRerollableCharacters(userId: string, townId: string) {
    return this.characterAPI.getRerollableCharacters(userId, townId);
  }

  /**
   * Vérifie si un utilisateur a besoin de créer un personnage
   */
  public async needsCharacterCreation(userId: string, townId: string) {
    return this.characterAPI.needsCharacterCreation(userId, townId);
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
    return this.characterAPI.updateCharacterStats(characterId, stats);
  }
}

// Export d'une instance singleton pour maintenir la compatibilité
export const apiService = APIService.getInstance();
