import { apiService } from './api';
import { logger } from './logger';
import { Town } from '../types/entities';

export async function getTownByGuildId(guildId: string): Promise<Town | null> {
  try {
    return await apiService.towns.getTownByGuildId(guildId);
  } catch (error) {
    logger.error('Error fetching town by guild ID:', error);
    return null;
  }
}

export async function getTownById(townId: string): Promise<Town | null> {
  try {
    return await apiService.towns.getTownById(townId);
  } catch (error) {
    logger.error('Error fetching town by ID:', error);
    return null;
  }
}
