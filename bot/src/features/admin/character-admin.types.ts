import { Character, Town } from '../../types/entities';

// Re-export for backward compatibility
export type { Character, Town };

// --- Types and Interfaces --- //

export interface CharacterAdminState {
  characters: Character[];
  selectedCharacterId?: string;
  town?: Town;
}

// --- Constants --- //

export const CHARACTER_ADMIN_ERRORS = {
  NO_ADMIN: "❌ Vous devez être administrateur pour utiliser cette commande.",
  NO_TOWN: "❌ Aucune ville trouvée pour ce serveur.",
  NO_CHARACTERS: "❌ Aucun personnage trouvé dans cette ville.",
  CHARACTER_NOT_FOUND: "❌ Personnage non trouvé.",
  INVALID_STATS: "❌ Valeurs de statistiques invalides.",
  INTERACTION_EXPIRED: "❌ Interaction expirée.",
  UPDATE_FAILED: "❌ Erreur lors de la mise à jour du personnage.",
} as const;
