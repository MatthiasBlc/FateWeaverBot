/**
 * User entity - Represents a Discord user in the system
 */
export interface User {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  globalName: string | null;
  avatar: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
