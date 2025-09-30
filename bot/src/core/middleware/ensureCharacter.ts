import { ChatInputCommandInteraction } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import {
  checkAndPromptCharacterCreation,
  checkAndPromptReroll,
} from "../../modals/character-modals";

/**
 * Middleware qui vérifie si l'utilisateur peut effectuer une action et déclenche les modals si nécessaire
 * Utilise la nouvelle logique de vérification sans création automatique
 */
export async function ensureCharacterAvailability(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guildId || !interaction.member) {
    throw new Error("Cette commande ne peut être utilisée que dans une guilde");
  }

  const userId = interaction.user.id;
  const guildId = interaction.guildId;

  try {
    logger.info(
      `[ensureCharacterAvailability] Vérification de la disponibilité du personnage pour ${userId}...`
    );

    // Utiliser la nouvelle logique de vérification
    const characterStatus = await apiService.checkCharacterStatus(userId, guildId, interaction.client);

    // Si l'utilisateur a besoin de créer un personnage, afficher le modal
    if (characterStatus.needsCreation) {
      logger.info(
        `[ensureCharacterAvailability] L'utilisateur ${userId} a besoin de créer un personnage`
      );

      const modalShown = await checkAndPromptCharacterCreation(interaction);
      if (modalShown) {
        throw new Error("CHARACTER_CREATION_REQUIRED");
      }
      return;
    }

    // Si l'utilisateur peut reroll, afficher le modal de reroll
    if (characterStatus.canReroll) {
      logger.info(
        `[ensureCharacterAvailability] L'utilisateur ${userId} a ${characterStatus.rerollableCharacters?.length || 0} personnage(s) rerollable(s)`
      );

      const modalShown = await checkAndPromptReroll(interaction);
      if (modalShown) {
        throw new Error("REROLL_REQUIRED");
      }
      return;
    }

    // Si l'utilisateur a un personnage actif, tout va bien
    if (characterStatus.hasActiveCharacter) {
      logger.info(
        `[ensureCharacterAvailability] L'utilisateur ${userId} peut effectuer des actions normalement`
      );
      return;
    }

    // Cas par défaut - ne devrait pas arriver mais pour sécurité
    logger.warn(`[ensureCharacterAvailability] État du personnage inconnu pour ${userId}`);
    throw new Error("État du personnage non déterminé");

  } catch (error) {
    if (error instanceof Error && (error.message === "CHARACTER_CREATION_REQUIRED" || error.message === "REROLL_REQUIRED")) {
      logger.info(
        `[ensureCharacterAvailability] Modal affiché pour l'utilisateur ${userId}, arrêt de la commande`
      );
      throw error;
    }

    logger.error(
      `[ensureCharacterAvailability] Erreur lors de la vérification de disponibilité:`,
      {
        userId,
        guildId,
        error: error instanceof Error ? error.message : error,
      }
    );
    throw error;
  }
}

/**
 * Wrapper pour intégrer le middleware de vérification de personnage dans les commandes
 */
export function withCharacterCheck(
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>
) {
  return async (interaction: ChatInputCommandInteraction) => {
    try {
      await ensureCharacterAvailability(interaction);
      return await handler(interaction);
    } catch (error) {
      if (error instanceof Error && (error.message === "CHARACTER_CREATION_REQUIRED" || error.message === "REROLL_REQUIRED")) {
        return; // Arrêter silencieusement l'exécution de la commande
      }
      throw error;
    }
  };
}
