/**
 * Button handlers for Projects
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import { logger } from "../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Project button handlers (Admin and User)
 */
export function registerProjectButtons(handler: ButtonHandler): void {
  // Admin: Ajouter un projet
  handler.registerHandler("project_admin_add", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAdminAddButton } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAdminAddButton(interaction);
    } catch (error) {
      logger.error("Error handling project admin add button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire de création.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Nom optionnel
  handler.registerHandlerByPrefix("project_add_optional_name:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddOptionalName } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddOptionalName(interaction);
    } catch (error) {
      logger.error("Error handling project add optional name button:", { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire.`,
          flags: ["Ephemeral"],
        });
      }
    }
  });

  // Admin: Validation de sélection
  handler.registerHandlerByPrefix("project_add_validate_selection:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddValidateSelection } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddValidateSelection(interaction);
    } catch (error) {
      logger.error("Error handling project add validate selection:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la validation de la sélection.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Modifier un projet
  handler.registerHandler("project_admin_edit", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAdminEditButton } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAdminEditButton(interaction);
    } catch (error) {
      logger.error("Error handling project admin edit button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage de la modification.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Supprimer un projet
  handler.registerHandler("project_admin_delete", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAdminDeleteButton } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAdminDeleteButton(interaction);
    } catch (error) {
      logger.error("Error handling project admin delete button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage de la suppression.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Confirmation de suppression
  handler.registerHandlerByPrefix("project_admin_delete_confirm", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAdminDeleteConfirm } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAdminDeleteConfirm(interaction);
    } catch (error) {
      logger.error("Error handling project admin delete confirm:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la confirmation de suppression.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Catégorie d'objets
  handler.registerHandlerByPrefix("project_add_object_category:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddObjectCategory } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddObjectCategory(interaction);
    } catch (error) {
      logger.error("Error handling project add object category:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la navigation dans les catégories.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Ajouter une ressource
  handler.registerHandlerByPrefix("project_add_add_resource:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddAddResource } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddAddResource(interaction);
    } catch (error) {
      logger.error("Error handling project add resource:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Valider les coûts
  handler.registerHandlerByPrefix("project_add_validate_costs:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddValidateCosts } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddValidateCosts(interaction);
    } catch (error) {
      logger.error("Error handling project validate costs:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la validation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Blueprint - Non
  handler.registerHandlerByPrefix("project_add_blueprint_no:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddBlueprintNo } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddBlueprintNo(interaction);
    } catch (error) {
      logger.error("Error handling project blueprint no:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Blueprint - Oui
  handler.registerHandlerByPrefix("project_add_blueprint_yes:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddBlueprintYes } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddBlueprintYes(interaction);
    } catch (error) {
      logger.error("Error handling project blueprint yes:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la configuration.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Ajouter une ressource blueprint
  handler.registerHandlerByPrefix("project_add_add_blueprint_resource:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddAddBlueprintResource } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddAddBlueprintResource(interaction);
    } catch (error) {
      logger.error("Error handling project add blueprint resource:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de ressource blueprint.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Admin: Finaliser
  handler.registerHandlerByPrefix("project_add_finalize:", async (interaction: ButtonInteraction) => {
    try {
      const { handleProjectAddFinalize } = await import(
        "../admin/projects-admin.command.js"
      );
      await handleProjectAddFinalize(interaction);
    } catch (error) {
      logger.error("Error handling project finalize:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la finalisation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // User: Participer à un projet (avec pagination)
  handler.registerHandlerByPrefix("project_participate", async (interaction: ButtonInteraction) => {
    try {
      const { handleParticipateButton } = await import(
        "./projects.handlers.js"
      );
      await handleParticipateButton(interaction);
    } catch (error) {
      logger.error("Error handling project participate button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la participation au projet.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // User: Participer à un blueprint (avec pagination)
  handler.registerHandlerByPrefix("blueprint_participate", async (interaction: ButtonInteraction) => {
    try {
      const { handleParticipateButton } = await import(
        "./projects.handlers.js"
      );
      await handleParticipateButton(interaction);
    } catch (error) {
      logger.error("Error handling blueprint participate button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la participation au blueprint.`,
        flags: ["Ephemeral"],
      });
    }
  });
}
