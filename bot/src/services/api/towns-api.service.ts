import { AxiosInstance } from 'axios';
import { Town } from '../../types/entities';

export class TownsAPIService {
  constructor(private http: AxiosInstance) {}

  async getTownByGuildId(guildId: string): Promise<Town> {
    const response = await this.http.get<Town>(`/api/towns/guild/${guildId}`);
    return response.data;
  }

  async getTownById(townId: string): Promise<Town> {
    const response = await this.http.get<Town>(`/api/towns/${townId}`);
    return response.data;
  }
}
