import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Shared HTTP client used by all services
const baseURL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://fateweaver-backend:3000/api"
    : "http://backenddev:3000/api");

if (!baseURL) {
  throw new Error("La variable d'environnement API_URL n'est pas définie");
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
