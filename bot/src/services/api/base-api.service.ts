import { AxiosInstance, AxiosResponse } from "axios";
import { logger } from "../logger";

/**
 * Service de base pour les appels API
 * Gère le logging, les erreurs et les transformations communes
 */
export abstract class BaseAPIService {
  protected api: AxiosInstance;

  constructor(apiClient: AxiosInstance) {
    this.api = apiClient;
  }

  /**
   * Effectue un appel GET avec gestion d'erreur standardisée
   */
  protected async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      logger.info(`API GET request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.get(url, { params });

      logger.info(`API GET response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: any) {
      logger.error(`API GET error`, {
        url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }

  /**
   * Effectue un appel POST avec gestion d'erreur standardisée
   */
  protected async post<T>(url: string, data?: any): Promise<T> {
    try {
      logger.info(`API POST request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.post(url, data);

      logger.info(`API POST response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: any) {
      logger.error(`API POST error`, {
        url,
        requestData: data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }

  /**
   * Effectue un appel PATCH avec gestion d'erreur standardisée
   */
  protected async patch<T>(url: string, data?: any): Promise<T> {
    try {
      logger.info(`API PATCH request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.patch(url, data);

      logger.info(`API PATCH response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: any) {
      logger.error(`API PATCH error`, {
        url,
        requestData: data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }

  /**
   * Effectue un appel DELETE avec gestion d'erreur standardisée
   */
  protected async delete<T>(url: string): Promise<T> {
    try {
      logger.info(`API DELETE request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.delete(url);

      logger.info(`API DELETE response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: any) {
      logger.error(`API DELETE error`, {
        url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      });
      throw error;
    }
  }
}
