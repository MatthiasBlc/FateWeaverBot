import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { config } from "../config/index";

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
    if (!config.url?.startsWith("/api/") && !config.url?.startsWith("http")) {
      config.url = `/api${config.url?.startsWith("/") ? "" : "/"}${
        config.url || ""
      }`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
