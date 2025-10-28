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
    console.log('=== FRONTEND: Raw API response ===');
    console.log(JSON.stringify(response.data, null, 2));

    // Les données reçues ont la structure : [{ characterId, capabilityId, capability: {...} }]
    const capabilities = (response.data || []).map((item: any) => {
      console.log('Processing item:', JSON.stringify(item, null, 2));
      const mapped = {
        id: item.capability?.id || item.id,
        name: item.capability?.name || item.name,
        description: item.capability?.description || item.description,
        costPA: item.capability?.costPA || item.costPA,
        cooldown: item.capability?.cooldown || item.cooldown || 0,
        emojiTag: item.capability?.emojiTag || item.emojiTag,
      };
      console.log('Mapped capability:', JSON.stringify(mapped, null, 2));
      return mapped;
    });

    console.log('Final capabilities array:', JSON.stringify(capabilities, null, 2));
    return capabilities;
  } catch (error) {
    logger.error('Error fetching character capabilities:', {
      characterId,
      error: formatErrorForLog(error),
    });
    return [];
  }
}
