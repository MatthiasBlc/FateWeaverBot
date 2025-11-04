/**
 * Button handlers for Hunger/Eating
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import { logger } from "../../services/logger";
import { apiService } from "../../services/api";
import { httpClient } from "../../services/httpClient";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Hunger button handlers
 */
export function registerHungerButtons(handler: ButtonHandler): void {
  // Gestionnaire pour le bouton de nourriture (vivres)
  handler.registerHandlerByPrefix("eat_food", async (interaction: ButtonInteraction) => {
    await interaction.deferUpdate();

    try {
      const { handleEatButton } = await import(
        "./hunger.handlers.js"
      );

      // Extraire l'ID du personnage de l'ID personnalisé du bouton
      const characterId = interaction.customId.split(":")[1];

      if (!characterId) {
        throw new Error("ID du personnage manquant dans l'ID du bouton");
      }

      // Récupérer le personnage par son ID
      const character = await apiService.characters.getCharacterById(characterId);

      if (!character) {
        await interaction.editReply({
          content: `${STATUS.ERROR} Personnage introuvable.`,
          embeds: [],
          components: [],
        });
        return;
      }

      await handleEatButton(interaction, character);
    } catch (error) {
      logger.error("Error handling eat food button:", { error });
      await interaction.editReply({
        content: `${STATUS.ERROR} Une erreur est survenue lors de l'action de manger.`,
        embeds: [],
        components: [],
      });
    }
  });

  // Gestionnaire pour le bouton "Manger +" (menu avancé)
  handler.registerHandlerByPrefix("eat_more", async (interaction: ButtonInteraction) => {
    try {
      const { handleEatMoreButton } = await import(
        "./eat-more.handlers.js"
      );
      await handleEatMoreButton(interaction);
    } catch (error) {
      logger.error("Error handling eat more button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage du menu avancé.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour manger 1 vivre
  handler.registerHandlerByPrefix("eat_vivre_1", async (interaction: ButtonInteraction) => {
    try {
      const { handleEatVivre1Button } = await import(
        "./eat-more.handlers.js"
      );
      await handleEatVivre1Button(interaction);
    } catch (error) {
      logger.error("Error handling eat vivre 1 button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la consommation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour manger 1 nourriture
  handler.registerHandlerByPrefix("eat_nourriture_1", async (interaction: ButtonInteraction) => {
    try {
      const { handleEatRepas1Button } = await import(
        "./eat-more.handlers.js"
      );
      await handleEatRepas1Button(interaction);
    } catch (error) {
      logger.error("Error handling eat nourriture 1 button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la consommation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour manger vivres à satiété
  handler.registerHandlerByPrefix("eat_vivre_full", async (interaction: ButtonInteraction) => {
    try {
      const { handleEatVivreFull } = await import(
        "./eat-more.handlers.js"
      );
      await handleEatVivreFull(interaction);
    } catch (error) {
      logger.error("Error handling eat vivre full button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la consommation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour manger nourriture à satiété
  handler.registerHandlerByPrefix("eat_nourriture_full", async (interaction: ButtonInteraction) => {
    try {
      const { handleEatRepasFull } = await import(
        "./eat-more.handlers.js"
      );
      await handleEatRepasFull(interaction);
    } catch (error) {
      logger.error("Error handling eat nourriture full button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la consommation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour utiliser un cataplasme
  handler.registerHandlerByPrefix("use_cataplasme", async (interaction: ButtonInteraction) => {
    await interaction.deferUpdate();

    try {
      // Extraire l'ID du personnage de l'ID personnalisé du bouton
      const characterId = interaction.customId.split(":")[1];

      // Appel API backend pour utiliser un cataplasme
      const response = await httpClient.post(
        `/characters/${characterId}/use-cataplasme`
      );

      if (response.data.success) {
        // Envoyer le message public au channel admin
        if (response.data.publicMessage && interaction.guildId) {
          const { sendLogMessage } = await import("../../utils/channels");
          await sendLogMessage(interaction.guildId, interaction.client, response.data.publicMessage);
        }

        await interaction.editReply({
          content: response.data.message,
          embeds: [],
          components: [],
        });
      } else {
        await interaction.editReply({
          content: response.data.message || `${STATUS.ERROR} Impossible d'utiliser le cataplasme.`,
          embeds: [],
          components: [],
        });
      }
    } catch (error) {
      logger.error("Error handling use cataplasme button:", { error });
      await interaction.editReply({
        content: `${STATUS.ERROR} Une erreur est survenue lors de l'utilisation du cataplasme.`,
        embeds: [],
        components: [],
      });
    }
  });
}
