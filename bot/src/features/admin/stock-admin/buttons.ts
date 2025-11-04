/**
 * Button handlers for Stock Admin
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../../utils/button-handler";
import { logger } from "../../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Stock Admin button handlers
 */
export function registerStockAdminButtons(handler: ButtonHandler): void {
  // Gestionnaire pour le bouton d'ajout de stock admin
  handler.registerHandler("stock_admin_add", async (interaction: ButtonInteraction) => {
    try {
      const { handleStockAdminAddButton } = await import(
        "../stock-admin.command.js"
      );
      await handleStockAdminAddButton(interaction);
    } catch (error) {
      logger.error("Error handling stock admin add button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage de l'ajout de ressources.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton de retrait de stock admin
  handler.registerHandler("stock_admin_remove", async (interaction: ButtonInteraction) => {
    try {
      const { handleStockAdminRemoveButton } = await import(
        "../stock-admin.command.js"
      );
      await handleStockAdminRemoveButton(interaction);
    } catch (error) {
      logger.error("Error handling stock admin remove button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage du retrait de ressources.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
