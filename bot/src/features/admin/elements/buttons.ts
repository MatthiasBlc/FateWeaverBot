/**
 * Button handlers for Element Admin (Resources, Objects, Skills, Capabilities, Emojis)
 * Handles all button interactions for the /new-element-admin command
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../../utils/button-handler";
import { logger } from "../../../services/logger";
import { STATUS } from "@shared/constants/emojis";

/**
 * Register all Element Admin button handlers
 */
export function registerElementButtons(handler: ButtonHandler): void {
  // ========================================
  // CATEGORY SELECTION BUTTONS
  // ========================================

  handler.registerHandlerByPrefix("element_category_", async (interaction: ButtonInteraction) => {
    try {
      const { handleElementCategoryButton } = await import("./index.js");
      await handleElementCategoryButton(interaction);
    } catch (error) {
      logger.error("Error handling element category button:", { error });
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${STATUS.ERROR} Erreur lors de la sélection de la catégorie.`,
            flags: ["Ephemeral"],
          });
        }
      } catch (replyError) {
        logger.error("Cannot reply to element category interaction:", { replyError });
      }
    }
  });

  // ========================================
  // NEW ELEMENT BUTTONS (per category)
  // ========================================

  handler.registerHandler("new_element_resource", async (interaction: ButtonInteraction) => {
    try {
      const { handleNewResourceButton } = await import("./resource-handlers.js");
      await handleNewResourceButton(interaction);
    } catch (error) {
      logger.error("Error handling new resource button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création de la ressource.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("new_element_object", async (interaction: ButtonInteraction) => {
    try {
      const { handleNewObjectButton } = await import("./object-handlers.js");
      await handleNewObjectButton(interaction);
    } catch (error) {
      logger.error("Error handling new object button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création de l'objet.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("new_element_skill", async (interaction: ButtonInteraction) => {
    try {
      const { handleNewSkillButton } = await import("./skill-handlers.js");
      await handleNewSkillButton(interaction);
    } catch (error) {
      logger.error("Error handling new skill button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création de la compétence.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("new_element_capability", async (interaction: ButtonInteraction) => {
    try {
      const { handleNewCapabilityButton } = await import("./capability-handlers.js");
      await handleNewCapabilityButton(interaction);
    } catch (error) {
      logger.error("Error handling new capability button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la création de la capacité.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("new_element_emoji", async (interaction: ButtonInteraction) => {
    try {
      const { handleEmojiMenuButton } = await import("./emoji-handlers.js");
      await handleEmojiMenuButton(interaction);
    } catch (error) {
      logger.error("Error handling emoji menu button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'accès au menu des emojis.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // ========================================
  // EDIT ELEMENT BUTTONS
  // ========================================

  handler.registerHandler("edit_element_object", async (interaction: ButtonInteraction) => {
    try {
      const { handleEditObjectButton } = await import("./objects/object-display.js");
      await handleEditObjectButton(interaction);
    } catch (error) {
      logger.error("Error handling edit object button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la modification de l'objet.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Temporary handlers for not yet implemented features
  handler.registerHandler("edit_element_resource", async (interaction: ButtonInteraction) => {
    await interaction.reply({
      content: `⚠️ La modification de ressources n'est pas encore implémentée.`,
      flags: ["Ephemeral"],
    });
  });

  handler.registerHandler("edit_element_skill", async (interaction: ButtonInteraction) => {
    await interaction.reply({
      content: `⚠️ La modification de compétences n'est pas encore implémentée.`,
      flags: ["Ephemeral"],
    });
  });

  handler.registerHandler("edit_element_capability", async (interaction: ButtonInteraction) => {
    await interaction.reply({
      content: `⚠️ La modification de capacités n'est pas encore implémentée.`,
      flags: ["Ephemeral"],
    });
  });

  // ========================================
  // DELETE ELEMENT BUTTONS
  // ========================================

  handler.registerHandler("delete_element_object", async (interaction: ButtonInteraction) => {
    try {
      const { handleDeleteObjectButton } = await import("./objects/object-delete.js");
      await handleDeleteObjectButton(interaction);
    } catch (error) {
      logger.error("Error handling delete object button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la suppression de l'objet.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // Temporary handlers for not yet implemented features
  handler.registerHandler("delete_element_resource", async (interaction: ButtonInteraction) => {
    await interaction.reply({
      content: `⚠️ La suppression de ressources n'est pas encore implémentée.`,
      flags: ["Ephemeral"],
    });
  });

  handler.registerHandler("delete_element_skill", async (interaction: ButtonInteraction) => {
    await interaction.reply({
      content: `⚠️ La suppression de compétences n'est pas encore implémentée.`,
      flags: ["Ephemeral"],
    });
  });

  handler.registerHandler("delete_element_capability", async (interaction: ButtonInteraction) => {
    await interaction.reply({
      content: `⚠️ La suppression de capacités n'est pas encore implémentée.`,
      flags: ["Ephemeral"],
    });
  });

  // ========================================
  // EMOJI-SPECIFIC BUTTONS
  // ========================================

  handler.registerHandler("emoji_add", async (interaction: ButtonInteraction) => {
    try {
      const { handleEmojiAddButton } = await import("./emoji-handlers.js");
      await handleEmojiAddButton(interaction);
    } catch (error) {
      logger.error("Error handling emoji add button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout d'emoji.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("emoji_list", async (interaction: ButtonInteraction) => {
    try {
      const { handleEmojiListButton } = await import("./emoji-handlers.js");
      await handleEmojiListButton(interaction);
    } catch (error) {
      logger.error("Error handling emoji list button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage des emojis.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("emoji_remove", async (interaction: ButtonInteraction) => {
    try {
      const { handleEmojiRemoveButton } = await import("./emoji-handlers.js");
      await handleEmojiRemoveButton(interaction);
    } catch (error) {
      logger.error("Error handling emoji remove button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la suppression d'emoji.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("emoji_delete_confirm", async (interaction: ButtonInteraction) => {
    try {
      const { handleEmojiDeleteConfirmation } = await import("./emoji-handlers.js");
      await handleEmojiDeleteConfirmation(interaction);
    } catch (error) {
      logger.error("Error handling emoji delete confirmation:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la confirmation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("emoji_delete_cancel", async (interaction: ButtonInteraction) => {
    try {
      const { handleEmojiDeleteCancellation } = await import("./emoji-handlers.js");
      await handleEmojiDeleteCancellation(interaction);
    } catch (error) {
      logger.error("Error handling emoji delete cancellation:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'annulation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  // ========================================
  // OBJECT-SPECIFIC BUTTONS (with prefixes for dynamic IDs)
  // ========================================

  handler.registerHandlerByPrefix("object_edit_category:", async (interaction: ButtonInteraction) => {
    try {
      const { handleEditObjectCategory } = await import("./objects/object-display.js");
      // Parse customId: object_edit_category:{category}:{page}
      const parts = interaction.customId.split(':');
      const category = parts[1] as 'simple' | 'capacity' | 'skill' | 'resource';
      const page = parseInt(parts[2], 10);
      await handleEditObjectCategory(interaction, category, page);
    } catch (error) {
      logger.error("Error handling object edit category:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la sélection de la catégorie.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandlerByPrefix("object_modify_", async (interaction: ButtonInteraction) => {
    try {
      const customId = interaction.customId;

      // Dispatcher vers le bon handler en fonction de l'action
      if (customId.startsWith("object_modify_name:")) {
        const { handleModifyObjectNameButton } = await import("./objects/object-edit.js");
        await handleModifyObjectNameButton(interaction);
      } else if (customId.startsWith("object_modify_description:")) {
        const { handleModifyObjectDescriptionButton } = await import("./objects/object-edit.js");
        await handleModifyObjectDescriptionButton(interaction);
      } else if (customId.startsWith("object_modify_skills:")) {
        const { handleModifyObjectSkillsButton } = await import("./objects/object-bonus.js");
        await handleModifyObjectSkillsButton(interaction);
      } else if (customId.startsWith("object_modify_capabilities:")) {
        const { handleModifyObjectCapabilitiesButton } = await import("./objects/object-bonus.js");
        await handleModifyObjectCapabilitiesButton(interaction);
      } else {
        logger.warn(`Unknown object_modify action: ${customId}`);
        await interaction.reply({
          content: `${STATUS.ERROR} Action de modification inconnue.`,
          flags: ["Ephemeral"],
        });
      }
    } catch (error) {
      logger.error("Error handling object modify button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la modification.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandler("cancel_delete", async (interaction: ButtonInteraction) => {
    try {
      const { handleCancelDeleteButton } = await import("./index.js");
      await handleCancelDeleteButton(interaction);
    } catch (error) {
      logger.error("Error handling cancel delete button:", { error });
    }
  });

  // ========================================
  // OBJECT CREATION WORKFLOW BUTTONS
  // ========================================

  handler.registerHandlerByPrefix("object_done:", async (interaction: ButtonInteraction) => {
    try {
      const { handleObjectDoneButton } = await import("./object-handlers.js");
      await handleObjectDoneButton(interaction);
    } catch (error) {
      logger.error("Error handling object done button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la finalisation.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandlerByPrefix("object_add_skill_bonus:", async (interaction: ButtonInteraction) => {
    try {
      const { handleObjectAddSkillBonusButton } = await import("./object-handlers.js");
      await handleObjectAddSkillBonusButton(interaction);
    } catch (error) {
      logger.error("Error handling object add skill bonus button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de bonus compétence.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandlerByPrefix("object_add_capability_bonus:", async (interaction: ButtonInteraction) => {
    try {
      const { handleObjectAddCapabilityBonusButton } = await import("./object-handlers.js");
      await handleObjectAddCapabilityBonusButton(interaction);
    } catch (error) {
      logger.error("Error handling object add capability bonus button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de bonus capacité.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandlerByPrefix("object_add_resource_conversion:", async (interaction: ButtonInteraction) => {
    try {
      const { handleObjectAddResourceConversionButton } = await import("./object-handlers.js");
      await handleObjectAddResourceConversionButton(interaction);
    } catch (error) {
      logger.error("Error handling object add resource conversion button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'ajout de conversion.`,
        flags: ["Ephemeral"],
      });
    }
  });

  handler.registerHandlerByPrefix("object_skill_category:", async (interaction: ButtonInteraction) => {
    try {
      const { handleObjectSkillCategoryButton } = await import("./object-handlers.js");
      await handleObjectSkillCategoryButton(interaction);
    } catch (error) {
      logger.error("Error handling object skill category button:", { error });
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la sélection de catégorie.`,
        flags: ["Ephemeral"],
      });
    }
  });

  logger.info("✅ Element admin button handlers registered");
}
