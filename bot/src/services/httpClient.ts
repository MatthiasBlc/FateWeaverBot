import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { config } from "../config/index";
import { logger } from "./logger";

// Shared HTTP client used by all services
const baseURL = config.api.baseUrl;

if (!baseURL) {
  throw new Error("La configuration API_URL n'est pas définie");
}

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Request": "true",
  },
});

// Interceptor to ensure /api prefix for relative URLs
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.info("Requête HTTP sortante", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
    });

    if (!config.url?.startsWith("/api/") && !config.url?.startsWith("http")) {
      config.url = `/api${config.url?.startsWith("/") ? "" : "/"}${
        config.url || ""
      }`;
    }
    return config;
  },
  (error) => {
    logger.error("Erreur dans l'intercepteur de requête", { error });
    return Promise.reject(error);
  }
);

// Interceptor for responses
httpClient.interceptors.response.use(
  (response) => {
    logger.info("Réponse HTTP reçue", {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    logger.error("Erreur de réponse HTTP", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
