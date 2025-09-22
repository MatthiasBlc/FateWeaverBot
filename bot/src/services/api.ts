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
   * @throws {Error} Si une erreur autre que 404 se produit
   */
  public async getOrCreateUser(discordId: string, username: string) {
    try {
      // Essayer de récupérer l'utilisateur
      const response = await this.api.get(`/api/users/discord/${discordId}`);
      return response.data;
    } catch (error: unknown) {
      // Vérifier si c'est une erreur Axios
      if (axios.isAxiosError(error)) {
        // Si l'utilisateur n'existe pas (404), le créer
        if (error.response?.status === 404) {
          const newUser = {
            discordId,
            username,
          };
          const response = await this.api.post("/api/users", newUser);
          return response.data;
        }

        // Si c'est une autre erreur HTTP, la propager avec plus de détails
        throw new Error(
          `Erreur lors de la récupération de l'utilisateur: ${error.message}`
        );
      }

      // Si ce n'est pas une erreur Axios, la propager telle quelle
      throw error;
    }
  }
}

export const apiService = APIService.getInstance();
