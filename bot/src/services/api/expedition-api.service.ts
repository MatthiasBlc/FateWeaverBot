import { AxiosInstance } from 'axios';
import { logger } from '../logger';
import { Expedition } from '../../types/entities';
import { CreateExpeditionDto } from '../../types/dto';

export class ExpeditionAPIService {
  private api: AxiosInstance;
  private basePath = '/api/expeditions';

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  /**
   * Nettoie un objet Expedition pour éviter les références circulaires
   */
  private cleanExpeditionObject(expedition: Expedition): Expedition {
    return {
      id: expedition.id,
      name: expedition.name,
      status: expedition.status,
      duration: expedition.duration,
      townId: expedition.townId,
      createdBy: expedition.createdBy,
      createdAt: expedition.createdAt,
      updatedAt: expedition.updatedAt,
      foodStock: expedition.foodStock || 0, // Ajouter pour compatibilité
    };
  }

  async getActiveExpeditionsForCharacter(characterId: string, userId?: string): Promise<Expedition[]> {
    try {
      const url = userId
        ? `${this.basePath}/character/${characterId}/active?userId=${userId}`
        : `${this.basePath}/character/${characterId}/active`;
      const response = await this.api.get<Expedition[]>(url);
      return response.data;
    } catch (error) {
      logger.error('Error fetching active expeditions for character:', error);
      return [];
    }
  }

  async getExpeditionsByTown(townId: string): Promise<Expedition[]> {
    try {
      const response = await this.api.get<Expedition[]>(`${this.basePath}/town/${townId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching expeditions by town:', error);
      return [];
    }
  }

  async getAllExpeditions(includeReturned = false): Promise<Expedition[]> {
    try {
      const endpoint = includeReturned ? `${this.basePath}?includeReturned=true` : this.basePath;
      const response = await this.api.get<Expedition[]>(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Error fetching all expeditions:', error);
      return [];
    }
  }

  async createExpedition(data: CreateExpeditionDto): Promise<{ data: Expedition }> {
    try {
      const response = await this.api.post<Expedition>(this.basePath, data);

      // Nettoyer l'objet expedition pour éviter les références circulaires
      const cleanExpedition = this.cleanExpeditionObject(response.data);

      return { data: cleanExpedition };
    } catch (error) {
      logger.error('Error creating expedition:', error);
      throw error;
    }
  }

  async joinExpedition(expeditionId: string, characterId: string): Promise<Expedition> {
    try {
      const response = await this.api.post<Expedition>(
        `${this.basePath}/${expeditionId}/join`,
        { characterId }
      );
      return response.data;
    } catch (error) {
      logger.error('Error joining expedition:', error);
      throw error;
    }
  }

  async getExpeditionById(expeditionId: string): Promise<Expedition | null> {
    try {
      const response = await this.api.get<Expedition>(`${this.basePath}/${expeditionId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching expedition by ID:', error);
      return null;
    }
  }

  async startExpedition(expeditionId: string): Promise<Expedition> {
    try {
      const response = await this.api.post<Expedition>(`${this.basePath}/${expeditionId}/start`);
      return response.data;
    } catch (error) {
      logger.error('Error starting expedition:', error);
      throw error;
    }
  }

  async toggleEmergencyVote(
    expeditionId: string,
    userId: string
  ): Promise<{ voted: boolean; totalVotes: number; membersCount: number; thresholdReached: boolean }> {
    try {
      const response = await this.api.post<{
        success: boolean;
        data: { voted: boolean; totalVotes: number; membersCount: number; thresholdReached: boolean }
      }>(
        `${this.basePath}/${expeditionId}/emergency-vote`,
        { userId }
      );
      return response.data.data;
    } catch (error: unknown) {
      // Log safely without circular references
      const axiosError = error as { response?: { data?: { error?: string }; status?: number }; message?: string };
      logger.error('Error toggling emergency vote:', {
        message: axiosError?.response?.data?.error || axiosError?.message || 'Unknown error',
        status: axiosError?.response?.status,
        expeditionId,
        userId,
      });
      throw error;
    }
  }

  async setExpeditionDirection(
    expeditionId: string,
    direction: string,
    characterId: string
  ): Promise<void> {
    await this.api.post(`${this.basePath}/${expeditionId}/set-direction`, {
      direction,
      characterId,
    });
  }

  /**
   * Set expedition dedicated channel
   */
  async setExpeditionChannel(
    expeditionId: string,
    channelId: string | null,
    configuredBy: string
  ): Promise<Expedition> {
    try {
      const response = await this.api.post<Expedition>(
        `${this.basePath}/${expeditionId}/channel`,
        {
          channelId,
          configuredBy,
        }
      );
      return response.data;
    } catch (error) {
      logger.error("Error setting expedition channel:", error);
      throw error;
    }
  }

  /**
   * Send a log message for an expedition
   */
  async sendExpeditionLog(
    expeditionId: string,
    guildId: string,
    message: string
  ): Promise<boolean> {
    try {
      const response = await this.api.post<{ success: boolean }>(
        `${this.basePath}/${expeditionId}/log`,
        {
          guildId,
          message,
        }
      );
      return response.data.success;
    } catch (error) {
      logger.error("Error sending expedition log:", error);
      return false;
    }
  }
}
