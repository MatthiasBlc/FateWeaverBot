import {
  Client,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { sendLogMessage } from "../../utils/channels";

/**
 * Gère la mort d'un personnage
 * @param characterId ID du personnage mort
 * @param client Client Discord
 * @param guildId ID de la guilde
 * @param cause Cause de la mort (optionnel)
 */
export async function handleCharacterDeath(
  characterId: string,
  client: Client,
  guildId: string,
  cause?: string
) {
  try {
    logger.info("Handling character death", { characterId, guildId, cause });

    // Tuer le personnage
    await apiService.killCharacter(characterId);

    // Envoyer un message de log
    const deathCause = cause || "mort naturelle";
    const logMessage = `💀 Un personnage est mort${cause ? ` de ${deathCause}` : ''}.`;
    await sendLogMessage(guildId, client, logMessage);

    logger.info("Character death handled successfully", { characterId });
  } catch (error) {
    logger.error("Error handling character death", {
      characterId,
      guildId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }
}

/**
 * Vérifie si un personnage doit mourir de faim et le tue si nécessaire
 * @param characterId ID du personnage
 * @param client Client Discord
 * @param guildId ID de la guilde
 * @returns true si le personnage est mort, false sinon
 */
export async function checkAndHandleHungerDeath(
  characterId: string,
  client: Client,
  guildId: string
): Promise<boolean> {
  try {
    // Tuer le personnage (si pas déjà mort)
    await apiService.killCharacter(characterId);

    // Envoyer un message de log
    const logMessage = `💀 Un personnage est mort de faim.`;
    await sendLogMessage(guildId, client, logMessage);

    return true;
  } catch (error) {
    logger.error("Error checking hunger death", {
      characterId,
      guildId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    return false;
  }
}

/**
 * Gère la régénération des PA d'un personnage
 * @param characterId ID du personnage
 */
export async function handlePARegeneration(characterId: string) {
  try {
    // Régénérer les PA si nécessaire
    await apiService.updateCharacterStats(characterId, {
      paTotal: Math.min(4, 4) // For now, just set to max
    });
  } catch (error) {
    logger.error("Error handling PA regeneration", {
      characterId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }
}

/**
 * Vérifie si un utilisateur peut effectuer une action (a un personnage actif)
 * @param userId ID de l'utilisateur Discord
 * @param guildId ID de la guilde
 * @returns true si l'utilisateur peut agir, false sinon
 */
export async function canUserPerformAction(userId: string, guildId: string): Promise<boolean> {
  try {
    const user = await apiService.getOrCreateUser(
      userId,
      "", // username non nécessaire ici
      "0000"
    );

    const town = await apiService.getTownByGuildId(guildId);

    if (!town) {
      return false;
    }

    // Vérifier si l'utilisateur a un personnage actif
    const rerollableCharacters = await apiService.getRerollableCharacters(user.id, town.id);

    return rerollableCharacters && rerollableCharacters.length > 0;
  } catch (error) {
    logger.error("Error checking if user can perform action", {
      userId,
      guildId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    return false;
  }
}
