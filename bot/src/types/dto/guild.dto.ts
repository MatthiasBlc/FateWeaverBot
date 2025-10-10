/**
 * Guild DTOs - Data Transfer Objects for Guild operations
 */

export interface CreateGuildDto {
  discordId: string;
  name: string;
  memberCount: number;
}

export interface UpdateGuildDto {
  name?: string;
  memberCount?: number;
  logChannelId?: string;
}
