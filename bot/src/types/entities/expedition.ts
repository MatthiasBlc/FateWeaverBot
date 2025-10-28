/**
 * Expedition entity - Represents a group expedition
 */
export interface Expedition {
  id: string;
  name: string;
  status: string;
  duration: number; // in days
  townId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  foodStock?: number; // Optional field for compatibility
  startedAt?: string | null;
  endsAt?: string | null;
  returnAt?: string | null;  // Date de retour calculée à partir du départ
  initialDirection?: string;
  path?: string[];
  currentDayDirection?: string | null;
  directionSetBy?: string | null;
  directionSetAt?: string | null;
  emergencyVotesCount?: number; // Number of emergency return votes
  currentUserVoted?: boolean; // Whether the current user has voted for emergency return
  expeditionChannelId?: string | null; // Discord Channel ID for dedicated logs
  channelConfiguredAt?: string | null;
  channelConfiguredBy?: string | null;
  town?: {
    id: string;
    name: string;
    foodStock: number;
  };
  members?: ExpeditionMember[];
  participants?: ExpeditionMember[];
}

export interface ExpeditionMember {
  id: string;
  character: {
    id: string;
    name: string;
    user: {
      id: string;
      discordId: string;
      username: string;
    };
  };
}
