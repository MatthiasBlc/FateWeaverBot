/**
 * Role entity - Represents a Discord role
 */
export interface Role {
  id: string;
  guildId: string;
  discordId: string;
  name: string;
  hexColor: string;
  createdAt: Date;
  updatedAt: Date;
}
