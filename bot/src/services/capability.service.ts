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
    // Extraire les propriétés de l'objet capability imbriqué
    return (response.data || []).map((item: any) => ({
      id: item.capability?.id || item.id,
      name: item.capability?.name || item.name,
      description: item.capability?.description || item.description,
      costPA: item.capability?.costPA || item.costPA,
      cooldown: item.capability?.cooldown || item.cooldown || 0,
    }));
  } catch (error) {
    console.error('Error fetching character capabilities:', error);
    return [];
  }
}
