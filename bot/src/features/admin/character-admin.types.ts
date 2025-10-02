// --- Types and Interfaces --- //

export interface Character {
  id: string;
  name: string;
  paTotal: number;
  hungerLevel: number;
  hp: number;
  pm: number;
  isDead: boolean;
  canReroll: boolean;
  isActive: boolean;
  userId: string;
  townId: string;
  user?: {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    globalName: string;
    avatar: string;
  };
  town?: {
    id: string;
    name: string;
    foodStock: number;
    guildId: string;
  };
}

export interface Town {
  id: string;
  name: string;
  foodStock: number;
  guildId: string;
  guild?: {
    id: string;
    discordGuildId: string;
    name: string;
  };
  chantiers?: any[];
}

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
