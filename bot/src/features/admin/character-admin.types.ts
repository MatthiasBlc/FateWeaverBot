import { Character, Town } from '../../types/entities';
import { STATUS } from "../../constants/emojis.js";


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
  NO_ADMIN: `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
  NO_TOWN: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
  NO_CHARACTERS: `${STATUS.ERROR} Aucun personnage trouvé dans cette ville.`,
  CHARACTER_NOT_FOUND: `${STATUS.ERROR} Personnage non trouvé.`,
  INVALID_STATS: `${STATUS.ERROR} Valeurs de statistiques invalides.`,
  INTERACTION_EXPIRED: `${STATUS.ERROR} Interaction expirée.`,
  UPDATE_FAILED: `${STATUS.ERROR} Erreur lors de la mise à jour du personnage.`,
} as const;
