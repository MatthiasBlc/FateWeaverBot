/**
 * Button handlers for Chantiers
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import { logger } from "../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Chantier button handlers
 */
export function registerChantierButtons(handler: ButtonHandler): void {
  // Gestionnaire pour le bouton "Participer à un chantier"
  handler.registerHandler("chantier_participate", async (interaction: ButtonInteraction) => {
    try {
      const { handleParticipateButton } = await import(
        "./handlers/index.js"
      );
      await handleParticipateButton(interaction);
    } catch (error) {
      logger.error("Error handling chantier participate button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la participation au chantier.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton admin "Ajouter un chantier"
  handler.registerHandler("chantier_admin_add", async (interaction: ButtonInteraction) => {
    try {
      const { handleAdminAddButton } = await import(
        "./handlers/index.js"
      );
      await handleAdminAddButton(interaction);
    } catch (error) {
      logger.error("Error handling chantier admin add button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'accès au formulaire d'ajout.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton admin "Supprimer un chantier"
  handler.registerHandler("chantier_admin_delete", async (interaction: ButtonInteraction) => {
    try {
      const { handleAdminDeleteButton } = await import(
        "./handlers/index.js"
      );
      await handleAdminDeleteButton(interaction);
    } catch (error) {
      logger.error("Error handling chantier admin delete button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'accès au formulaire de suppression.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton "Ajouter une ressource" lors de la création de chantier
  handler.registerHandler("chantier_add_resource", async (interaction: ButtonInteraction) => {
    try {
      const { handleAddResourceButton } = await import(
        "./chantier-creation.js"
      );
      await handleAddResourceButton(interaction);
    } catch (error) {
      logger.error("Error handling chantier add resource button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Gestionnaire pour le bouton "Créer le chantier" (création finale)
  handler.registerHandler("chantier_create_final", async (interaction: ButtonInteraction) => {
    try {
      const { handleCreateFinalButton } = await import(
        "./chantier-creation.js"
      );
      await handleCreateFinalButton(interaction);
    } catch (error) {
      logger.error("Error handling chantier create final button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création du chantier.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
