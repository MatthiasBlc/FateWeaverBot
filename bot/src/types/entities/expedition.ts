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
