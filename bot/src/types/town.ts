export interface Town {
  id: string;
  name: string;
  foodStock: number;
  guildId: string;
  population: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Add other town properties as needed
}
