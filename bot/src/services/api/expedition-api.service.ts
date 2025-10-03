import { AxiosInstance } from 'axios';
import { logger } from '../logger';

export interface ExpeditionMember {
  id: string;
  character: {
    id: string;
    name: string;
    user: {
      id: string;
      discordId: string;
      username: string;
    };
  };
}

export interface Expedition {
  id: string;
  name: string;
  foodStock: number;
  duration: number;
  townId: string;
  createdBy: string;
  status: 'PLANNING' | 'LOCKED' | 'DEPARTED' | 'RETURNED';
  startedAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  town?: {
    id: string;
    name: string;
    foodStock: number;
  };
  members?: ExpeditionMember[];
  participants?: ExpeditionMember[];
}

export class ExpeditionAPIService {
  private api: AxiosInstance;
  private basePath = '/api/expeditions';

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async getActiveExpeditionsForCharacter(characterId: string): Promise<Expedition[]> {
    try {
      const response = await this.api.get<Expedition[]>(`${this.basePath}/character/${characterId}/active`);
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

  async createExpedition(data: {
    name: string;
    townId: string;
    foodStock: number;
    duration: number;
    characterId: string;
  }): Promise<{ data: Expedition }> {
    try {
      const response = await this.api.post<Expedition>(this.basePath, data);
      return { data: response.data };
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
}
