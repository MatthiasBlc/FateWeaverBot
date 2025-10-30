import { AxiosInstance, AxiosResponse } from "axios";
import { logger } from "../logger";

/**
 * Types for API query parameters and request data
 */
type QueryParamValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>;

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
  protected async get<T>(url: string, params?: QueryParams): Promise<T> {
    try {
      logger.info(`API GET request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.get(url, { params });

      logger.info(`API GET response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: unknown) {
      this.logApiError('GET', url, error);
      throw error;
    }
  }

  /**
   * Effectue un appel POST avec gestion d'erreur standardisée
   */
  protected async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      logger.info(`API POST request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.post(url, data);

      logger.info(`API POST response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: unknown) {
      this.logApiError('POST', url, error, data);
      throw error;
    }
  }

  /**
   * Effectue un appel PATCH avec gestion d'erreur standardisée
   */
  protected async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      logger.info(`API PATCH request`, { url, baseURL: this.api.defaults.baseURL });

      const response: AxiosResponse<T> = await this.api.patch(url, data);

      logger.info(`API PATCH response`, {
        url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      return response.data;
    } catch (error: unknown) {
      this.logApiError('PATCH', url, error, data);
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
    } catch (error: unknown) {
      this.logApiError('DELETE', url, error);
      throw error;
    }
  }

  /**
   * Helper method to log API errors with proper type handling
   */
  private logApiError(
    method: string,
    url: string,
    error: unknown,
    requestData?: unknown
  ): void {
    const logData: Record<string, unknown> = { url };

    if (requestData !== undefined) {
      logData.requestData = requestData;
    }

    // Check if it's an Axios error with response
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object'
    ) {
      const response = error.response as {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
      logData.status = response.status;
      logData.statusText = response.statusText;
      logData.responseData = response.data;
    }

    // Add error details if it's an Error instance
    if (error instanceof Error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else {
      logData.error = error;
    }

    logger.error(`API ${method} error`, logData);
  }
}
