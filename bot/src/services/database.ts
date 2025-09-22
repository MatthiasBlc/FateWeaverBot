import axios, { AxiosError } from "axios";
import { config } from "../config/config.js";

const API = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types d'erreurs personnalisées
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

// Types d'API
export interface UserProfile {
  id: string;
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  pa: number;
  createdAt: string;
}

export interface UserInput {
  discordId: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
}

export interface ApiHealth {
  status: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Interface pour la réponse d'erreur de l'API
interface ApiErrorResponse {
  message: string;
  [key: string]: unknown; // Pour les propriétés supplémentaires
}

// Gestionnaire d'erreurs global
const handleApiError = (error: AxiosError<ApiErrorResponse>) => {
  console.error("API Error:", error.response?.data?.message || error.message);

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || "Une erreur est survenue";

    if (status === 401) {
      throw new UnauthorizedError(message);
    } else if (status === 409) {
      throw new ConflictError(message);
    } else {
      throw new Error(`Erreur ${status}: ${message}`);
    }
  } else {
    throw new Error(`Erreur de connexion: ${error.message}`);
  }
};

export default class ApiManager {
  // ============ UTILISATEURS ============

  /**
   * Récupère un utilisateur par son ID Discord
   */
  static async getUserByDiscordId(discordId: string): Promise<UserProfile> {
    try {
      const response = await API.get(`/api/users/discord/${discordId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        handleApiError(error);
      }
      throw error;
    }
  }

  /**
   * Crée ou met à jour un utilisateur
   */
  static async upsertUser(userData: UserInput): Promise<UserProfile> {
    try {
      const response = await API.post("/api/users/upsert", userData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        handleApiError(error);
      }
      throw error;
    }
  }

  /**
   * Récupère le profil complet d'un utilisateur
   */
  static async getUserProfile(discordId: string): Promise<UserProfile> {
    try {
      const response = await API.get(`/api/users/${discordId}/profile`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        handleApiError(error);
      }
      throw error;
    }
  }

  // ============ SANTÉ DE L'API ============

  /**
   * Vérifie que l'API est en ligne
   */
  static async getApiHealth(): Promise<ApiHealth> {
    try {
      const response = await API.get("/health");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        handleApiError(error);
      }
      throw error;
    }
  }

  // Méthode pour récupérer des données JSON
  static async getJson<T = unknown>(
    path: string,
    init?: {
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const url = `${path.startsWith("/") ? "" : "/"}${path}`;
      const response = await API.get<T>(url, init);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        handleApiError(error);
      }
      throw error;
    }
  }

  // Méthode pour envoyer des données JSON
  static async postJson<T = unknown, D = unknown>(
    path: string,
    body: D,
    init: {
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const url = `${path.startsWith("/") ? "" : "/"}${path}`;
      const response = await API.post<T, { data: T }, D>(url, body, init);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        handleApiError(error);
      }
      throw error;
    }
  }
}

// Export d'une instance par défaut pour la rétrocompatibilité
export const apiClient = ApiManager;
