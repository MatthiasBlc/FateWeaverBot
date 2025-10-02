import { apiService } from "@/services/api";
import { Town } from "@/types";

/**
 * Récupère une ville par son ID de guilde Discord
 * @param guildId L'ID de la guilde Discord
 * @returns La ville correspondante
 */
export async function getTownByGuildId(guildId: string): Promise<Town> {
  const town = await apiService.getTownByGuildId(guildId);
  if (!town) {
    throw new Error(`Aucune ville trouvée pour la guilde ${guildId}`);
  }
  return town as Town;
}
