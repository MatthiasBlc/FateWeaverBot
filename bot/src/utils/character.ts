import { ChatInputCommandInteraction, ModalSubmitInteraction } from "discord.js";
import { apiService } from "@/services/api";
import { Character } from "@/services/api/character-api.service";
import { logger } from "@/services/logger";

/**
 * Récupère le personnage actif de l'utilisateur
 * @param userId L'ID de l'utilisateur Discord
 * @param guildId L'ID de la guilde Discord
 * @returns Le personnage actif
 * @throws Error si aucun personnage actif trouvé ou si la guilde n'est pas valide
 */
export async function getActiveCharacterForUser(
  userId: string,
  guildId: string
): Promise<Character> {
  if (!guildId) {
    throw new Error("Cette commande ne peut être utilisée que dans une guilde");
  }

  try {
    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(guildId) as { id: string } | null;

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
        guildId,
        userId,
      }
    );
    throw error;
  }
}

/**
 * Récupère le personnage actif à partir d'une interaction de commande
 * @param interaction L'interaction de commande Discord
 * @returns Le personnage actif
 */
export async function getActiveCharacterFromCommand(interaction: ChatInputCommandInteraction): Promise<Character> {
  if (!interaction.guildId) {
    throw new Error("Cette commande ne peut être utilisée que dans une guilde");
  }
  return getActiveCharacterForUser(interaction.user.id, interaction.guildId);
}

/**
 * Récupère le personnage actif à partir d'une interaction de modal
 * @param interaction L'interaction de modal Discord
 * @returns Le personnage actif
 */
export async function getActiveCharacterFromModal(interaction: ModalSubmitInteraction): Promise<Character> {
  if (!interaction.guildId) {
    throw new Error("Cette commande ne peut être utilisée que dans une guilde");
  }
  return getActiveCharacterForUser(interaction.user.id, interaction.guildId);
}
