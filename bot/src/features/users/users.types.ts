// Types pour le système de profil avec embeds détaillés

export interface ProfileData {
  character: {
    id: string;
    name: string;
    roles: Array<{ discordId: string; name: string; }>;
    hungerLevel: number;
    hp: number;
    pm: number;
  };
  actionPoints: {
    points: number;
    lastUpdated: Date;
  };
  timeUntilUpdate: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  user: {
    id: string;
    username: string;
    displayAvatarURL: string;
  };
  member: {
    nickname: string | null;
    roles: Array<{ id: string; name: string; color: string; }>;
  };
}

// Types pour les points d'action
export interface ActionPointsData {
  points: number;
  lastUpdated: string;
}

export type ActionPointsResponse = {
  success: boolean;
  data: ActionPointsData | null;
};