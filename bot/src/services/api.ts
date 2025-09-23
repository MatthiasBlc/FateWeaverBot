import axios, { AxiosInstance, AxiosError } from "axios";

class APIService {
  private static instance: APIService;
  private api: AxiosInstance;

  private constructor() {
    // Utiliser l'URL de l'API depuis les variables d'environnement fournies par Docker
    // Cette variable est définie dans le docker-compose.yml
    const baseURL = process.env.API_URL || "http://localhost:3000";

    if (!baseURL) {
      throw new Error("La variable d'environnement API_URL n'est pas définie");
    }

    this.api = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
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
   * @returns Les informations de l'utilisateur
   * @throws {Error} Si une erreur se produit
   */
  public async getOrCreateUser(discordId: string, username: string) {
    try {
      // Essayer de récupérer l'utilisateur
      const response = await this.api.get(`/api/users/discord/${discordId}`);
      return response.data;
    } catch (error: unknown) {
      console.error(
        "[getOrCreateUser] Erreur lors de la récupération de l'utilisateur:",
        error
      );

      // Vérifier si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
        // Si l'utilisateur n'existe pas (404), le créer
        if (error.response?.status === 404) {
          try {
            const newUser = {
              discordId,
              username,
              globalName: username, // Utiliser le même nom d'utilisateur comme globalName
              avatar: null, // L'avatar sera mis à jour plus tard
            };
            console.log(
              `[getOrCreateUser] Création d'un nouvel utilisateur: ${discordId}`
            );
            const response = await this.api.post("/api/users", newUser);
            return response.data;
          } catch (createError) {
            console.error(
              "[getOrCreateUser] Erreur lors de la création de l'utilisateur:",
              createError
            );
            throw new Error(
              `Impossible de créer l'utilisateur: ${
                axios.isAxiosError(createError)
                  ? createError.response?.data?.message || createError.message
                  : "Erreur inconnue"
              }`
            );
          }
        }

        // Si c'est une autre erreur HTTP, la propager avec plus de détails
        const errorMessage = error.response?.data?.message || error.message;
        console.error(
          `[getOrCreateUser] Erreur API (${error.response?.status}):`,
          errorMessage
        );
        throw new Error(
          `Erreur lors de la récupération de l'utilisateur: ${errorMessage}`
        );
      }

      // Si ce n'est pas une erreur Axios, envelopper dans une erreur plus descriptive
      console.error("[getOrCreateUser] Erreur inattendue:", error);
      throw new Error(
        `Erreur inattendue: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
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
      globalName?: string;
      avatar?: string;
      email?: string;
    }
  ) {
    try {
      const response = await this.api.patch(
        `/api/users/discord/${discordId}`,
        userData
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Erreur lors de la mise à jour de l'utilisateur: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Récupère ou crée un serveur
   * @param discordId L'ID Discord du serveur
   * @param name Le nom du serveur
   * @returns Les informations du serveur
   * @throws {Error} Si une erreur se produit
   */
  public async getOrCreateServer(discordId: string, name: string) {
    try {
      // Essayer de récupérer le serveur
      const response = await this.api.get(`/api/servers/discord/${discordId}`);
      return response.data;
    } catch (error: unknown) {
      console.error(
        `[getOrCreateServer] Erreur lors de la récupération du serveur ${discordId}:`,
        error
      );

      // Vérifier si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
        // Si le serveur n'existe pas (404), le créer
        if (error.response?.status === 404) {
          try {
            console.log(
              `[getOrCreateServer] Création d'un nouveau serveur: ${discordId} (${name})`
            );
            const newServer = {
              discordId,
              name,
            };
            const createResponse = await this.api.post(
              "/api/servers",
              newServer
            );
            return createResponse.data;
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
        console.error(
          `[getOrCreateServer] Erreur API (${error.response?.status}):`,
          errorMessage
        );
        throw new Error(
          `Erreur lors de la récupération du serveur: ${errorMessage}`
        );
      }

      // Si ce n'est pas une erreur Axios, envelopper dans une erreur plus descriptive
      console.error("[getOrCreateServer] Erreur inattendue:", error);
      throw new Error(
        `Erreur inattendue: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Récupère ou crée un personnage pour un utilisateur dans un serveur
   * @param userId L'ID Discord de l'utilisateur
   * @param serverId L'ID Discord du serveur
   * @param characterData Les données du personnage (nickname, roles, etc.)
   * @returns Les informations du personnage
   * @throws {Error} Si une erreur se produit
   */
  public async getOrCreateCharacter(
    userId: string,
    serverId: string,
    characterData: {
      nickname?: string | null;
      roles: string[];
    }
  ) {
    try {
      console.log(
        `[getOrCreateCharacter] Récupération du personnage pour l'utilisateur ${userId} sur le serveur ${serverId}`
      );

      // D'abord, essayer de récupérer l'utilisateur pour avoir son ID interne
      const user = await this.getOrCreateUser(
        userId,
        characterData.nickname || "Utilisateur Discord"
      );

      if (!user) {
        throw new Error("Impossible de récupérer ou créer l'utilisateur");
      }

      // S'assurer que le serveur existe et obtenir son ID interne
      let server;
      try {
        server = await this.getOrCreateServer(serverId, "Serveur Discord");
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

      // Maintenant, essayer de récupérer le personnage avec l'ID interne de l'utilisateur et du serveur
      const response = await this.api.get(
        `/api/characters/user/${user.id}/server/${server.id}`
      );

      return response.data;
    } catch (error: unknown) {
      console.error(
        `[getOrCreateCharacter] Erreur lors de la récupération du personnage (${userId}, ${serverId}):`,
        error
      );

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          try {
            console.log(
              `[getOrCreateCharacter] Création d'un nouveau personnage pour l'utilisateur ${userId} sur le serveur ${serverId}`
            );

            // Récupérer l'utilisateur pour avoir son ID interne
            const user = await this.getOrCreateUser(
              userId,
              characterData.nickname || "Utilisateur Discord"
            );

            if (!user) {
              throw new Error("Impossible de récupérer ou créer l'utilisateur");
            }

            // Récupérer le serveur pour avoir son ID interne
            const server = await this.getOrCreateServer(
              serverId,
              "Serveur Discord"
            );
            if (!server || !server.id) {
              throw new Error("ID du serveur non valide");
            }

            // Créer le personnage avec l'ID interne de l'utilisateur et du serveur
            const newCharacter = {
              userId: user.id,
              serverId: server.id, // Utiliser l'ID interne du serveur
              nickname: characterData.nickname,
              roles: characterData.roles,
            };

            const createResponse = await this.api.post(
              "/api/characters",
              newCharacter
            );

            return createResponse.data;
          } catch (createError) {
            console.error(
              "[getOrCreateCharacter] Erreur lors de la création du personnage:",
              createError
            );
            throw new Error(
              `Impossible de créer le personnage: ${
                axios.isAxiosError(createError) &&
                createError.response?.data?.message
                  ? createError.response.data.message
                  : axios.isAxiosError(createError)
                  ? createError.message
                  : "Erreur inconnue"
              }`
            );
          }
        }
        const errorMessage = error.response?.data?.message || error.message;
        console.error(
          `[getOrCreateCharacter] Erreur API (${error.response?.status}):`,
          errorMessage
        );
        throw new Error(
          `Erreur lors de la récupération du personnage: ${errorMessage}`
        );
      }
      console.error("[getOrCreateCharacter] Erreur inattendue:", error);
      throw new Error(
        `Erreur inattendue: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  }
}

export const apiService = APIService.getInstance();
