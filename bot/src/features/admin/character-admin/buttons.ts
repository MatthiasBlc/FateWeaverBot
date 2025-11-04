/**
 * Button handlers for Character Admin
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../../utils/button-handler";
import { logger } from "../../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Character Admin button handlers
 */
export function registerCharacterAdminButtons(handler: ButtonHandler): void {
  // Gestionnaire pour les boutons de gestion des personnages
  handler.registerHandlerByPrefix("character_admin_", async (interaction: ButtonInteraction) => {
    try {
      const { handleCharacterAdminInteraction } = await import(
        "../character-admin.handlers.js"
      );
      await handleCharacterAdminInteraction(interaction);
    } catch (error) {
      logger.error("Error handling character admin button:", { error });
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              `${STATUS.ERROR} Erreur lors du traitement de l'interaction d'administration.`,
            flags: ["Ephemeral"],
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content:
              `${STATUS.ERROR} Erreur lors du traitement de l'interaction d'administration.`,
          });
        }
      } catch (replyError) {
        logger.error("Cannot reply to character admin interaction (probably expired):", { replyError });
      }
    }
  });

  // Gestionnaire pour les boutons de gestion des capacités
  handler.registerHandlerByPrefix("capability_admin_", async (interaction: ButtonInteraction) => {
    try {
      const { handleCharacterAdminInteraction } = await import(
        "../character-admin.handlers.js"
      );
      await handleCharacterAdminInteraction(interaction);
    } catch (error) {
      logger.error("Error handling capability admin button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du traitement de la gestion des capacités.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
