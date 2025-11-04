/**
 * Button handlers for Object & Skill Admin
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../../utils/button-handler";
import { logger } from "../../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Object & Skill Admin button handlers
 */
export function registerObjectAdminButtons(handler: ButtonHandler): void {
  // Gestionnaire pour les boutons de gestion des objets
  handler.registerHandlerByPrefix("object_admin_", async (interaction: ButtonInteraction) => {
    try {
      const { handleCharacterAdminInteraction } = await import(
        "../character-admin.handlers.js"
      );
      await handleCharacterAdminInteraction(interaction);
    } catch (error) {
      logger.error("Error handling object admin button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du traitement de la gestion des objets.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour les boutons de catégories d'objets
  handler.registerHandlerByPrefix("object_category_", async (interaction: ButtonInteraction) => {
    try {
      const { handleCharacterAdminInteraction } = await import(
        "../character-admin.handlers.js"
      );
      await handleCharacterAdminInteraction(interaction);
    } catch (error) {
      logger.error("Error handling object category button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du traitement de la catégorie d'objets.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour les boutons de gestion des compétences
  handler.registerHandlerByPrefix("skill_admin_", async (interaction: ButtonInteraction) => {
    try {
      const { handleCharacterAdminInteraction } = await import(
        "../character-admin.handlers.js"
      );
      await handleCharacterAdminInteraction(interaction);
    } catch (error) {
      logger.error("Error handling skill admin button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du traitement de la gestion des compétences.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour les boutons de catégories de compétences
  handler.registerHandlerByPrefix("skill_category_", async (interaction: ButtonInteraction) => {
    try {
      const { handleCharacterAdminInteraction } = await import(
        "../character-admin.handlers.js"
      );
      await handleCharacterAdminInteraction(interaction);
    } catch (error) {
      logger.error("Error handling skill category button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du traitement de la catégorie de compétences.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
