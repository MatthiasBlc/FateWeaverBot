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
  pm: number;
  jobId?: number | null;
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
  job?: {
    id: number;
    name: string;
    description: string | null;
    startingAbility?: {
      id: string;
      name: string;
      emojiTag: string;
    };
    optionalAbility?: {
      id: string;
      name: string;
      emojiTag: string;
    } | null;
  };
  roles?: Array<{
    id: string;
    discordId: string;
    name: string;
    color: string | null;
  }>;
}
