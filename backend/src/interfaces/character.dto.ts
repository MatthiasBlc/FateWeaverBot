export interface CharacterDto {
  id: string;
  name: string | null;
  userId: string;
  serverId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    globalName: string | null;
    avatar: string | null;
  };
  server?: {
    id: string;
    discordId: string;
    name: string;
  };
  roles?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}
