/**
 * Guild entity - Represents a Discord server/guild
 */
export interface Guild {
  id: string;
  discordId: string;
  name: string;
  memberCount: number;
  logChannelId?: string;
  createdAt: Date;
  updatedAt: Date;
}
