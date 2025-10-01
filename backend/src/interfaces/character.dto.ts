export interface CharacterDto {
  id: string;
  name: string | null;
  userId: string;
  guildId: string;
  createdAt: Date;
  updatedAt: Date;
  paTotal: number;
  lastPaUpdate: Date;
  hungerLevel: number;
  hp: number;
  user?: {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    globalName: string | null;
    avatar: string | null;
  };
  guild?: {
    id: string;
    discordId: string;
    name: string;
  };
  roles?: Array<{
    id: string;
    discordId: string;
    name: string;
    color: string | null;
  }>;
}
