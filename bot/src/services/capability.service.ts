import { httpClient } from './httpClient';

export interface Capability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  costPA: number;
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
    return response.data || [];
  } catch (error) {
    console.error('Error fetching character capabilities:', error);
    return [];
  }
}
