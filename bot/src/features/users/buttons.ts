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

  // Gestionnaire pour le bouton de choix de PA pour cartographier
  handler.registerHandlerByPrefix("cartography_pa:", async (interaction: ButtonInteraction) => {
    try {
      const { handleCartographyPAChoice } = await import(
        "./cartography.handlers.js"
      );
      await handleCartographyPAChoice(interaction);
    } catch (error) {
      logger.error("Error handling cartography PA choice button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'utilisation de la capacité Cartographier.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton de choix de PA pour pêcher
  handler.registerHandlerByPrefix("fishing_pa:", async (interaction: ButtonInteraction) => {
    try {
      const { handleFishingPAChoice } = await import(
        "./fishing.handlers.js"
      );
      await handleFishingPAChoice(interaction);
    } catch (error) {
      logger.error("Error handling fishing PA choice button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'utilisation de la capacité Pêcher.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton de choix de PA pour cuisiner
  handler.registerHandlerByPrefix("cooking_pa:", async (interaction: ButtonInteraction) => {
    try {
      const { handleCookingPAChoice } = await import(
        "./cooking.handlers.js"
      );
      await handleCookingPAChoice(interaction);
    } catch (error) {
      logger.error("Error handling cooking PA choice button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'utilisation de la capacité Cuisiner.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton de choix de PA pour rechercher
  handler.registerHandlerByPrefix("researching_pa:", async (interaction: ButtonInteraction) => {
    try {
      const { handleResearchingPAChoice } = await import(
        "./researching.handlers.js"
      );
      await handleResearchingPAChoice(interaction);
    } catch (error) {
      logger.error("Error handling researching PA choice button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'utilisation de la capacité Rechercher.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton de choix de PA pour auspice
  handler.registerHandlerByPrefix("auspice_pa:", async (interaction: ButtonInteraction) => {
    try {
      const { handleAuspicePAChoice } = await import(
        "./auspice.handlers.js"
      );
      await handleAuspicePAChoice(interaction);
    } catch (error) {
      logger.error("Error handling auspice PA choice button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'utilisation de la capacité Auspice.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton de choix de PA pour soigner
  handler.registerHandlerByPrefix("healing_pa:", async (interaction: ButtonInteraction) => {
    try {
      const { handleHealingPAChoice } = await import(
        "./healing.handlers.js"
      );
      await handleHealingPAChoice(interaction);
    } catch (error) {
      logger.error("Error handling healing PA choice button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'utilisation de la capacité Soigner.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
