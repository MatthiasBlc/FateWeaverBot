/**
 * User DTOs - Data Transfer Objects for User operations
 */

export interface CreateUserDto {
  discordId: string;
  username: string;
  discriminator: string;
  globalName?: string | null;
  avatar?: string | null;
  email: string;
}

export interface UpdateUserDto {
  username?: string;
  discriminator?: string;
  globalName?: string | null;
  avatar?: string | null;
  email?: string;
}
