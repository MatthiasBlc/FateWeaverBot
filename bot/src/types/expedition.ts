export interface Expedition {
  id: string;
  name: string;
  foodStock: number;
  duration: number; // in days
  townId: string;
  createdBy: string;
  status: string;
  startedAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  town?: {
    id: string;
    name: string;
    foodStock: number;
  };
  members?: Array<{
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
  }>;
  _count?: {
    members: number;
  };
}

export interface CreateExpeditionData {
  name: string;
  townId: string;
  foodStock: number;
  duration: number; // in days
  createdBy: string;
  characterId: string;
}
