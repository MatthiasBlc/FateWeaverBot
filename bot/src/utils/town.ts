import { apiService } from "@/services/api";
import { Town } from "@/types";
import { ERROR_MESSAGES } from "../constants/errors";

/**
 * Récupère une ville par son ID de guilde Discord
 * @param guildId L'ID de la guilde Discord
 * @returns La ville correspondante
 * @throws Error if town is not found
 */
export async function getTownByGuildId(guildId: string): Promise<Town> {
  const town = await apiService.getTownByGuildId(guildId);
  if (!town) {
    throw new Error(ERROR_MESSAGES.TOWN_NOT_FOUND);
  }
  return town as Town;
}

/**
 * Récupère une ville pour une guilde avec validation
 * Alias plus explicite de getTownByGuildId
 * @param guildId L'ID de la guilde Discord
 * @returns La ville correspondante
 * @throws Error if town is not found
 */
export async function getTownForGuild(guildId: string): Promise<Town> {
  return getTownByGuildId(guildId);
}
