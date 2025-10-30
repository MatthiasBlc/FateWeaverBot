/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from './httpClient';
import { logger } from './logger';
import { formatErrorForLog } from '../utils/errors';

export interface Capability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  costPA: number;
  emojiTag?: string;
  // Add other capability properties as needed
}

/**
 * Récupère toutes les capacités d'un personnage via l'API
 * @param characterId - L'ID du personnage
 * @returns Un tableau des capacités du personnage
 */
export async function getCharacterCapabilities(characterId: string): Promise<Capability[]> {
  try {
    const response = await httpClient.get(`/characters/${characterId}/capabilities`);
    logger.debug('Raw API response for character capabilities', {
      characterId,
      data: response.data
    });

    // Les données reçues ont la structure : [{ characterId, capabilityId, capability: {...} }]
    const capabilities = (response.data || []).map((item: any) => {
      logger.debug('Processing capability item', { item });
      const mapped = {
        id: item.capability?.id || item.id,
        name: item.capability?.name || item.name,
        description: item.capability?.description || item.description,
        costPA: item.capability?.costPA || item.costPA,
        cooldown: item.capability?.cooldown || item.cooldown || 0,
        emojiTag: item.capability?.emojiTag || item.emojiTag,
      };
      logger.debug('Mapped capability', { mapped });
      return mapped;
    });

    logger.debug('Final capabilities array', { count: capabilities.length, capabilities });
    return capabilities;
  } catch (error) {
    logger.error('Error fetching character capabilities:', {
      characterId,
      error: formatErrorForLog(error),
    });
    return [];
  }
}
