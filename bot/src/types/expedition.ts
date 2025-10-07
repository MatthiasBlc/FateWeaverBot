export interface Expedition {
  id: string;
  name: string;
  status: string;
  duration: number; // in days
  townId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  foodStock?: number; // Champ optionnel pour compatibilité
}

export interface CreateExpeditionData {
  name: string;
  townId: string;
  initialResources: { resourceTypeName: string; quantity: number }[];
  duration: number; // in days
  createdBy: string;
  characterId: string;
}
