export interface ProfileData {
  character: {
    id: string;
    name: string;
    roles: Array<{ id: string; discordId: string; name: string; color: string | null }>;
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