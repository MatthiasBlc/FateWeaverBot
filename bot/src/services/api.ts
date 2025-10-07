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
import { Expedition } from "../types/entities";
import { CreateExpeditionDto } from "../types/dto";
import { ChantierAPIService } from "./api/chantier-api.service";
import { ExpeditionAPIService } from "./api/expedition-api.service";
import { TownsAPIService } from "./api/towns-api.service";
import { Town } from "../types/entities";
/**
 * Service API principal - Façade qui maintient l'interface existante
 * Délègue aux services spécialisés pour séparer les responsabilités
 */
class APIService {
  private static instance: APIService;
  private api: AxiosInstance;

  // Services spécialisés
  public readonly characters: CharacterAPIService;
  public readonly guilds: GuildAPIService;
  public readonly chantiers: ChantierAPIService;
  public readonly expeditions: ExpeditionAPIService;
  public readonly towns: TownsAPIService;

  private constructor() {
    // Use shared HTTP client
    this.api = httpClient;

    // Initialize specialized services
    this.characters = new CharacterAPIService(this.api);
    this.guilds = new GuildAPIService(this.api);
    this.chantiers = new ChantierAPIService(this.api);
    this.expeditions = new ExpeditionAPIService(this.api);
    this.towns = new TownsAPIService(this.api);
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  // ========== DÉLÉGATION AUX SERVICES SPÉCIALISÉS ==========
  // NOTE: Prefer using apiService.characters, apiService.guilds, etc. directly
  // These wrapper methods are kept for backward compatibility during migration

  /**
   * Récupère ou crée un utilisateur
   * @note This calls an external service function (not part of specialized services)
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
    return this.guilds.getOrCreateGuild(discordId, name, memberCount);
  }

  /**
   * Récupère une guilde par son ID Discord
   */
  public async getGuildByDiscordId(discordId: string) {
    return this.guilds.getGuildByDiscordId(discordId);
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
    return this.guilds.updateGuildLogChannel(discordGuildId, logChannelId);
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
   * @deprecated Use apiService.characters.getActiveCharacter() instead
   */
  public async getActiveCharacter(discordId: string, townId: string) {
    return this.characters.getActiveCharacter(discordId, townId);
  }

  /**
   * Récupère un personnage par son ID
   * @param characterId L'ID du personnage à récupérer
   * @deprecated Use apiService.characters.getCharacterById() instead
   */
  public async getCharacterById(characterId: string) {
    return this.characters.getCharacterById(characterId);
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
   * @deprecated Use apiService.guilds.getTownByGuildId() instead
   */
  public async getTownByGuildId(guildId: string): Promise<Town | null> {
    return this.guilds.getTownByGuildId(guildId);
  }

  /**
   * Récupère une ville par son ID
   * @deprecated Use apiService.towns.getTownById() instead
   */
  public async getTownById(townId: string): Promise<Town | null> {
    return this.towns.getTownById(townId);
  }

  /**
   * Récupère tous les chantiers d'une guilde
   * @deprecated Use apiService.chantiers.getChantiersByServer() instead
   */
  public async getChantiersByServer(guildId: string) {
    return this.chantiers.getChantiersByServer(guildId);
  }

  /**
   * Crée un nouveau chantier
   * @deprecated Use apiService.chantiers.createChantier() instead
   */
  public async createChantier(
    chantierData: {
      name: string;
      cost: number;
      guildId: string;
    },
    userId: string
  ) {
    return this.chantiers.createChantier(chantierData, userId);
  }

  /**
   * Supprime un chantier par son ID
   * @deprecated Use apiService.chantiers.deleteChantier() instead
   */
  public async deleteChantier(id: string) {
    return this.chantiers.deleteChantier(id);
  }

  /**
   * Investit des points d'action dans un chantier
   * @deprecated Use apiService.chantiers.investInChantier() instead
   */
  public async investInChantier(
    characterId: string,
    chantierId: string,
    points: number
  ) {
    return this.chantiers.investInChantier(characterId, chantierId, points);
  }

  /**
   * @deprecated Use apiService.expeditions.getActiveExpeditionsForCharacter() instead
   */
  public async getActiveExpeditionsForCharacter(characterId: string) {
    return this.expeditions.getActiveExpeditionsForCharacter(characterId);
  }

  /**
   * Permet à un personnage de manger
   * @deprecated Use apiService.characters.eatFood() instead
   */
  public async eatFood(characterId: string) {
    return this.characters.eatFood(characterId);
  }

  /**
   * Permet à un personnage de manger un type de nourriture alternatif
   * @deprecated Use apiService.characters.eatFoodAlternative() instead
   */
  public async eatFoodAlternative(characterId: string, resourceTypeName: string) {
    return this.characters.eatFoodAlternative(characterId, resourceTypeName);
  }

  /**
   * Récupère tous les personnages d'une guilde
   * @deprecated Use apiService.characters.getGuildCharacters() instead
   */
  public async getGuildCharacters(guildId: string) {
    return this.characters.getGuildCharacters(guildId);
  }

  /**
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    return this.guilds.updateTownFoodStock(townId, foodStock);
  }

  /**
   * Récupère tous les personnages d'une ville
   * @deprecated Use apiService.characters.getTownCharacters() instead
   */
  public async getTownCharacters(townId: string) {
    return this.characters.getTownCharacters(townId);
  }

  /**
   * Crée un nouveau personnage
   * @deprecated Use apiService.characters.createCharacter() instead
   */
  public async createCharacter(characterData: {
    name: string;
    userId: string;
    townId: string;
  }) {
    return this.characters.createCharacter(characterData);
  }

  /**
   * Tue un personnage
   * @deprecated Use apiService.characters.killCharacter() instead
   */
  public async killCharacter(characterId: string) {
    return this.characters.killCharacter(characterId);
  }

  /**
   * Donne l'autorisation de reroll à un personnage
   * @deprecated Use apiService.characters.grantRerollPermission() instead
   */
  public async grantRerollPermission(characterId: string) {
    return this.characters.grantRerollPermission(characterId);
  }

  /**
   * Crée un personnage reroll
   * @deprecated Use apiService.characters.createRerollCharacter() instead
   */
  public async createRerollCharacter(rerollData: {
    userId: string;
    townId: string;
    name: string;
  }) {
    return this.characters.createRerollCharacter(rerollData);
  }

  /**
   * Change le personnage actif d'un utilisateur
   * @deprecated Use apiService.characters.switchActiveCharacter() instead
   */
  public async switchActiveCharacter(
    userId: string,
    townId: string,
    characterId: string
  ) {
    return this.characters.switchActiveCharacter(userId, townId, characterId);
  }

  /**
   * Récupère les points d'action d'un personnage
   * @deprecated Use apiService.characters.getActionPoints() instead
   */
  public async getActionPoints(characterId: string) {
    return this.characters.getActionPoints(characterId);
  }

  /**
   * Récupère les personnages morts éligibles pour reroll
   * @deprecated Use apiService.characters.getRerollableCharacters() instead
   */
  public async getRerollableCharacters(userId: string, townId: string) {
    return this.characters.getRerollableCharacters(userId, townId);
  }

  /**
   * Vérifie si un utilisateur a besoin de créer un personnage
   * @deprecated Use apiService.characters.needsCharacterCreation() instead
   */
  public async needsCharacterCreation(userId: string, townId: string) {
    return this.characters.needsCharacterCreation(userId, townId);
  }

  /**
   * @deprecated Use apiService.expeditions.getExpeditionsByTown() instead
   */
  public async getExpeditionsByTown(townId: string) {
    return this.expeditions.getExpeditionsByTown(townId);
  }

  /**
   * @deprecated Use apiService.expeditions.getAllExpeditions() instead
   */
  public async getAllExpeditions(includeReturned = false) {
    return this.expeditions.getAllExpeditions(includeReturned);
  }

  /**
   * @deprecated Use apiService.expeditions.createExpedition() instead
   */
  public async createExpedition(
    expeditionData: CreateExpeditionDto
  ): Promise<{ data: Expedition }> {
    return this.expeditions.createExpedition(expeditionData);
  }

  /**
   * @deprecated Use apiService.expeditions.getExpeditionById() instead
   */
  public async getExpeditionById(expeditionId: string) {
    return this.expeditions.getExpeditionById(expeditionId);
  }

  /**
   * Met à jour les statistiques d'un personnage (PA, faim, etc.)
   * @deprecated Use apiService.characters.updateCharacterStats() instead
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
    return this.characters.updateCharacterStats(characterId, stats);
  }

  /**
   * Rejoint une expédition
   * @deprecated Use apiService.expeditions.joinExpedition() instead
   */
  public async joinExpedition(expeditionId: string, characterId: string) {
    return this.expeditions.joinExpedition(expeditionId, characterId);
  }

  /**
   * Quitte une expédition
   */
  public async leaveExpedition(expeditionId: string, characterId: string) {
    return this.api.post(`/expeditions/${expeditionId}/leave`, { characterId });
  }

  /**
   * Transfère de la nourriture entre ville et expédition
   */
  public async transferExpeditionFood(
    expeditionId: string,
    amount: number,
    direction: "to_town" | "from_town"
  ) {
    return this.api.post(`/expeditions/${expeditionId}/transfer`, {
      amount,
      direction,
    });
  }

  /**
   * Modifie une expédition (admin)
   */
  public async modifyExpedition(expeditionId: string, modifications: { duration?: number; foodStock?: number }) {
    const response = await this.api.patch(`/admin/expeditions/${expeditionId}`, modifications);
    return response.data;
  }

  /**
   * Ajouter un membre à une expédition (admin)
   */
  public async addMemberToExpedition(expeditionId: string, characterId: string) {
    const response = await this.api.post(`/admin/expeditions/${expeditionId}/members`, { characterId });
    return response.data;
  }

  /**
   * Retour d'une expédition (automatique via cron)
   */
  public async returnExpedition(expeditionId: string) {
    const response = await this.api.post(`/expeditions/${expeditionId}/return`);
    return response.data;
  }

  /**
   * Retour forcé d'une expédition (admin)
   */
  public async forceReturnExpedition(expeditionId: string) {
    const response = await this.api.post(`/admin/expeditions/${expeditionId}/force-return`);
    return response.data;
  }

  /**
   * Retirer un membre d'une expédition (admin)
   */
  public async removeMemberFromExpedition(expeditionId: string, characterId: string) {
    const response = await this.api.delete(`/admin/expeditions/${expeditionId}/members/${characterId}`);
    return response.data;
  }

  /**
   * Récupère les ressources d'un lieu (ville ou expédition)
   */
  public async getResources(locationType: string, locationId: string) {
    const response = await this.api.get(`/resources/${locationType}/${locationId}`);
    return response.data;
  }

  /**
   * Récupère tous les types de ressources disponibles
   */
  public async getAllResourceTypes() {
    const response = await this.api.get('/resources/types');
    return response.data;
  }

  /**
   * Ajoute des ressources à un lieu
   */
  public async addResource(locationType: string, locationId: string, resourceTypeId: number, quantity: number) {
    const response = await this.api.post(`/resources/${locationType}/${locationId}/${resourceTypeId}`, { quantity });
    return response.data;
  }

  /**
   * Met à jour la quantité d'une ressource
   */
  public async updateResource(locationType: string, locationId: string, resourceTypeId: number, quantity: number) {
    const response = await this.api.put(`/resources/${locationType}/${locationId}/${resourceTypeId}`, { quantity });
    return response.data;
  }

  /**
   * Transfère des ressources entre deux lieux
   */
  public async transferResource(
    fromLocationType: string,
    fromLocationId: string,
    toLocationType: string,
    toLocationId: string,
    resourceTypeId: number,
    quantity: number
  ) {
    const response = await this.api.post(
      `/resources/${fromLocationType}/${fromLocationId}/${toLocationType}/${toLocationId}/${resourceTypeId}/transfer`,
      { quantity }
    );
    return response.data;
  }
}

// Export d'une instance singleton pour maintenir la compatibilité
export const apiService = APIService.getInstance();
