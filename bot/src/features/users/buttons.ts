/**
 * Button handlers for User actions
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import { logger } from "../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all User action button handlers
 */
export function registerUserButtons(handler: ButtonHandler): void {
  // Gestionnaire pour le bouton "Utiliser une capacité"
  handler.registerHandlerByPrefix("use_capability", async (interaction: ButtonInteraction) => {
    try {
      const { handleProfileButtonInteraction } = await import(
        "./users.handlers.js"
      );
      await handleProfileButtonInteraction(interaction);
    } catch (error) {
      logger.error("Error handling profile button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage du retrait de ressources.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton "Donner un objet"
  handler.registerHandlerByPrefix("give_object:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProfileButtonInteraction } = await import(
        "./users.handlers.js"
      );
      await handleProfileButtonInteraction(interaction);
    } catch (error) {
      logger.error("Error handling give object button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du traitement de votre objet.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
