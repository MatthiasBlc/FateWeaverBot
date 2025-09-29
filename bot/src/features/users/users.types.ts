export interface ProfileData {
  character: {
    id: string;
    name: string;
    roles: Array<{ discordId: string; name: string; color: string }>;
    hungerLevel: number;
  };
  actionPoints: {
    points: number;
    lastUpdated: Date;
  };
  timeUntilUpdate: number;
  user: {
    id: string;
    username: string;
    displayAvatarURL: string;
  };
  member: {
    nickname?: string | null;
  };
}