export interface User {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  globalName?: string | null;
  avatar?: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guild {
  id: string;
  discordId: string;
  name: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  userId: string;
  guildId: string;
  name: string;
  nickname?: string | null;
  roles: string[];
  actionPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  guildId: string;
  discordId: string;
  name: string;
  hexColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionPoints {
  characterId: string;
  points: number;
  lastUpdated: Date;
}
