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
      // Essayer de récupérer l'utilisateur
      const response = await this.api.get(`/api/users/discord/${discordId}`);
      return response.data;
    } catch (error: unknown) {
      // Vérifier si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
        // Si l'utilisateur n'existe pas (404), le créer
        if (error.response?.status === 404) {
          try {
            const newUser = {
              discordId,
              username,
              discriminator,
              globalName: username, // Utiliser le même nom d'utilisateur comme globalName par défaut
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
        throw new Error(
          `Erreur lors de la récupération de l'utilisateur: ${errorMessage}`
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
        `/api/users/discord/${discordId}`,
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
      const response = await this.api.get(`/api/servers/discord/${discordId}`);

      // Mettre à jour les informations du serveur si nécessaire
      await this.api.put(`/api/servers/discord/${discordId}`, {
        name,
        memberCount,
      });

      return response.data;
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
            const response = await this.api.post("/api/servers", newServer);
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
   * Récupère ou crée un personnage pour un utilisateur dans un serveur
   * @param userId L'ID Discord de l'utilisateur
   * @param serverId L'ID Discord du serveur
   * @param serverName Le nom du serveur
   * @param characterData Les données du personnage (nickname, roles, etc.)
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
    }
  ) {
    try {
      // Vérifier que l'utilisateur existe
      const user = await this.getOrCreateUser(userId, "", "0000"); // Les valeurs vides seront mises à jour plus tard

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // S'assurer que le serveur existe et obtenir son ID interne
      let server;
      try {
        server = await this.getOrCreateServer(serverId, serverName, 0); // Utiliser le nom du serveur fourni
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

      // Créer ou mettre à jour le personnage
      const response = await this.api.post("/api/characters", {
        userId: user.id,
        serverId: server.id,
        nickname: characterData.nickname,
        roles: characterData.roles,
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
}

export const apiService = APIService.getInstance();
