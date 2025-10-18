/**
 * Town entity - Represents an in-game town/city
 */
export interface Town {
  id: string;
  name: string;
  foodStock: number;
  guildId: string;
  population: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  guild?: {
    id: string;
    discordGuildId: string;
    name: string;
  };
  chantiers?: any[];
}
