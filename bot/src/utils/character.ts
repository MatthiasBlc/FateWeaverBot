import { ChatInputCommandInteraction } from "discord.js";
import { apiService } from "@/services/api";
import { Character } from "@/services/api/character-api.service";
import { logger } from "@/services/logger";

/**
 * Récupère le personnage actif de l'utilisateur pour une commande utilisateur
 * Garantit que seul le personnage actif (isActive = true) est utilisé
 * @param interaction L'interaction Discord
 * @returns Le personnage actif ou null si aucun personnage actif trouvé
 * @throws Error si l'utilisateur n'a pas de personnage actif
 */
export async function getActiveCharacterForUser(
  interaction: ChatInputCommandInteraction
): Promise<Character> {
  if (!interaction.guildId) {
    throw new Error("Cette commande ne peut être utilisée que dans une guilde");
  }

  const userId = interaction.user.id;

  try {
    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId) as { id: string } | null;

    if (!town || typeof town !== 'object' || !('id' in town)) {
      throw new Error("Aucune ville trouvée pour ce serveur");
    }

    // Récupérer le personnage actif de l'utilisateur
    const character = await apiService.getActiveCharacter(userId, town.id);

    if (!character) {
      throw new Error("Vous devez d'abord créer un personnage avec la commande `/start`");
    }

    // Type assertion pour garantir que le personnage a les propriétés attendues
    const activeCharacter = character as Character;
    
    logger.info(
      `[getActiveCharacterForUser] Personnage actif récupéré pour ${userId}: ${activeCharacter.name} (ID: ${activeCharacter.id})`
    );
    
    return activeCharacter;
  } catch (error) {
    logger.error(
      `[getActiveCharacterForUser] Erreur lors de la récupération du personnage actif pour ${userId}:`,
      {
        error: error instanceof Error ? error.message : error,
        guildId: interaction.guildId,
      }
    );
    throw error;
  }
}
