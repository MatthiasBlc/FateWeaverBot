/**
 * Character DTOs - Data Transfer Objects for Character operations
 */

export interface CreateCharacterDto {
  userId: string;
  guildId: string;
  name: string;
  nickname?: string | null;
  roles: string[];
}

export interface UpdateCharacterStatsDto {
  paTotal?: number;
  hungerLevel?: number;
  hp?: number;
  pm?: number;
  isDead?: boolean;
  canReroll?: boolean;
  isActive?: boolean;
}
