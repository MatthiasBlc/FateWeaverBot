export interface CreateUserData {
  discordId: string;
  username: string;
  discriminator: string;
  globalName?: string | null;
  avatar?: string | null;
  email: string;
}

export interface UpdateUserData {
  username?: string;
  discriminator?: string;
  globalName?: string | null;
  avatar?: string | null;
  email?: string;
}

export interface CreateServerData {
  discordId: string;
  name: string;
  memberCount: number;
}

export interface CreateCharacterData {
  userId: string;
  serverId: string;
  name: string;
  nickname?: string | null;
  roles: string[];
}

export interface InvestInChantierData {
  characterId: string;
  chantierId: string;
  points: number;
}

export interface InvestResult {
  pointsInvested: number;
  remainingPoints: number;
  isCompleted: boolean;
}
