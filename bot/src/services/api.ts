import { AxiosInstance } from "axios";
import { Client } from "discord.js";
import { httpClient } from "./httpClient";
import { getOrCreateServer as upsertServer } from "./servers.service";
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
   * Récupère ou crée un serveur (upsert via POST)
   */
  public async getOrCreateServer(
    discordId: string,
    name: string,
    memberCount: number
  ) {
    return upsertServer(discordId, name, memberCount);
  }

  /**
   * Crée ou met à jour un rôle
   */
  public async upsertRole(
    serverId: string,
    discordRoleId: string,
    name: string,
    color?: string
  ) {
    return upsertRoleSvc(serverId, discordRoleId, name, color);
  }

  /**
   * Récupère ou crée un personnage pour un utilisateur dans un serveur
   */
  public async getOrCreateCharacter(
    userId: string,
    serverId: string,
    serverName: string,
    characterData: {
      nickname?: string | null;
      roles: string[];
      username?: string;
    },
    client: Client
  ) {
    return getOrCreateCharacterSvc(
      userId,
      serverId,
      serverName,
      characterData,
      client
    );
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
   * Récupère tous les chantiers d'un serveur
   */
  public async getChantiersByServer(serverId: string) {
    return fetchChantiersByServer(serverId);
  }

  /**
   * Crée un nouveau chantier
   */
  public async createChantier(
    chantierData: {
      name: string;
      cost: number;
      serverId: string;
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
}

export const apiService = APIService.getInstance();
