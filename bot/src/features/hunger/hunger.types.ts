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
}
