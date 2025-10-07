export interface EatResult {
  character: {
    id: string;
    name: string;
    hungerLevel: number;
    user: {
      username: string;
    };
  };
  town: {
    name: string;
    foodStock: number;
  };
  foodConsumed: number;
  // Nouveaux champs pour gérer la consommation depuis ville ou expédition
  stockSource?: "CITY" | "EXPEDITION";
  expeditionName?: string;
  resourceTypeConsumed?: string;
}
