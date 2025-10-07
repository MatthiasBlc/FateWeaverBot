/**
 * Character entity - Represents a player character
 * This is the comprehensive type returned by the API
 */
export interface Character {
  id: string;
  name: string;
  userId: string;
  townId: string;
  isActive: boolean;
  isDead: boolean;
  canReroll: boolean;
  hungerLevel: number;
  paTotal: number;
  hp: number;
  pm: number;
  roles?: Array<{ discordId: string; name: string }>;
  lastPaUpdate: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    globalName: string | null;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
  };
  town?: {
    id: string;
    name: string;
    foodStock: number;
    guildId: string;
  };
}
