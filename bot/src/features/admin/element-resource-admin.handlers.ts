/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ButtonInteraction,
  type ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { STATUS } from "../../constants/emojis";

/**
 * Gère le clic sur le bouton "Modifier Ressource"
 */
export async function handleEditResourceButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const resources = await apiService.resources.getAllResourceTypes();

    if (!resources || resources.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune ressource trouvée.`,
      });
      return;
    }

    const selectOptions = resources.map((r: any) => ({
      label: r.name,
      value: String(r.id),
      emoji: r.emoji,
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_resource_to_edit")
      .setPlaceholder("Sélectionnez une ressource")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez la ressource à modifier :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEditResourceButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la ressource.`,
    });
  }
}

/**
 * Gère la sélection d'une ressource à modifier
 */
export async function handleSelectResourceToEditMenu(
  interaction: any
) {
  try {
    const resourceId = parseInt(interaction.values[0], 10);
    const allResources = await apiService.resources.getAllResourceTypes();
    const resource = allResources.find((r: any) => r.id === resourceId);

    if (!resource) {
      await interaction.reply({
        content: `${STATUS.ERROR} Ressource non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_resource_modal:${resourceId}`)
      .setTitle("Modifier la ressource");

    const nameInput = new TextInputBuilder()
      .setCustomId("resource_name")
      .setLabel("Nom de la ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setValue(resource.name);

    const emojiInput = new TextInputBuilder()
      .setCustomId("resource_emoji")
      .setLabel("Emoji de la ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10)
      .setValue(resource.emoji);

    const categoryInput = new TextInputBuilder()
      .setCustomId("resource_category")
      .setLabel("Catégorie")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20)
      .setValue(resource.category);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("resource_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500)
      .setValue(resource.description || "");

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleSelectResourceToEditMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de modification de ressource
 */
export async function handleEditResourceModalSubmit(interaction: ModalSubmitInteraction) {
  const resourceId = parseInt(interaction.customId.split(':')[1], 10);
  const name = interaction.fields.getTextInputValue("resource_name");
  const emoji = interaction.fields.getTextInputValue("resource_emoji");
  const category = interaction.fields.getTextInputValue("resource_category");
  const description = interaction.fields.getTextInputValue("resource_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const validCategories = ["base", "transformé", "science"];
    if (!validCategories.includes(category)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : base, transformé ou science.`,
      });
      return;
    }

    await apiService.resources.updateResourceType(resourceId, {
      name,
      emoji,
      category,
      description,
    });

    logger.info("Ressource mise à jour", {
      resourceId,
      name,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Ressource modifiée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Emoji** : ${emoji}\n` +
        `**Catégorie** : ${category}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la modification de la ressource", {
      error: error instanceof Error ? error.message : error,
      resourceId,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la modification : ${errorMessage}`,
    });
  }
}

/**
 * Gère le clic sur le bouton "Supprimer Ressource"
 */
export async function handleDeleteResourceButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const resources = await apiService.resources.getAllResourceTypes();

    if (!resources || resources.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune ressource trouvée.`,
      });
      return;
    }

    const selectOptions = resources.map((r: any) => ({
      label: r.name,
      value: String(r.id),
      emoji: r.emoji,
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_resource_to_delete")
      .setPlaceholder("Sélectionnez une ressource")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez la ressource à supprimer :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleDeleteResourceButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la ressource.`,
    });
  }
}

/**
 * Gère la sélection d'une ressource à supprimer
 */
export async function handleSelectResourceToDeleteMenu(
  interaction: any
) {
  try {
    const resourceId = parseInt(interaction.values[0], 10);
    const allResources = await apiService.resources.getAllResourceTypes();
    const resource = allResources.find((r: any) => r.id === resourceId);

    if (!resource) {
      await interaction.reply({
        content: `${STATUS.ERROR} Ressource non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_resource:${resourceId}`)
      .setLabel("✅ Confirmer la suppression")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_delete")
      .setLabel("❌ Annuler")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirmButton,
      cancelButton
    );

    await interaction.update({
      content: `**Êtes-vous sûr de vouloir supprimer la ressource "${resource.name}" ?**\n\nCette action est irréversible.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleSelectResourceToDeleteMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la confirmation de suppression d'une ressource
 */
export async function handleConfirmDeleteResourceButton(interaction: ButtonInteraction) {
  try {
    const resourceId = parseInt(interaction.customId.split(':')[1], 10);

    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.resources.deleteResourceType(resourceId);

    logger.info("Ressource supprimée", {
      resourceId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Ressource supprimée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la suppression de la ressource", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la suppression : ${errorMessage}`,
    });
  }
}
