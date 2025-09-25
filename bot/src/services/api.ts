import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { Client } from "discord.js";

class APIService {
  private static instance: APIService;
  private api: AxiosInstance;

  private constructor() {
    // Utiliser l'URL de l'API depuis les variables d'environnement fournies par Docker
    // Cette variable est définie dans le docker-compose.yml
    const baseURL =
      process.env.API_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://fateweaver-backend:3000/api"
        : "http://backenddev:3000/api");

    if (!baseURL) {
      throw new Error("La variable d'environnement API_URL n'est pas définie");
    }

    this.api = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        // Ajout d'un en-tête personnalisé pour les appels internes
        "X-Internal-Request": "true",
        // Si nécessaire, vous pouvez ajouter un token secret partagé
        // "X-Internal-Token": process.env.INTERNAL_API_SECRET
      },
    });

    // Intercepteur pour ajouter le préfixe /api à toutes les requêtes
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Ne pas ajouter /api si l'URL commence déjà par /api/ ou est une URL complète
        if (
          !config.url?.startsWith("/api/") &&
          !config.url?.startsWith("http")
        ) {
          config.url = `/api${config.url?.startsWith("/") ? "" : "/"}${
            config.url || ""
          }`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  /**
   * Récupère ou crée un utilisateur
   * @param discordId L'ID Discord de l'utilisateur
   * @param username Le nom d'utilisateur Discord
   * @param discriminator Le tag Discord (ex: "1234")
   * @returns Les informations de l'utilisateur
   * @throws {Error} Si une erreur se produit
   */
  public async getOrCreateUser(
    discordId: string,
    username: string,
    discriminator: string
  ) {
    try {
      // D'abord, essayer de récupérer l'utilisateur
      const response = await this.api.get(`/users/discord/${discordId}`);

      // Si l'utilisateur existe, le retourner
      if (response.data) {
        return response.data;
      }

      // Si l'utilisateur n'existe pas, le créer
      const createResponse = await this.api.post("/users", {
        discordId,
        username,
        discriminator,
      });

      return createResponse.data;
    } catch (error) {
      console.error("Erreur dans getOrCreateUser:", error);

      // Si c'est une erreur 404 (utilisateur non trouvé), essayer de le créer
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          const createResponse = await this.api.post("/users", {
            discordId,
            username,
            discriminator,
          });
          return createResponse.data;
        } catch (createError) {
          console.error(
            "Erreur lors de la création de l'utilisateur:",
            createError
          );
          throw new Error(
            `Impossible de créer l'utilisateur: ${this.getErrorMessage(
              createError
            )}`
          );
        }
      }

      // Pour les autres erreurs, propager l'erreur d'origine
      throw new Error(
        `Erreur lors de la récupération de l'utilisateur: ${this.getErrorMessage(
          error
        )}`
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return "Erreur inconnue";
    }
  }

  /**
   * Met à jour les informations d'un utilisateur existant
   * @param discordId L'ID Discord de l'utilisateur à mettre à jour
   * @param userData Les données à mettre à jour
   * @returns Les informations mises à jour de l'utilisateur
   * @throws {Error} Si une erreur se produit lors de la mise à jour
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
    try {
      const response = await this.api.put(
        `/users/discord/${discordId}`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error(
        "[updateUser] Erreur lors de la mise à jour de l'utilisateur:",
        error
      );
      throw new Error(
        `Impossible de mettre à jour l'utilisateur: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Récupère ou crée un serveur
   * @param discordId L'ID Discord du serveur
   * @param name Le nom du serveur
   * @param memberCount Le nombre de membres dans le serveur
   * @returns Les informations du serveur
   * @throws {Error} Si une erreur se produit
   */
  public async getOrCreateServer(
    discordId: string,
    name: string,
    memberCount: number
  ) {
    try {
      // Essayer de récupérer le serveur
      const response = await this.api.get(`/servers/discord/${discordId}`);

      // Mettre à jour les informations du serveur en utilisant POST qui gère déjà l'upsert
      const updateResponse = await this.api.post(`/servers`, {
        discordId,
        name,
        memberCount,
      });

      return updateResponse.data;
    } catch (error: unknown) {
      // Vérifier si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
        // Si le serveur n'existe pas (404), le créer
        if (error.response?.status === 404) {
          try {
            const newServer = {
              discordId,
              name,
              memberCount,
            };
            console.log(
              `[getOrCreateServer] Création d'un nouveau serveur: ${name} (${discordId})`
            );
            const response = await this.api.post("/servers", newServer);
            return response.data;
          } catch (createError) {
            console.error(
              "[getOrCreateServer] Erreur lors de la création du serveur:",
              createError
            );
            throw new Error(
              `Impossible de créer le serveur: ${
                axios.isAxiosError(createError)
                  ? createError.response?.data?.message || createError.message
                  : "Erreur inconnue"
              }`
            );
          }
        }

        // Si c'est une autre erreur HTTP, la propager avec plus de détails
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(
          `Erreur lors de la récupération du serveur: ${errorMessage}`
        );
      }

      // Si ce n'est pas une erreur Axios, envelopper dans une erreur plus descriptive
      throw new Error(
        `Erreur inattendue: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Crée ou met à jour un rôle
   * @param serverId L'ID interne du serveur
   * @param discordRoleId L'ID Discord du rôle
   * @param name Le nom du rôle
   * @param color La couleur du rôle (optionnel)
   * @returns Le rôle créé ou mis à jour
   * @throws {Error} Si une erreur se produit
   */
  public async upsertRole(
    serverId: string,
    discordRoleId: string,
    name: string,
    color?: string
  ) {
    try {
      const response = await this.api.post("/roles", {
        discordId: discordRoleId,
        name,
        color,
        serverId,
      });
      return response.data;
    } catch (error) {
      console.error(
        `[upsertRole] Erreur lors de la création/mise à jour du rôle ${discordRoleId} (${name}):`,
        error
      );
      throw new Error(
        `Impossible de créer/mettre à jour le rôle: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Récupère ou crée un personnage pour un utilisateur dans un serveur
   * @param userId L'ID Discord de l'utilisateur
   * @param serverId L'ID Discord du serveur
   * @param serverName Le nom du serveur
   * @param characterData Les données du personnage (nickname, roles, etc.)
   * @param client Le client Discord
   * @returns Les informations du personnage
   * @throws {Error} Si une erreur se produit
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
    try {
      // Vérifier que l'utilisateur existe
      const user = await this.getOrCreateUser(
        userId,
        characterData.username || "",
        "0000"
      );

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Utiliser le nickname s'il existe, sinon utiliser le nom d'utilisateur Discord
      const characterName = characterData.nickname || characterData.username;

      // S'assurer que le serveur existe et obtenir son ID interne
      let server;
      try {
        server = await this.getOrCreateServer(serverId, serverName, 0);
      } catch (serverError) {
        console.error(
          `[getOrCreateCharacter] Erreur lors de la vérification du serveur ${serverId}:`,
          serverError
        );
        throw new Error("Impossible de vérifier ou créer le serveur");
      }

      if (!server || !server.id) {
        throw new Error("ID du serveur non valide");
      }

      // S'assurer que les rôles existent dans la base de données
      const guild = client.guilds.cache.get(serverId);
      if (guild) {
        await Promise.all(
          characterData.roles.map(async (roleId) => {
            const role = guild.roles.cache.get(roleId);
            if (role) {
              try {
                await this.upsertRole(
                  server.id,
                  role.id,
                  role.name,
                  role.hexColor
                );
              } catch (error) {
                console.error(
                  `[getOrCreateCharacter] Erreur lors de la synchronisation du rôle ${role.id}:`,
                  error
                );
              }
            }
          })
        );
      }

      // Créer ou mettre à jour le personnage avec les rôles
      const response = await this.api.post("/characters", {
        userId: user.id,
        serverId: server.id,
        name: characterName,
        roleIds: characterData.roles, // Utiliser roleIds au lieu de roles
      });

      return response.data;
    } catch (error) {
      console.error(
        `[getOrCreateCharacter] Erreur lors de la récupération/création du personnage (${userId}, ${serverId}):`,
        error
      );
      throw new Error(
        `Impossible de récupérer ou créer le personnage: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Récupère les informations des points d'action d'un personnage
   */
  public async getActionPoints(characterId: string, token: string) {
    try {
      const response = await this.api.get(`/action-points/${characterId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des points d'action:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère tous les chantiers d'un serveur
   * @param serverId L'ID Discord du serveur
   * @returns La liste des chantiers du serveur
   * @throws {Error} Si une erreur se produit lors de la récupération
   */
  public async getChantiersByServer(serverId: string) {
    try {
      const response = await this.api.get(`/chantiers/server/${serverId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting chantiers by server:", error);
      throw new Error(
        `Failed to get chantiers: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Crée un nouveau chantier
   * @param chantierData Les données du chantier à créer
   * @param userId L'ID de l'utilisateur qui crée le chantier
   * @returns Le chantier créé
   * @throws {Error} Si une erreur se produit lors de la création
   */
  public async createChantier(
    chantierData: {
      name: string;
      cost: number;
      serverId: string; // Ceci est maintenant l'ID Discord du serveur
    },
    userId: string
  ) {
    try {
      const { serverId, ...rest } = chantierData;
      const response = await this.api.post("/chantiers", {
        ...rest,
        discordGuildId: serverId, // On envoie l'ID Discord du serveur
        createdBy: userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating chantier:", error);
      throw new Error(
        `Failed to create chantier: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Supprime un chantier par son ID
   * @param id L'ID du chantier à supprimer
   * @returns Un message de confirmation
   * @throws {Error} Si une erreur se produit lors de la suppression
   */
  public async deleteChantier(id: string) {
    try {
      const response = await this.api.delete(`/chantiers/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting chantier:", error);
      throw new Error(
        `Failed to delete chantier: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Investit des points d'action dans un chantier
   * @param characterId L'ID du personnage qui investit
   * @param chantierId L'ID du chantier dans lequel investir
   * @param points Le nombre de points à investir
   * @returns Les informations mises à jour du chantier et les points restants
   */
  public async investInChantier(
    characterId: string,
    chantierId: string,
    points: number
  ) {
    try {
      const response = await this.api.post(
        `/chantiers/${chantierId}/invest`,
        { characterId, points },
        {
          headers: {
            "X-Internal-Request": "true",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'investissement dans le chantier:", error);
      throw error;
    }
  }
}

export const apiService = APIService.getInstance();
