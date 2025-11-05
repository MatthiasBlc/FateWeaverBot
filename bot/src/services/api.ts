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
import { CapabilityAPIService } from "./api/capability-api.service";
import { ResourceAPIService } from "./api/resource-api.service";
import { ProjectAPIService } from "./api/project-api.service";
import { ObjectAPIService } from "./api/object-api.service";
import { SkillAPIService } from "./api/skill-api.service";
import { EmojiAPIService } from "./api/emoji-api.service";
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
  public readonly projects: ProjectAPIService;
  public readonly expeditions: ExpeditionAPIService;
  public readonly towns: TownsAPIService;
  public readonly capabilities: CapabilityAPIService;
  public readonly resources: ResourceAPIService;
  public readonly objects: ObjectAPIService;
  public readonly skills: SkillAPIService;
  public readonly emojis: EmojiAPIService;

  private constructor() {
    // Use shared HTTP client
    this.api = httpClient;

    // Initialize specialized services
    this.characters = new CharacterAPIService(this.api);
    this.guilds = new GuildAPIService(this.api);
    this.chantiers = new ChantierAPIService(this.api);
    this.projects = new ProjectAPIService(this.api);
    this.expeditions = new ExpeditionAPIService(this.api);
    this.towns = new TownsAPIService(this.api);
    this.capabilities = new CapabilityAPIService(this.api);
    this.resources = new ResourceAPIService(this.api);
    this.objects = new ObjectAPIService(this.api);
    this.skills = new SkillAPIService(this.api);
    this.emojis = new EmojiAPIService(this.api);
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

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
   * Met à jour le canal des messages quotidiens d'une guilde
   * @param discordGuildId L'ID Discord de la guilde
   * @param dailyMessageChannelId L'ID du canal des messages quotidiens (ou null pour désactiver)
   */
  public async updateGuildDailyMessageChannel(
    discordGuildId: string,
    dailyMessageChannelId: string | null
  ) {
    return this.guilds.updateGuildDailyMessageChannel(discordGuildId, dailyMessageChannelId);
  }

  /**
   * Met à jour le canal des logs admin d'une guilde
   * @param discordGuildId L'ID Discord de la guilde
   * @param adminLogChannelId L'ID du canal des logs admin (ou null pour désactiver)
   */
  public async updateGuildAdminLogChannel(
    discordGuildId: string,
    adminLogChannelId: string | null
  ) {
    return this.guilds.updateGuildAdminLogChannel(discordGuildId, adminLogChannelId);
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
   * Met à jour le stock de foodstock d'une ville
   */
  public async updateTownFoodStock(townId: string, foodStock: number) {
    return this.guilds.updateTownFoodStock(townId, foodStock);
  }

  /**
   * Quitte une expédition
   */
  public async leaveExpedition(expeditionId: string, characterId: string) {
    return this.api.post(`/expeditions/${expeditionId}/leave`, { characterId });
  }

  /**
   * Transfère de la nourriture entre ville et expédition
   * @deprecated Utiliser transferResource pour plus de flexibilité
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
   * Récupère tous les types de ressources disponibles
   */
  public async getResourceTypes() {
    const response = await this.api.get("/resources/types");
    return response.data;
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
